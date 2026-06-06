import { randomUUID } from "node:crypto";
import { getDatabase } from "../storage/database";
import { SessionRepository } from "../storage/repositories/session-repo";
import { MessageRepository } from "../storage/repositories/message-repo";
import { KnovanaAgent } from "../agent/client";
import { SessionWarmPool } from "../agent/pool";
import { SYSTEM_PROMPT } from "../agent/prompts/system-prompt";
import { KnovanaSessionStore } from "../agent/session-store";
import { config } from "../config";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type {
  ChatSession,
  ChatSessionListItem,
  ChatSessionWithMessages,
} from "../models/session";

export interface ChatInput {
  message: string;
  session_id?: string;
}

type PspChunk = { event: string; data: any };

interface ChatAgent {
  chat(
    message: string,
    systemPrompt: string,
    sessionId?: string,
  ): AsyncGenerator<SDKMessage>;
}

type ChatAgentFactory = (userId: string, kbRoot: string) => ChatAgent;

interface PspConversionState {
  textChunks: string[];
  assistantTexts: string[];
  nextBlockIndex: number;
  sdkIndexToPspIndex: Map<number, number>;
  contentBlocksCache: Map<number, any>;
  currentAssistantHadStreamBlocks: boolean;
}

interface StreamAgentResponseInput {
  sdkStream: AsyncIterable<SDKMessage>;
  userMessage: string;
  sessionId?: string;
  dbInitialized: boolean;
  emitSessionCreated: boolean;
}

export class ChatService {
  private readonly sessionRepo = new SessionRepository();
  private readonly messageRepo = new MessageRepository();

  constructor(
    private readonly userId: string,
    private readonly kbRoot: string,
    private readonly agentFactory: ChatAgentFactory = (userId, kbRoot) =>
      new KnovanaAgent(userId, kbRoot),
  ) {}

  /**
   * Orchestrates the agent chat execution, yielding Prism Stream Protocol (PSP) v1 events.
   * Compiles the text response to log in SQLite once finished.
   */
  async *chat(input: ChatInput): AsyncGenerator<PspChunk> {
    const sessionId = input.session_id;

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
      this.ensureSessionForUserMessage(
        sessionId,
        input.message,
        "New Web Capture",
      );
    }

    const agent = this.agentFactory(this.userId, this.kbRoot);
    const sdkStream = agent.chat(
      input.message,
      SYSTEM_PROMPT,
      shouldResume ? sessionId : undefined,
    );

