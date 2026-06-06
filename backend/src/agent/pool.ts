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

export interface AcquiredWarmQuery {
  warmQuery: WarmQuery;
  source: "ready" | "pending" | "started";
}

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
  if (config.anthropicModel) {
    envVars.ANTHROPIC_MODEL = config.anthropicModel;
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
    // Pin the backend model so user-level Claude Code settings cannot route
    // this service to an incompatible provider model.
    model: config.anthropicModel,
    // Backend chat must be isolated from ~/.claude/settings.json; otherwise a
    // developer's Claude Code model/base URL can silently override service env.
    settingSources: [],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    includePartialMessages: true,
    env: envVars,
    stderr: (data) => {
      const text = data.trim();
      if (text && config.agentTrace) {
        console.warn("[KnovanaAgent:stderr]", text);
      }
    },
    strictMcpConfig: true,
    resume: sessionId,
    sessionStore: new KnovanaSessionStore(userId),
  };
}

export class SessionWarmPool {
  private static readonly ttlMs = 10 * 60 * 1000;
  private static pool = new Map<
    string,
    {
      warmQuery: WarmQuery;
      timer: NodeJS.Timeout;
      userId: string;
      kbRoot: string;
      systemPrompt: string;
      sessionId: string;
      generation: number;
    }
  >();
  private static pending = new Map<
    string,
    {
      promise: Promise<WarmQuery>;
      userId: string;
      kbRoot: string;
      systemPrompt: string;
      sessionId: string;
      generation: number;
      claimed: boolean;
    }
  >();
  private static generations = new Map<string, number>();
  private static userSessionKeys = new Map<string, Set<string>>();

  private static getPoolKey(userId: string, sessionId: string): string {
    return `${userId}:${sessionId}`;
  }

  /**
   * Returns a ready warm query for this turn. A ready pool hit is used first,
   * then an in-flight prewarm is claimed, and finally a new one-shot startup is
   * awaited so chat uses the same WarmQuery path even on cold starts.
   */
  static async acquire(
    userId: string,
    kbRoot: string,
    systemPrompt: string,
    sessionId?: string,
  ): Promise<AcquiredWarmQuery> {
    if (!sessionId) {
      this.trace(
        "[SessionWarmPool] Starting one-shot warm query for new session.",
      );
      return {
        warmQuery: await this.startWarmQuery(userId, kbRoot, systemPrompt),
        source: "started",
      };
    }

    const key = this.getPoolKey(userId, sessionId);
    const ready = this.pool.get(key);
    if (ready) {
      clearTimeout(ready.timer);
      this.pool.delete(key);
      this.nextGeneration(key);
      this.trace(
        `[SessionWarmPool] Ready warm query acquired for session ${sessionId}.`,
      );
      return { warmQuery: ready.warmQuery, source: "ready" };
    }

    const pending = this.pending.get(key);
    if (pending && !pending.claimed) {
      pending.claimed = true;
      this.trace(
        `[SessionWarmPool] Pending warm query claimed for session ${sessionId}.`,
      );
      return { warmQuery: await pending.promise, source: "pending" };
    }

    this.trace(
      `[SessionWarmPool] No warm query available for session ${sessionId}; starting one-shot warm query.`,
    );
    return {
      warmQuery: await this.startWarmQuery(
        userId,
        kbRoot,
        systemPrompt,
        sessionId,
      ),
      source: "started",
    };
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
    const generation = this.nextGeneration(key);
    this.invalidateOtherUserSessions(userId, key);

    const existing = this.pool.get(key);
    if (existing) {
      clearTimeout(existing.timer);
      existing.warmQuery.close();
      this.pool.delete(key);
    }

    const existingPending = this.pending.get(key);
    if (existingPending && !existingPending.claimed) {
      this.pending.delete(key);
    }

    // Clean up any other existing pre-warmed processes for this specific user
    for (const [poolKey, entry] of this.pool.entries()) {
      if (entry.userId === userId && entry.sessionId !== sessionId) {
        this.trace(
          `[SessionWarmPool] Releasing stale pre-warmed session ${entry.sessionId} for user ${userId}`,
        );
        clearTimeout(entry.timer);
        entry.warmQuery.close();
        this.pool.delete(poolKey);
        this.nextGeneration(poolKey);
      }
    }

    for (const [poolKey, entry] of this.pending.entries()) {
      if (entry.userId === userId && entry.sessionId !== sessionId) {
        this.nextGeneration(poolKey);
      }
    }

    this.trace(
      `[SessionWarmPool] Starting background pre-warm for session ${sessionId} (User: ${userId})`,
    );

    const promise = this.startWarmQuery(
      userId,
      kbRoot,
      systemPrompt,
      sessionId,
    );
    this.pending.set(key, {
      promise,
      userId,
      kbRoot,
      systemPrompt,
      sessionId,
      generation,
      claimed: false,
    });

    Promise.resolve().then(async () => {
      try {
        const warmQuery = await promise;
        const pending = this.pending.get(key);
        if (this.generations.get(key) !== generation) {
          if (
            pending?.generation === generation &&
            pending.promise === promise
          ) {
            this.pending.delete(key);
          }
          warmQuery.close();
          return;
        }

        if (!pending || pending.promise !== promise) {
          warmQuery.close();
          return;
        }

        if (pending.claimed) {
          this.pending.delete(key);
          return;
        }

        this.pending.delete(key);
        const existing = this.pool.get(key);
        if (existing) {
          clearTimeout(existing.timer);
          existing.warmQuery.close();
        }

        const timer = setTimeout(() => {
          this.trace(
            `[SessionWarmPool] Pre-warmed process for session ${sessionId} timed out. Closing.`,
          );
          const entry = this.pool.get(key);
          if (entry) {
            entry.warmQuery.close();
            this.pool.delete(key);
          }
          this.nextGeneration(key);
        }, this.ttlMs);

        this.pool.set(key, {
          warmQuery,
          timer,
          userId,
          kbRoot,
          systemPrompt,
          sessionId,
          generation,
        });

        this.trace(
          `[SessionWarmPool] Session ${sessionId} successfully pre-warmed.`,
        );
      } catch (err) {
        const pending = this.pending.get(key);
        if (pending?.generation === generation && pending.promise === promise) {
          this.pending.delete(key);
        }
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
    this.nextGeneration(key);
    this.pending.delete(key);
    const entry = this.pool.get(key);
    if (entry) {
      clearTimeout(entry.timer);
      this.pool.delete(key);
      this.trace(
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
    this.pending.clear();
    this.generations.clear();
    this.userSessionKeys.clear();
    this.trace(`[SessionWarmPool] Cleared all pre-warmed processes.`);
  }

  private static nextGeneration(key: string): number {
    const generation = (this.generations.get(key) || 0) + 1;
    this.generations.set(key, generation);
    return generation;
  }

  private static startWarmQuery(
    userId: string,
    kbRoot: string,
    systemPrompt: string,
    sessionId?: string,
  ): Promise<WarmQuery> {
    const options = getAgentOptions(userId, kbRoot, systemPrompt, sessionId);
    return startup({ options });
  }

  private static trace(message: string): void {
    if (config.agentTrace) {
      console.log(message);
    }
  }

  private static invalidateOtherUserSessions(
    userId: string,
    currentKey: string,
  ): void {
    const sessionKeys = this.userSessionKeys.get(userId) || new Set<string>();
    for (const poolKey of sessionKeys) {
      if (poolKey !== currentKey) {
        this.nextGeneration(poolKey);
      }
    }
    this.userSessionKeys.set(userId, new Set([currentKey]));
  }
}
