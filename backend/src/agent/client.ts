import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { SessionWarmPool, getAgentOptions } from "./pool";

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
    const warmQuery = sessionId
      ? SessionWarmPool.pop(this.userId, sessionId)
      : null;
    let result: any;

    if (warmQuery) {
      try {
        result = warmQuery.query(message);
      } catch (err) {
        console.warn(
          `[KnovanaAgent] Failed to query warm process for session ${sessionId}, falling back to cold start:`,
          err,
        );
        warmQuery.close();
        const options = getAgentOptions(
          this.userId,
          this.kbRoot,
          systemPrompt,
          sessionId,
        );
        result = query({ prompt: message, options });
      }
    } else {
      console.log(
        `[KnovanaAgent] Cold start for session ${sessionId || "new"}`,
      );
      const options = getAgentOptions(
        this.userId,
        this.kbRoot,
        systemPrompt,
        sessionId,
      );
      result = query({ prompt: message, options });
    }

    let actualSessionId = sessionId;

    try {
      for await (const msg of result) {
        if (!actualSessionId && msg.session_id) {
          actualSessionId = msg.session_id;
        }
        yield msg;
      }
    } finally {
      // Asynchronously pre-warm the next turn for this session
      if (actualSessionId) {
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
