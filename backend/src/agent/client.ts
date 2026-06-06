import { type Query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { SessionWarmPool } from "./pool";
import { config } from "../config";

export class KnovanaAgent {
  constructor(
    private readonly userId: string,
    private readonly kbRoot: string,
  ) {}

  /**
   * Starts a conversational session with the agent, yielding SDK message events.
   * Leverages pre-warmed subprocesses if available, and triggers background pre-warming for the next turn.
   */
  async *chat(
    message: string,
    systemPrompt: string,
    sessionId?: string,
  ): AsyncGenerator<SDKMessage> {
    const acquired = await SessionWarmPool.acquire(
      this.userId,
      this.kbRoot,
      systemPrompt,
      sessionId,
    );
    let result: Query | undefined;

    try {
      traceLog(
        `[KnovanaAgent] Querying ${acquired.source} warm process for session ${sessionId || "new"}`,
      );
      result = acquired.warmQuery.query(message);
    } catch (err) {
      acquired.warmQuery.close();
      console.warn(
        `[KnovanaAgent] Failed to query warm process for session ${sessionId || "new"}:`,
        err,
      );
      throw err;
    }

    let actualSessionId = sessionId;
    let completed = false;

    try {
      for await (const msg of result) {
        traceLog("[KnovanaAgent] SDK message", summarizeSdkMessage(msg));
        if (!actualSessionId && msg.session_id) {
          actualSessionId = msg.session_id;
        }
        yield msg;
      }
      completed = true;
    } finally {
      if (!completed) {
        result?.close();
      }

      // Only pre-warm after the SDK stream completes cleanly. If the client
      // disconnects or the upstream run errors, resuming from a speculative
      // warm process can restore stale or partial runtime state.
      if (completed && actualSessionId) {
        SessionWarmPool.prewarm(
          this.userId,
          this.kbRoot,
          systemPrompt,
          actualSessionId,
        );
      }
    }
  }

  /**
   * Runs the agent loop and returns the aggregated text response.
   */
  async process(
    message: string,
    systemPrompt: string,
    sessionId: string,
  ): Promise<string> {
    const chunks: string[] = [];
    for await (const msg of this.chat(message, systemPrompt, sessionId)) {
      if (msg.type === "assistant") {
        const text = msg.message.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("");
        chunks.push(text);
      } else if (
        msg.type === "stream_event" &&
        msg.event.type === "content_block_delta" &&
        msg.event.delta.type === "text_delta"
      ) {
        chunks.push(msg.event.delta.text);
      }
    }
    return chunks.join("");
  }
}

function traceLog(message: string, details?: unknown): void {
  if (!config.agentTrace) {
    return;
  }

  if (details === undefined) {
    console.log(message);
    return;
  }

  console.log(message, details);
}

function summarizeSdkMessage(msg: SDKMessage): Record<string, unknown> {
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
  } else if (anyMsg.type === "stream_event") {
    summary.event_type = anyMsg.event?.type;
    summary.index = anyMsg.event?.index;
    summary.delta_type = anyMsg.event?.delta?.type;
    summary.content_block_type = anyMsg.event?.content_block?.type;
    summary.text_length =
      anyMsg.event?.delta?.text?.length ??
      anyMsg.event?.delta?.thinking?.length ??
      undefined;
    summary.partial_json_length = anyMsg.event?.delta?.partial_json?.length;
  } else if (anyMsg.type === "assistant" || anyMsg.type === "user") {
    const content = anyMsg.message?.content;
    summary.model = anyMsg.message?.model;
    summary.stop_reason = anyMsg.message?.stop_reason;
    summary.content = summarizeContent(content);
  } else if (anyMsg.type === "result") {
    summary.is_error = anyMsg.is_error;
    summary.subtype = anyMsg.subtype;
  }

  return summary;
}

function summarizeContent(content: unknown): unknown {
  if (typeof content === "string") {
    return { kind: "string", length: content.length };
  }

  if (!Array.isArray(content)) {
    return { kind: typeof content };
  }

  return content.map((block: any) => {
    if (!block || typeof block !== "object") {
      return { kind: typeof block };
    }

    return {
      type: block.type,
      text_length: block.text?.length ?? block.thinking?.length,
      partial_json_length: block.partial_json?.length,
      id: block.id || block.tool_use_id,
      name: block.name,
      is_error: block.is_error,
    };
  });
}
