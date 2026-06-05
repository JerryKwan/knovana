import { randomUUID } from "node:crypto";
import { SessionRepository } from "../storage/repositories/session-repo";
import { MessageRepository } from "../storage/repositories/message-repo";
import { KnovanaAgent } from "../agent/client";
import { CHAT_SYSTEM_PROMPT } from "../agent/prompts/chat";
import type {
  ChatSession,
  ChatSessionListItem,
  ChatSessionWithMessages,
} from "../models/session";

export interface ChatInput {
  message: string;
  sessionId?: string;
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
    const sessionId =
      input.sessionId || `sess_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    // Create session if it is new
    if (!input.sessionId) {
      this.sessionRepo.create(sessionId, this.userId, input.context);
      const title = input.message.slice(0, 50).trim() || "New Web Capture";
      this.sessionRepo.updateTitle(sessionId, title);
    } else {
      this.sessionRepo.updateTimestamp(sessionId);
    }

    // Save the user's message
    this.messageRepo.create(sessionId, "user", input.message);

    // Inject context into the user's instruction
    const promptMessage = input.context
      ? this.injectContext(input.message, input.context)
      : input.message;

    // Load past message history for context window
    const history = this.messageRepo.listBySession(sessionId);
    // Combine history messages into a single prompt context if the Agent loop needs it,
    // or let the Agent handle current message with injected history context
    const conversationPrompt = this.compileHistoryPrompt(
      promptMessage,
      history,
    );

    const agent = new KnovanaAgent(this.userId, this.kbRoot);
    const sdkStream = agent.chat(conversationPrompt, CHAT_SYSTEM_PROMPT);

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
    this.messageRepo.create(sessionId, "assistant", fullAssistantResponse);

    // Yield final PSP message_end event
    yield {
      event: "message_end",
      data: {
        type: "message_end",
      },
    };
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

  /**
   * Compiles recent history as contextual prefixes for a stateless agent execution.
   */
  private compileHistoryPrompt(currentMessage: string, history: any[]): string {
    if (history.length <= 1) {
      return currentMessage; // No history or just the current message
    }

    // Compile last 10 messages as text context
    const contextLines = history
      .slice(-10, -1) // Exclude current user message which is appended manually
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
      );

    return `以下是先前的对话上下文历史：\n${contextLines.join("\n")}\n\n当前用户新消息：\n${currentMessage}`;
  }
}
