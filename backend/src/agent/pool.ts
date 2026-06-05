import fs from "node:fs";
import path from "node:path";
import {
  createSdkMcpServer,
  startup,
  type Options,
  type WarmQuery,
} from "@anthropic-ai/claude-agent-sdk";
import { createTools } from "./tools";
import { config } from "../config";
import { KnovanaSessionStore } from "./session-store";

export function getAgentOptions(
  userId: string,
  kbRoot: string,
  systemPrompt: string,
  sessionId?: string,
): Options {
  const absoluteKbRoot = path.resolve(kbRoot);
  const absoluteAgentDir = import.meta.dirname;

  // Ensure the user's kbRoot directory exists
  if (!fs.existsSync(absoluteKbRoot)) {
    fs.mkdirSync(absoluteKbRoot, { recursive: true });
  }

  const tools = createTools({ userId, kbRoot: absoluteKbRoot });
  const mcpServer = createSdkMcpServer({
    name: "knovana",
    version: "1.0.0",
    tools,
  });

  const toolNames = tools.map(
    (toolDef: any) => `mcp__knovana__${toolDef.name}`,
  );

  const envVars: Record<string, string | undefined> = {
    ...process.env,
  };
  if (config.anthropicApiKey) {
    envVars.ANTHROPIC_API_KEY = config.anthropicApiKey;
  }
  if (config.anthropicBaseUrl) {
    envVars.ANTHROPIC_BASE_URL = config.anthropicBaseUrl;
  }

  return {
    cwd: absoluteAgentDir,
    additionalDirectories: [absoluteKbRoot],
    systemPrompt,
    mcpServers: { knovana: mcpServer },
    allowedTools: [
      "ViewFile",
      "WriteToFile",
      "SearchGrep",
      "Glob",
      "Bash",
      "MapDirectory",
      "LS",
      "Skill",
      ...toolNames,
    ],
    skills: "all",
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    includePartialMessages: true,
    env: envVars,
    resume: sessionId,
    sessionStore: new KnovanaSessionStore(userId),
  };
}

export class SessionWarmPool {
  private static pool = new Map<
    string,
    {
      warmQuery: WarmQuery;
      timer: NodeJS.Timeout;
      userId: string;
      kbRoot: string;
      systemPrompt: string;
      sessionId: string;
    }
  >();

  private static getPoolKey(userId: string, sessionId: string): string {
    return `${userId}:${sessionId}`;
  }

  /**
   * Pre-warms a subprocess for a specific user session.
   */
  static prewarm(
    userId: string,
    kbRoot: string,
    systemPrompt: string,
    sessionId: string,
  ): void {
    const key = this.getPoolKey(userId, sessionId);
    if (this.pool.has(key)) {
      return;
    }

    // Clean up any other existing pre-warmed processes for this specific user
    for (const [poolKey, entry] of this.pool.entries()) {
      if (entry.userId === userId && entry.sessionId !== sessionId) {
        console.log(
          `[SessionWarmPool] Releasing stale pre-warmed session ${entry.sessionId} for user ${userId}`,
        );
        clearTimeout(entry.timer);
        entry.warmQuery.close();
        this.pool.delete(poolKey);
      }
    }

    console.log(
      `[SessionWarmPool] Starting background pre-warm for session ${sessionId} (User: ${userId})`,
    );

    Promise.resolve().then(async () => {
      try {
        const options = getAgentOptions(
          userId,
          kbRoot,
          systemPrompt,
          sessionId,
        );
        const warmQuery = await startup({ options });

        if (this.pool.has(key)) {
          warmQuery.close();
          return;
        }

        const timer = setTimeout(
          () => {
            console.log(
              `[SessionWarmPool] Pre-warmed process for session ${sessionId} timed out. Closing.`,
            );
            const entry = this.pool.get(key);
            if (entry) {
              entry.warmQuery.close();
              this.pool.delete(key);
            }
          },
          10 * 60 * 1000,
        );

        this.pool.set(key, {
          warmQuery,
          timer,
          userId,
          kbRoot,
          systemPrompt,
          sessionId,
        });

        console.log(
          `[SessionWarmPool] Session ${sessionId} successfully pre-warmed.`,
        );
      } catch (err) {
        console.error(
          `[SessionWarmPool] Failed to pre-warm session ${sessionId}:`,
          err,
        );
      }
    });
  }

  /**
   * Pops a pre-warmed subprocess if available.
   */
  static pop(userId: string, sessionId: string): WarmQuery | null {
    const key = this.getPoolKey(userId, sessionId);
    const entry = this.pool.get(key);
    if (entry) {
      clearTimeout(entry.timer);
      this.pool.delete(key);
      console.log(
        `[SessionWarmPool] Pre-warmed process matched and popped for session ${sessionId}.`,
      );
      return entry.warmQuery;
    }
    return null;
  }

  /**
   * Clears all warm queries in the pool.
   */
  static clear(): void {
    for (const entry of this.pool.values()) {
      clearTimeout(entry.timer);
      entry.warmQuery.close();
    }
    this.pool.clear();
    console.log(`[SessionWarmPool] Cleared all pre-warmed processes.`);
  }
}