    yield* this.streamAgentResponse({
      sdkStream,
      userMessage: input.message,
      sessionId,
      dbInitialized: shouldResume,
      emitSessionCreated: !shouldResume,
    });
  }

  createSession(title?: string, context?: any): ChatSession {
    const sessionId = randomUUID();
    this.sessionRepo.create(sessionId, this.userId, context);
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

  async *regenerate(sessionId: string): AsyncGenerator<PspChunk> {
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
    const agent = this.agentFactory(this.userId, this.kbRoot);
    const sdkStream = agent.chat(lastUserMsg.content, SYSTEM_PROMPT, sessionId);

    yield* this.streamAgentResponse({
      sdkStream,
      userMessage: lastUserMsg.content,
      sessionId,
      dbInitialized: true,
      emitSessionCreated: false,
    });
  }

  private async *streamAgentResponse({
    sdkStream,
    userMessage,
    sessionId,
    dbInitialized,
    emitSessionCreated,
  }: StreamAgentResponseInput): AsyncGenerator<PspChunk> {
    const messageStart = this.createMessageStartChunk();
    this.logPspChunk("initial", messageStart);
    yield messageStart;

    const state = this.createPspConversionState();

    for await (const msg of sdkStream) {
      this.logSdkMessage(msg);
      const generatedSessionId = this.getSdkSessionId(msg);
      if (generatedSessionId && !sessionId) {
        sessionId = generatedSessionId;
      }

      if (!dbInitialized && generatedSessionId) {
        sessionId = generatedSessionId;
        this.ensureSessionForUserMessage(sessionId, userMessage, "New Chat");
        dbInitialized = true;

        if (emitSessionCreated) {
          const sessionCreated = {
            event: "session_created",
            data: {
              type: "session_created",
              session_id: sessionId,
              sessionId,
            },
          };
          this.logPspChunk("session", sessionCreated);
          yield sessionCreated;
        }
      }

      const chunks = Array.from(this.convertSdkMessageToPsp(msg, state));
      if (
        chunks.length === 0 &&
        config.agentTrace &&
        this.shouldLogEmptyConversion(msg)
      ) {
        console.log("[ChatService] SDK message produced no PSP chunks", {
          sdk: this.summarizeSdkMessage(msg),
        });
      }
      for (const chunk of chunks) {
        this.logPspChunk("converted", chunk);
        yield chunk;
      }
    }

    if (!sessionId) {
      throw new Error("Agent stream ended before providing a session id.");
    }

    const fullAssistantResponse =
      state.assistantTexts.length > 0
        ? state.assistantTexts.join("")
        : state.textChunks.join("");
    this.messageRepo.create(sessionId, "assistant", fullAssistantResponse);

    const messageEnd = {
      event: "message_end",
      data: {
        type: "message_end",
      },
    };
    this.logPspChunk("final", messageEnd);
    yield messageEnd;
  }

  private *convertSdkMessageToPsp(
    msg: SDKMessage,
    state: PspConversionState,
  ): Generator<PspChunk> {
    if (msg.type === "system") {
      const status = this.toStatusChunk(msg);
      if (status) {
        yield status;
      }
      return;
    }

    if (msg.type === "assistant") {
      if (msg.error || (msg as any).message?.model === "<synthetic>") {
        const errorText =
          this.extractTextFromContent((msg as any).message?.content) ||
          msg.error ||
          "Assistant error";
        throw new Error(errorText);
      }

      const content = (msg as any).message?.content;
      const assistantText = this.extractTextFromContent(content);
      if (assistantText) {
        state.assistantTexts.push(assistantText);
      }

      const hadStreamBlocks = state.currentAssistantHadStreamBlocks;
      if (!hadStreamBlocks) {
        yield* this.emitCompleteAssistantBlocks(content, state);
        this.resetCurrentAssistantStream(state);
      }
      return;
    }

    if (msg.type === "result" && (msg as any).is_error) {
      const errors = (msg as any).errors;
      throw new Error(
        (Array.isArray(errors) && errors.length > 0
          ? errors.join("\n")
          : (msg as any).result) || "API error occurred during execution",
      );
    }

    if (msg.type === "stream_event") {
      yield* this.convertStreamEventToPsp((msg as any).event, state);
      return;
    }

    if (msg.type === "user") {
      yield* this.emitToolResultBlocks((msg as any).message?.content, state);
    }
  }

  private *convertStreamEventToPsp(
    ev: any,
    state: PspConversionState,
  ): Generator<PspChunk> {
    if (ev.type === "message_start") {
      this.resetCurrentAssistantStream(state);
      return;
    }

    if (ev.type === "content_block_start") {
      const index = this.allocatePspIndex(state, ev.index);
      const block = this.toPspBlock(ev.content_block, "start");
      state.contentBlocksCache.set(
        index,
        this.toPspBlock(ev.content_block, "final"),
      );
      state.currentAssistantHadStreamBlocks = true;

      yield {
        event: "content_block_start",
        data: {
          type: "content_block_start",
          index,
          content_block: block,
        },
      };
      return;
    }

    if (ev.type === "content_block_delta") {
      const delta = this.normalizeDelta(ev.delta);
      if (!delta) {
        return;
      }

      let index = state.sdkIndexToPspIndex.get(ev.index);
      if (index === undefined) {
        const fallbackBlock = this.createFallbackBlockForDelta(delta);
        index = this.allocatePspIndex(state, ev.index);
        state.contentBlocksCache.set(index, fallbackBlock);
        state.currentAssistantHadStreamBlocks = true;
        yield {
          event: "content_block_start",
          data: {
            type: "content_block_start",
            index,
            content_block: { ...fallbackBlock },
          },
        };
      }

      const block = state.contentBlocksCache.get(index);
      if (block) {
        this.applyDeltaToCachedBlock(block, delta, state);
      }

      yield {
        event: "content_block_delta",
        data: {
          type: "content_block_delta",
          index,
          delta,
        },
      };
      return;
    }

    if (ev.type === "content_block_stop") {
      let index = state.sdkIndexToPspIndex.get(ev.index);
      if (index === undefined) {
        index = this.allocatePspIndex(state, ev.index);
        state.contentBlocksCache.set(index, { type: "text", text: "" });
        state.currentAssistantHadStreamBlocks = true;
        yield {
          event: "content_block_start",
          data: {
            type: "content_block_start",
            index,
            content_block: { type: "text", text: "" },
          },
        };
      }

      const block = state.contentBlocksCache.get(index) || {
        type: "text",
        text: "",
      };
      this.finalizeCachedBlock(block);

      yield {
        event: "content_block_stop",
        data: {
          type: "content_block_stop",
          index,
          content_block: block,
        },
      };
      return;
    }

    if (ev.type === "message_delta") {
      yield {
        event: "message_delta",
        data: {
          type: "message_delta",
          delta: {
            stop_reason: ev.delta?.stop_reason || "end_turn",
          },
          usage: ev.usage,
        },
      };
    }
  }

  private *emitCompleteAssistantBlocks(
    content: unknown,
    state: PspConversionState,
  ): Generator<PspChunk> {
    if (typeof content === "string") {
      const block = { type: "text", text: content };
      yield* this.emitCompleteBlock({ type: "text", text: "" }, block, state);
      return;
    }

    const contentBlocks = Array.isArray(content) ? content : [];

    for (const rawBlock of contentBlocks) {
      if (typeof rawBlock === "string") {
        const block = { type: "text", text: rawBlock };
        yield* this.emitCompleteBlock(block, block, state);
        continue;
      }

      const startBlock = this.toPspBlock(rawBlock, "start");
      const finalBlock = this.toPspBlock(rawBlock, "final");
      yield* this.emitCompleteBlock(startBlock, finalBlock, state);
    }
  }

  private *emitCompleteBlock(
    startBlock: any,
    finalBlock: any,
    state: PspConversionState,
  ): Generator<PspChunk> {
    const index = state.nextBlockIndex++;
    this.finalizeCachedBlock(finalBlock);

    yield {
      event: "content_block_start",
      data: {
        type: "content_block_start",
        index,
        content_block: startBlock,
      },
    };

    yield {
      event: "content_block_stop",
      data: {
        type: "content_block_stop",
        index,
        content_block: finalBlock,
      },
    };
  }

  private *emitToolResultBlocks(
    content: unknown,
    state: PspConversionState,
  ): Generator<PspChunk> {
    const contentBlocks = Array.isArray(content) ? content : [];

    for (const block of contentBlocks) {
      if (typeof block === "string" || block.type !== "tool_result") {
        continue;
      }

      const index = state.nextBlockIndex++;
      const toolCallId = block.tool_use_id;

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

  private createMessageStartChunk(): PspChunk {
    const assistantMessageId = `msg_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    return {
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
  }

  private createPspConversionState(): PspConversionState {
    return {
      textChunks: [],
      assistantTexts: [],
      nextBlockIndex: 0,
      sdkIndexToPspIndex: new Map(),
      contentBlocksCache: new Map(),
      currentAssistantHadStreamBlocks: false,
    };
  }

  private ensureSessionForUserMessage(
    sessionId: string,
    message: string,
    fallbackTitle: string,
  ): void {
    const session = this.sessionRepo.get(sessionId);
    if (!session) {
      this.sessionRepo.create(sessionId, this.userId);
      const title = message.slice(0, 50).trim() || fallbackTitle;
      this.sessionRepo.updateTitle(sessionId, title);
    } else {
      this.sessionRepo.updateTimestamp(sessionId);
    }

    this.messageRepo.create(sessionId, "user", message);
  }

  private toStatusChunk(msg: any): PspChunk | null {
    if (msg.subtype === "init") {
      return {
        event: "status",
        data: {
          type: "status",
          text: `正在启动智能助手 (模型: ${msg.model || "claude"})...`,
          indicator: "loading",
        },
      };
    }

    if (msg.subtype === "status" && msg.status === "requesting") {
      return {
        event: "status",
        data: {
          type: "status",
          text: "正在连接 API...",
          indicator: "thinking",
        },
      };
    }

    if (msg.subtype === "api_retry") {
      return {
        event: "status",
        data: {
          type: "status",
          text: `API 连接失败，正在进行第 ${msg.attempt}/${msg.max_retries} 次重试...`,
          indicator: "loading",
        },
      };
    }

    if (msg.subtype === "hook_started") {
      return {
        event: "status",
        data: {
          type: "status",
          text: "正在准备智能助手运行环境...",
          indicator: "loading",
        },
      };
    }

    if (msg.subtype === "hook_response" && msg.outcome === "error") {
      return {
        event: "status",
        data: {
          type: "status",
          text: "智能助手运行环境准备时遇到问题，正在继续尝试...",
          indicator: "loading",
        },
      };
    }

    return null;
  }

  private getSdkSessionId(msg: SDKMessage): string | undefined {
    return (msg as any).session_id || (msg as any).message?.session_id;
  }

  private logSdkMessage(msg: SDKMessage): void {
    if (!config.agentTrace) {
      return;
    }

    console.log(
      "[ChatService] SDK -> PSP input",
      this.summarizeSdkMessage(msg),
    );
  }

  private logPspChunk(stage: string, chunk: PspChunk): void {
    if (!config.agentTrace) {
      return;
    }

    console.log("[ChatService] PSP output", {
      stage,
      ...this.summarizePspChunk(chunk),
    });
  }

  private shouldLogEmptyConversion(msg: SDKMessage): boolean {
    const anyMsg = msg as any;

    if (anyMsg.type === "system") {
      return false;
    }

    if (
      anyMsg.type === "stream_event" &&
      (anyMsg.event?.type === "message_start" ||
        anyMsg.event?.type === "message_stop")
    ) {
      return false;
    }

    if (anyMsg.type === "result" && !anyMsg.is_error) {
      return false;
    }

    return true;
  }

  private summarizeSdkMessage(msg: SDKMessage): Record<string, unknown> {
    const anyMsg = msg as any;
    const summary: Record<string, unknown> = {
      type: anyMsg.type,
      session_id: anyMsg.session_id,
    };

    if (anyMsg.type === "system") {
      summary.subtype = anyMsg.subtype;
      summary.status = anyMsg.status;
      summary.model = anyMsg.model;
      summary.attempt = anyMsg.attempt;
      summary.max_retries = anyMsg.max_retries;
      return summary;
    }

    if (anyMsg.type === "stream_event") {
      summary.event_type = anyMsg.event?.type;
      summary.index = anyMsg.event?.index;
      summary.delta_type = anyMsg.event?.delta?.type;
      summary.block_type = anyMsg.event?.content_block?.type;
      summary.text_length =
        anyMsg.event?.delta?.text?.length ??
        anyMsg.event?.delta?.thinking?.length;
      summary.partial_json_length = anyMsg.event?.delta?.partial_json?.length;
      return summary;
    }

    if (anyMsg.type === "assistant" || anyMsg.type === "user") {
      const content = anyMsg.message?.content;
      summary.model = anyMsg.message?.model;
      summary.stop_reason = anyMsg.message?.stop_reason;
      summary.content = this.summarizeContent(content);
      return summary;
    }

    if (anyMsg.type === "result") {
      summary.is_error = anyMsg.is_error;
      summary.subtype = anyMsg.subtype;
    }

    return summary;
  }

  private summarizePspChunk(chunk: PspChunk): Record<string, unknown> {
    const data = chunk.data || {};
    const summary: Record<string, unknown> = {
      event: chunk.event,
      type: data.type,
    };

    if (typeof data.index === "number") {
      summary.index = data.index;
    }
    if (data.content_block) {
      summary.block = this.summarizeBlock(data.content_block);
    }
    if (data.delta) {
      summary.delta_type = data.delta.type;
      summary.text_length =
        data.delta.text?.length ?? data.delta.thinking?.length;
      summary.partial_json_length = data.delta.partial_json?.length;
    }
    if (data.text) {
      summary.status_text = data.text;
    }
    if (data.delta?.stop_reason) {
      summary.stop_reason = data.delta.stop_reason;
    }

    return summary;
  }

  private summarizeContent(content: unknown): unknown {
    if (typeof content === "string") {
      return { kind: "string", length: content.length };
    }

    if (!Array.isArray(content)) {
      return { kind: typeof content };
    }

    return content.map((block) => this.summarizeBlock(block));
  }

  private summarizeBlock(block: unknown): Record<string, unknown> {
    if (!block || typeof block !== "object") {
      return { kind: typeof block };
    }

    const anyBlock = block as any;
    return {
      type: anyBlock.type,
      id: anyBlock.id || anyBlock.tool_use_id || anyBlock.tool_call_id,
      name: anyBlock.name,
      text_length: anyBlock.text?.length ?? anyBlock.thinking?.length,
      content_length:
        typeof anyBlock.content === "string"
          ? anyBlock.content.length
          : undefined,
      is_error: anyBlock.is_error,
      status: anyBlock.status,
    };
  }

  private allocatePspIndex(
    state: PspConversionState,
    sdkIndex: number,
  ): number {
    const index = state.nextBlockIndex++;
    state.sdkIndexToPspIndex.set(sdkIndex, index);
    return index;
  }

  private resetCurrentAssistantStream(state: PspConversionState): void {
    state.sdkIndexToPspIndex = new Map();
    state.currentAssistantHadStreamBlocks = false;
  }

  private toPspBlock(rawBlock: any, phase: "start" | "final"): any {
    if (!rawBlock || typeof rawBlock !== "object") {
      return { type: "text", text: "" };
    }

    if (this.isToolUseBlock(rawBlock)) {
      return {
        type: "tool_call",
        id: rawBlock.id || rawBlock.tool_use_id || "",
        name: rawBlock.name || rawBlock.tool_name || rawBlock.type,
        input: phase === "start" ? {} : rawBlock.input || {},
      };
    }

    if (rawBlock.type === "text") {
      return {
        ...rawBlock,
        text: phase === "start" ? "" : rawBlock.text || "",
      };
    }

    if (rawBlock.type === "thinking") {
      return {
        type: "thinking",
        text: phase === "start" ? "" : rawBlock.thinking || rawBlock.text || "",
      };
    }

    return { ...rawBlock };
  }

  private isToolUseBlock(block: any): boolean {
    return (
      block.type === "tool_use" ||
      block.type === "server_tool_use" ||
      block.type === "mcp_tool_use"
    );
  }

  private createFallbackBlockForDelta(delta: any): any {
    if (delta?.type === "thinking_delta") {
      return { type: "thinking", text: "" };
    }

    if (delta?.type === "input_json_delta") {
      return { type: "tool_call", id: "", name: "", input: {} };
    }

    return { type: "text", text: "" };
  }

  private normalizeDelta(delta: any): any | undefined {
    if (!delta || typeof delta !== "object") {
      return undefined;
    }

    if (delta.type === "text_delta") {
      return {
        type: "text_delta",
        text: delta.text || "",
      };
    }

    if (delta.type === "thinking_delta") {
      return {
        type: "thinking_delta",
        text: delta.text || delta.thinking || "",
      };
    }

    if (delta.type === "input_json_delta") {
      return {
        type: "input_json_delta",
        partial_json: delta.partial_json || "",
      };
    }

    return undefined;
  }

  private applyDeltaToCachedBlock(
    block: any,
    delta: any,
    state: PspConversionState,
  ): void {
    if (delta.type === "text_delta") {
      const text = delta.text || "";
      state.textChunks.push(text);
      block.text = `${block.text || ""}${text}`;
      return;
    }

    if (delta.type === "thinking_delta") {
      const text = delta.text || delta.thinking || "";
      block.text = `${block.text || ""}${text}`;
      return;
    }

    if (delta.type === "input_json_delta") {
      block.partial_json = `${block.partial_json || ""}${delta.partial_json || ""}`;
    }
  }

  private finalizeCachedBlock(block: any): void {
    if (block.type !== "tool_call" || !block.partial_json) {
      return;
    }

    try {
      block.input = JSON.parse(block.partial_json);
    } catch {
      block.input = block.input || {};
    }
    delete block.partial_json;
  }

  private extractTextFromContent(content: unknown): string {
    if (typeof content === "string") {
      return content;
    }

    if (!Array.isArray(content)) {
      return "";
    }

    return content
      .filter(
        (block): block is { type: "text"; text?: string } =>
          typeof block === "object" &&
          block !== null &&
          (block as any).type === "text",
      )
      .map((block) => block.text || "")
      .join("");
  }

  private pruneSessionStore(sessionId: string, k: number): void {
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
      } catch {
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
