import {
  createSdkMcpServer,
  query,
  type SDKMessage,
} from "@anthropic-ai/claude-agent-sdk";
import { createTools } from "./tools";
import { config } from "../config";

export class KnovanaAgent {
  constructor(
    private readonly userId: string,
    private readonly kbRoot: string,
  ) {}

  /**
   * Starts a conversational session with the agent, yielding SDK message events.
   * Feeds process.env and custom base URLs to the agent runtime.
   */
  async *chat(
    message: string,
    systemPrompt: string,
  ): AsyncGenerator<SDKMessage> {
    const tools = createTools({ userId: this.userId, kbRoot: this.kbRoot });
    const mcpServer = createSdkMcpServer({
      name: "knovana",
      version: "1.0.0",
      tools,
    });

    const toolNames = tools.map(
      (toolDef: any) => `mcp__knovana__${toolDef.name}`,
    );

    // Compile environment variables for the agent subprocess
    const envVars: Record<string, string | undefined> = {
      ...process.env,
    };
    if (config.anthropicApiKey) {
      envVars.ANTHROPIC_API_KEY = config.anthropicApiKey;
    }
    if (config.anthropicBaseUrl) {
      envVars.ANTHROPIC_BASE_URL = config.anthropicBaseUrl;
    }

    const result = query({
      prompt: message,
      options: {
        cwd: this.kbRoot,
        systemPrompt,
        mcpServers: { knovana: mcpServer },
        allowedTools: toolNames,
        includePartialMessages: true,
        settingSources: [],
        env: envVars,
      },
    });

    for await (const msg of result) {
      yield msg;
    }
  }

  /**
   * Runs the agent loop and returns the aggregated text response.
   */
  async process(message: string, systemPrompt: string): Promise<string> {
    const chunks: string[] = [];
    for await (const msg of this.chat(message, systemPrompt)) {
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
