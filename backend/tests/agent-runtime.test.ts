import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startup, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { KnovanaAgent } from "../src/agent/client";
import { getAgentOptions, SessionWarmPool } from "../src/agent/pool";
import { config } from "../src/config";

vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  createSdkMcpServer: vi.fn(() => ({ name: "mock-mcp-server" })),
  query: vi.fn(),
  startup: vi.fn(),
  tool: vi.fn((name, description, inputSchema, handler) => ({
    name,
    description,
    inputSchema,
    handler,
  })),
}));

const startupMock = vi.mocked(startup);

describe("Agent runtime warm query lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SessionWarmPool.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    SessionWarmPool.clear();
  });

  it("closes the active SDK query and skips prewarm when the consumer stops early", async () => {
    const queryResult = createQuery([
      sdkSystemMessage("sess_runtime_stop", "init"),
      sdkSystemMessage("sess_runtime_stop", "status"),
    ]);
    const warmQuery = createWarmQuery(queryResult);
    startupMock.mockResolvedValue(warmQuery as any);
    const prewarmSpy = vi
      .spyOn(SessionWarmPool, "prewarm")
      .mockImplementation(() => undefined);

    const agent = new KnovanaAgent("usr_runtime", "tests/knowledge-base");
    const stream = agent.chat("hello", "system prompt");

    const first = await stream.next();
    expect(first.value?.type).toBe("system");

    await stream.return(undefined);

    expect(queryResult.close).toHaveBeenCalledTimes(1);
    expect(warmQuery.query).toHaveBeenCalledWith("hello");
    expect(prewarmSpy).not.toHaveBeenCalled();
  });

  it("prewarms the next turn only after the SDK stream completes cleanly", async () => {
    const queryResult = createQuery([
      sdkSystemMessage("sess_runtime_complete", "init"),
    ]);
    const warmQuery = createWarmQuery(queryResult);
    startupMock.mockResolvedValue(warmQuery as any);
    const prewarmSpy = vi
      .spyOn(SessionWarmPool, "prewarm")
      .mockImplementation(() => undefined);

    const agent = new KnovanaAgent("usr_runtime", "tests/knowledge-base");
    const messages = [];

    for await (const message of agent.chat("hello", "system prompt")) {
      messages.push(message);
    }

    expect(messages).toHaveLength(1);
    expect(queryResult.close).not.toHaveBeenCalled();
    expect(warmQuery.query).toHaveBeenCalledWith("hello");
    expect(prewarmSpy).toHaveBeenCalledWith(
      "usr_runtime",
      "tests/knowledge-base",
      "system prompt",
      "sess_runtime_complete",
    );
  });

  it("claims a pending prewarm for chat instead of starting a direct query", async () => {
    const queryResult = createQuery([
      sdkSystemMessage("sess_claim_pending", "init"),
    ]);
    const pendingWarmQuery = createWarmQuery(queryResult);
    const startupDeferred = createDeferred<any>();
    startupMock.mockReturnValue(startupDeferred.promise);

    SessionWarmPool.prewarm(
      "usr_runtime",
      "tests/knowledge-base",
      "system prompt",
      "sess_claim_pending",
    );
    await flushPromises();

    const agent = new KnovanaAgent("usr_runtime", "tests/knowledge-base");
    const stream = agent.chat("hello", "system prompt", "sess_claim_pending");
    const firstMessage = stream.next();

    startupDeferred.resolve(pendingWarmQuery);
    await flushPromises();

    expect(await firstMessage).toMatchObject({
      value: { type: "system", session_id: "sess_claim_pending" },
      done: false,
    });
    expect(pendingWarmQuery.query).toHaveBeenCalledWith("hello");
    expect(startupMock).toHaveBeenCalledTimes(1);
  });

  it("invalidates a pending prewarm when the same session is popped for a cold query", async () => {
    const pendingWarmQuery = createWarmQuery();
    const startupDeferred = createDeferred<any>();
    startupMock.mockReturnValue(startupDeferred.promise);

    SessionWarmPool.prewarm(
      "usr_runtime",
      "tests/knowledge-base",
      "system prompt",
      "sess_pending",
    );
    await flushPromises();

    expect(SessionWarmPool.pop("usr_runtime", "sess_pending")).toBeNull();

    startupDeferred.resolve(pendingWarmQuery);
    await flushPromises();

    expect(pendingWarmQuery.close).toHaveBeenCalledTimes(1);
    expect(SessionWarmPool.pop("usr_runtime", "sess_pending")).toBeNull();
  });

  it("invalidates pending prewarm for an older session when the same user moves to a newer session", async () => {
    const staleWarmQuery = createWarmQuery();
    const freshWarmQuery = createWarmQuery();
    const staleStartup = createDeferred<any>();
    const freshStartup = createDeferred<any>();
    startupMock
      .mockReturnValueOnce(staleStartup.promise)
      .mockReturnValueOnce(freshStartup.promise);

    SessionWarmPool.prewarm(
      "usr_runtime",
      "tests/knowledge-base",
      "system prompt",
      "sess_old_pending",
    );
    await flushPromises();

    SessionWarmPool.prewarm(
      "usr_runtime",
      "tests/knowledge-base",
      "system prompt",
      "sess_new_pending",
    );
    await flushPromises();

    freshStartup.resolve(freshWarmQuery);
    await flushPromises();

    staleStartup.resolve(staleWarmQuery);
    await flushPromises();

    expect(staleWarmQuery.close).toHaveBeenCalledTimes(1);
    expect(SessionWarmPool.pop("usr_runtime", "sess_old_pending")).toBeNull();
    expect(SessionWarmPool.pop("usr_runtime", "sess_new_pending")).toBe(
      freshWarmQuery,
    );
  });

  it("replaces a ready warm query when a newer prewarm is requested for the same session", async () => {
    const staleWarmQuery = createWarmQuery();
    const freshWarmQuery = createWarmQuery();
    startupMock
      .mockResolvedValueOnce(staleWarmQuery as any)
      .mockResolvedValueOnce(freshWarmQuery as any);

    SessionWarmPool.prewarm(
      "usr_runtime",
      "tests/knowledge-base",
      "system prompt",
      "sess_replace",
    );
    await flushPromises();

    SessionWarmPool.prewarm(
      "usr_runtime",
      "tests/knowledge-base",
      "system prompt",
      "sess_replace",
    );
    await flushPromises();

    expect(staleWarmQuery.close).toHaveBeenCalledTimes(1);
    expect(SessionWarmPool.pop("usr_runtime", "sess_replace")).toBe(
      freshWarmQuery,
    );
  });

  it("pins the backend configured model over user-level Claude settings", () => {
    const previousModel = config.anthropicModel;
    const previousEnvModel = process.env.ANTHROPIC_MODEL;

    try {
      config.anthropicModel = "deepseek-v4-flash";
      process.env.ANTHROPIC_MODEL = "step-3.5-flash";

      const options = getAgentOptions(
        "usr_runtime",
        "tests/knowledge-base",
        "system prompt",
        "sess_model",
      );

      expect(options.model).toBe("deepseek-v4-flash");
      expect(options.env?.ANTHROPIC_MODEL).toBe("deepseek-v4-flash");
      expect(options.settingSources).toEqual([]);
      expect(options.strictMcpConfig).toBe(true);
    } finally {
      config.anthropicModel = previousModel;
      if (previousEnvModel === undefined) {
        delete process.env.ANTHROPIC_MODEL;
      } else {
        process.env.ANTHROPIC_MODEL = previousEnvModel;
      }
    }
  });
});

function sdkSystemMessage(sessionId: string, subtype: string): SDKMessage {
  return {
    type: "system",
    subtype,
    session_id: sessionId,
    uuid: `${sessionId}_${subtype}`,
  } as SDKMessage;
}

function createQuery(messages: SDKMessage[]) {
  return {
    close: vi.fn(),
    async *[Symbol.asyncIterator]() {
      for (const message of messages) {
        yield message;
      }
    },
  };
}

function createWarmQuery(queryResult = createQuery([])) {
  return {
    close: vi.fn(),
    query: vi.fn(() => queryResult),
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
