import { randomUUID } from "node:crypto";
import { getDatabase } from "../storage/database";
import { SessionRepository } from "../storage/repositories/session-repo";
import { MessageRepository } from "../storage/repositories/message-repo";
import { KnovanaAgent } from "../agent/client";
import { SessionWarmPool } from "../agent/pool";
import { SYSTEM_PROMPT } from "../agent/prompts/system-prompt";
import { KnovanaSessionStore } from "../agent/session-store";
import type {
  ChatSession,
  ChatSessionListItem,
  ChatSessionWithMessages,
} from "../models/session";

export interface ChatInput {
  message: string;
  session_id?: string;
}

export class ChatService {
  private readonly sessionRepo = new SessionRepository();
  private readonly messageRepo = new MessageRepository();

  constructor(
    private readonly userId: string,
    private readonly kbRoot: string,
  ) {}

  /**
   * Orchestrates the agent chat execution, yielding Prism Stream Protocol (PSP) v1 events.
   * Compiles the text response to log in SQLite once finished.
   */
  async *chat(input: ChatInput): AsyncGenerator<{ event: string; data: any }> {
    let sessionId = input.session_id;

    // Check if the session actually has entries in the session store to decide whether to resume
    let shouldResume = false;
    if (sessionId) {
      const store = new KnovanaSessionStore(this.userId);
      const entries = await store.load({ projectKey: this.userId, sessionId });
      if (entries && entries.length > 0) {
        shouldResume = true;
      }
    }

    if (shouldResume && sessionId) {
      // Ensure the session exists in SQLite before recording messages to avoid FOREIGN KEY errors
      const session = this.sessionRepo.get(sessionId);
      if (!session) {
        this.sessionRepo.create(sessionId, this.userId);
        const title = input.message.slice(0, 50).trim() || "New Web Capture";
        this.sessionRepo.updateTitle(sessionId, title);
      } else {
        this.sessionRepo.updateTimestamp(sessionId);
      }

      // Append the single user message to SQLite
      this.messageRepo.create(sessionId, "user", input.message);
    }

    const agent = new KnovanaAgent(this.userId, this.kbRoot);
    const sdkStream = agent.chat(
      input.message,
      SYSTEM_PROMPT,
      shouldResume ? sessionId : undefined,
    );

    const assistantMessageId = `msg_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    // Yield initial PSP message_start event
    yield {
      event: "message_start",
      data: {
        type: "message_start",
        message: {
          id: assistantMessageId,
          role: "assistant",
          content: [],
          created_at: new Date().toISOString(),
        },
      },
    };

    const textChunks: string[] = [];
    let blockIndexOffset = 0;
    const contentBlocksCache: any[] = [];

    let dbInitialized = shouldResume;

    for await (const msg of sdkStream) {
      if (!dbInitialized) {
        const generatedId =
          (msg as any).session_id || (msg as any).message?.session_id;
        if (generatedId) {
          sessionId = generatedId;

          // Ensure the session exists in SQLite
          this.sessionRepo.create(sessionId!, this.userId);
          const title = input.message.slice(0, 50).trim() || "New Web Capture";
          this.sessionRepo.updateTitle(sessionId!, title);

          // Write history to SQLite
          this.messageRepo.create(sessionId!, "user", input.message);
          dbInitialized = true;

          // Yield the session_created event to the client
          yield {
            event: "session_created",
            data: {
              sessionId,
            },
          };
        }
      }

      if (msg.type === "stream_event") {
        const ev = msg.event;

        if (ev.type === "content_block_start") {
          const block: any = { ...ev.content_block };
          if (block.type === "tool_use") {
            block.type = "tool_call";
            block.input = {};
          } else if (block.type === "text") {
            block.text = "";
          }
          contentBlocksCache[ev.index] = block;

          yield {
            event: "content_block_start",
            data: {
              type: "content_block_start",
              index: ev.index,
              content_block: block,
            },
          };
        } else if (ev.type === "content_block_delta") {
          const block = contentBlocksCache[ev.index];
          if (block) {
            if (ev.delta.type === "text_delta") {
              textChunks.push(ev.delta.text);
              block.text = (block.text || "") + ev.delta.text;
            } else if (ev.delta.type === "input_json_delta") {
              block.partial_json =
                (block.partial_json || "") + ev.delta.partial_json;
            }
          }

          yield {
            event: "content_block_delta",
            data: {
              type: "content_block_delta",
              index: ev.index,
              delta: ev.delta,
            },
          };
        } else if (ev.type === "content_block_stop") {
          const block = contentBlocksCache[ev.index] || {
            type: "text",
            text: "",
          };
          if (block.type === "tool_call" && block.partial_json) {
            try {
              block.input = JSON.parse(block.partial_json);
            } catch (e) {
              // Fallback if incomplete
            }
            delete block.partial_json;
          }

          yield {
            event: "content_block_stop",
            data: {
              type: "content_block_stop",
              index: ev.index,
              content_block: block,
            },
          };
        } else if (ev.type === "message_delta") {
          yield {
            event: "message_delta",
            data: {
              type: "message_delta",
              delta: {
                stop_reason: ev.delta.stop_reason || "end_turn",
              },
              usage: (ev as any).usage || (msg as any).usage,
            },
          };
        }
      } else if (msg.type === "user") {
        // Intercept tool outputs sent back to the LLM to emit tool_result events
        const contentBlocks = msg.message.content || [];
        for (let i = 0; i < contentBlocks.length; i++) {
          const block = contentBlocks[i];
          if (typeof block !== "string" && block.type === "tool_result") {
            const toolCallId = block.tool_use_id;
            const index = 100 + blockIndexOffset++;

            yield {
              event: "content_block_start",
              data: {
                type: "content_block_start",
                index,
                content_block: {
                  type: "tool_result",
                  tool_call_id: toolCallId,
                },
              },
            };

            yield {
              event: "content_block_stop",
              data: {
                type: "content_block_stop",
                index,
                content_block: {
                  type: "tool_result",
                  tool_call_id: toolCallId,
                  status: block.is_error ? "error" : "success",
                  content: block.content,
                },
              },
            };
          }
        }
      }
    }

    // Save assistant's compiled reply to the database
    const fullAssistantResponse = textChunks.join("");
    this.messageRepo.create(sessionId!, "assistant", fullAssistantResponse);

    // Yield final PSP message_end event
    yield {
      event: "message_end",
      data: {
        type: "message_end",
      },
    };
  }

  createSession(title?: string, context?: any): ChatSession {
    const sessionId = randomUUID();
    const session = this.sessionRepo.create(sessionId, this.userId, context);
    if (title) {
      this.sessionRepo.updateTitle(sessionId, title);
    }
    return this.sessionRepo.get(sessionId)!;
  }

  listSessions(
    page = 1,
    perPage = 20,
  ): { sessions: ChatSessionListItem[]; total: number; page: number } {
    const { items, total } = this.sessionRepo.listByUser(
      this.userId,
      page,
      perPage,
    );
    return {
      sessions: items,
      total,
      page,
    };
  }

  getSession(sessionId: string): ChatSessionWithMessages {
    const session = this.sessionRepo.get(sessionId);
    if (!session) {
      throw new Error(`Chat session not found: ${sessionId}`);
    }

    const messages = this.messageRepo.listBySession(sessionId);
    return {
      ...session,
      messages,
    };
  }

  deleteSession(sessionId: string): void {
    const session = this.sessionRepo.get(sessionId);
    if (session && session.user_id === this.userId) {
      this.sessionRepo.delete(sessionId);
      this.messageRepo.clearSessionMessages(sessionId);
      const store = new KnovanaSessionStore(this.userId);
      store.delete({ projectKey: this.userId, sessionId });
    }
  }

  deleteMessage(sessionId: string, messageId: string): void {
    // 1. Delete message from chat_messages
    this.messageRepo.deleteMessage(sessionId, messageId);

    // 2. Clear external session store entries to force a rebuild on next turn
    const store = new KnovanaSessionStore(this.userId);
    store.delete({ projectKey: this.userId, sessionId });

    // 3. Clear warm query process for this session so that it does not use stale state
    const staleWarmQuery = SessionWarmPool.pop(this.userId, sessionId);
    if (staleWarmQuery) {
      staleWarmQuery.close();
    }
  }



  async *regenerate(sessionId: string): AsyncGenerator<{ event: string; data: any }> {
    // 1. Get the last user message and assistant message in SQLite
    const messages = this.messageRepo.listBySession(sessionId);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) {
      throw new Error("No user message found to regenerate.");
    }

    // 2. Prune the Claude Session Store
    // We count the number of user messages in history prior to the last user message.
    const userMsgs = messages.filter((m) => m.role === "user");
    const k = userMsgs.length - 1; // Number of user messages in history excluding the last one

    this.pruneSessionStore(sessionId, k);

    // 3. Delete any assistant messages generated after the last user message from SQLite chat_messages
    const lastUserMsgIndex = messages.findIndex((m) => m.id === lastUserMsg.id);
    const messagesToDelete = messages.slice(lastUserMsgIndex + 1);
    for (const msg of messagesToDelete) {
      if (msg.role === "assistant") {
        this.messageRepo.deleteMessage(sessionId, msg.id);
      }
    }

    // 4. Update the session timestamp
    this.sessionRepo.updateTimestamp(sessionId);

    // 5. Query the agent
    const agent = new KnovanaAgent(this.userId, this.kbRoot);
    const sdkStream = agent.chat(
      lastUserMsg.content,
      SYSTEM_PROMPT,
      sessionId,
    );

    const assistantMessageId = `msg_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    // Yield initial PSP message_start event
    yield {
      event: "message_start",
      data: {
        type: "message_start",
        message: {
          id: assistantMessageId,
          role: "assistant",
          content: [],
          created_at: new Date().toISOString(),
        },
      },
    };

    const textChunks: string[] = [];
    let blockIndexOffset = 0;
    const contentBlocksCache: any[] = [];

    for await (const msg of sdkStream) {
      if (msg.type === "stream_event") {
        const ev = msg.event;

        if (ev.type === "content_block_start") {
          const block: any = { ...ev.content_block };
          if (block.type === "tool_use") {
            block.type = "tool_call";
            block.input = {};
          } else if (block.type === "text") {
            block.text = "";
          }
          contentBlocksCache[ev.index] = block;

          yield {
            event: "content_block_start",
            data: {
              type: "content_block_start",
              index: ev.index,
              content_block: block,
            },
          };
        } else if (ev.type === "content_block_delta") {
          const block = contentBlocksCache[ev.index];
          if (block) {
            if (ev.delta.type === "text_delta") {
              textChunks.push(ev.delta.text);
              block.text = (block.text || "") + ev.delta.text;
            } else if (ev.delta.type === "input_json_delta") {
              block.partial_json =
                (block.partial_json || "") + ev.delta.partial_json;
            }
          }

          yield {
            event: "content_block_delta",
            data: {
              type: "content_block_delta",
              index: ev.index,
              delta: ev.delta,
            },
          };
        } else if (ev.type === "content_block_stop") {
          const block = contentBlocksCache[ev.index] || {
            type: "text",
            text: "",
          };
          if (block.type === "tool_call" && block.partial_json) {
            try {
              block.input = JSON.parse(block.partial_json);
            } catch (e) {
              // Fallback
            }
            delete block.partial_json;
          }

          yield {
            event: "content_block_stop",
            data: {
              type: "content_block_stop",
              index: ev.index,
              content_block: block,
            },
          };
        } else if (ev.type === "message_delta") {
          yield {
            event: "message_delta",
            data: {
              type: "message_delta",
              delta: {
                stop_reason: ev.delta.stop_reason || "end_turn",
              },
              usage: (ev as any).usage || (msg as any).usage,
            },
          };
        }
      } else if (msg.type === "user") {
        const contentBlocks = msg.message.content || [];
        for (let i = 0; i < contentBlocks.length; i++) {
          const block = contentBlocks[i];
          if (typeof block !== "string" && block.type === "tool_result") {
            const toolCallId = block.tool_use_id;
            const index = 100 + blockIndexOffset++;

            yield {
              event: "content_block_start",
              data: {
                type: "content_block_start",
                index,
                content_block: {
                  type: "tool_result",
                  tool_call_id: toolCallId,
                },
              },
            };

            yield {
              event: "content_block_stop",
              data: {
                type: "content_block_stop",
                index,
                content_block: {
                  type: "tool_result",
                  tool_call_id: toolCallId,
                  status: block.is_error ? "error" : "success",
                  content: block.content,
                },
              },
            };
          }
        }
      }
    }

    const fullAssistantResponse = textChunks.join("");
    this.messageRepo.create(sessionId, "assistant", fullAssistantResponse);

    yield {
      event: "message_end",
      data: {
        type: "message_end",
      },
    };
  }

