import { randomUUID } from "node:crypto";
import { SessionRepository } from "../storage/repositories/session-repo";
import { MessageRepository } from "../storage/repositories/message-repo";
import { KnovanaAgent } from "../agent/client";
import { SessionWarmPool } from "../agent/pool";
import { CHAT_SYSTEM_PROMPT } from "../agent/prompts/chat";
import { KnovanaSessionStore } from "../agent/session-store";
import type {
  ChatSession,
  ChatSessionListItem,
  ChatSessionWithMessages,
} from "../models/session";

export interface ChatInput {
  messages: { role: "user" | "assistant"; content: string }[];
  session_id?: string;
  context?: {
    page_url?: string;
    page_title?: string;
    selected_text?: string;
    selected_images?: { src: string; alt?: string }[];
  };
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
        this.sessionRepo.create(sessionId, this.userId, input.context);
        const firstUserMsg = input.messages.find((m) => m.role === "user");
        const title =
          firstUserMsg?.content.slice(0, 50).trim() || "New Web Capture";
        this.sessionRepo.updateTitle(sessionId, title);
      } else {
        this.sessionRepo.updateTimestamp(sessionId);
      }

      // Hybrid History Management
      if (input.messages.length > 1) {
        // Full sync mode: clear local SQLite history and overwrite
        this.messageRepo.clearSessionMessages(sessionId);
        for (const msg of input.messages) {
          this.messageRepo.create(sessionId, msg.role, msg.content);
        }
      } else if (input.messages.length === 1) {
        // Append mode: append the single message
        const singleMsg = input.messages[0];
        this.messageRepo.create(sessionId, singleMsg.role, singleMsg.content);
      }
    }

    // Extract the latest user message
    const lastUserMsg = input.messages[input.messages.length - 1];
    if (!lastUserMsg || lastUserMsg.role !== "user") {
      throw new Error(
        "The last message in the input list must be a user message.",
      );
    }

    // Inject page context if present
    const conversationPrompt = input.context
      ? this.injectContext(lastUserMsg.content, input.context)
      : lastUserMsg.content;

    const agent = new KnovanaAgent(this.userId, this.kbRoot);
    const sdkStream = agent.chat(
      conversationPrompt,
      CHAT_SYSTEM_PROMPT,
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
          this.sessionRepo.create(sessionId!, this.userId, input.context);
          const firstUserMsg = input.messages.find((m) => m.role === "user");
          const title =
            firstUserMsg?.content.slice(0, 50).trim() || "New Web Capture";
          this.sessionRepo.updateTitle(sessionId!, title);

          // Write history to SQLite
          for (const historyMsg of input.messages) {
            this.messageRepo.create(
              sessionId!,
              historyMsg.role,
              historyMsg.content,
            );
          }
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

  /**
   * Helper to format captured page context in the user prompt.
   */
  private injectContext(
    message: string,
    context: ChatInput["context"],
  ): string {
    const parts: string[] = [];
    if (context?.page_url) {
      parts.push(
        `【当前网页】: ${context.page_title || ""} (${context.page_url})`,
      );
    }
    if (context?.selected_text) {
      parts.push(`【用户选中的文本】:\n${context.selected_text}`);
    }
    if (context?.selected_images && context.selected_images.length > 0) {
      const imgLinks = context.selected_images.map((img) => img.src).join(", ");
      parts.push(`【用户选中的图片】: ${imgLinks}`);
    }

    return parts.length > 0
      ? `${parts.join("\n\n")}\n\n【用户指令】: ${message}`
      : message;
  }
}