  private pruneSessionStore(
    sessionId: string,
    k: number,
  ): void {
    const db = getDatabase();

    // Find all entries for this session in order to locate the (k + 1)-th 'user' type entry
    const rows = db
      .prepare(
        `SELECT id, data FROM claude_session_entries 
         WHERE project_key = ? AND session_id = ? AND subpath IS NULL
         ORDER BY id ASC`,
      )
      .all(this.userId, sessionId) as { id: number; data: string }[];

    let userCount = 0;
    let boundaryId: number | undefined = undefined;

    for (const row of rows) {
      try {
        const entry = JSON.parse(row.data);
        if (entry.type === "user") {
          userCount++;
          if (userCount === k + 1) {
            boundaryId = row.id;
            break;
          }
        }
      } catch (err) {
        // Ignore JSON parsing issues
      }
    }

    if (boundaryId !== undefined) {
      console.log(
        `[ChatService] Regenerating: Pruning session store entries from ID ${boundaryId} for session ${sessionId} (k=${k})`,
      );
      // Delete all entries starting from the boundary ID (including any subagents/subpaths)
      db.prepare(
        "DELETE FROM claude_session_entries WHERE project_key = ? AND session_id = ? AND id >= ?",
      ).run(this.userId, sessionId, boundaryId);

      // Invalidate the warm pool process to avoid using stale state
      const staleWarmQuery = SessionWarmPool.pop(this.userId, sessionId);
      if (staleWarmQuery) {
        staleWarmQuery.close();
      }
    }
  }
}
