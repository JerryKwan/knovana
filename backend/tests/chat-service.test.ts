import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { getDatabase } from "../src/storage/database";
import { runMigrations } from "../src/storage/migrations";
import { ChatService } from "../src/services/chat-service";
import { config } from "../src/config";
import { getPendingKnowledgeAttachments } from "../src/agent/tools/pending-attachments";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";

type PspTestChunk = { event: string; data: any };

describe("ChatService Tests", () => {
  beforeAll(() => {
    config.dbPath = ":memory:";
    runMigrations();
  });

  beforeEach(() => {
    const db = getDatabase();
    db.prepare("DELETE FROM chat_messages").run();
    db.prepare("DELETE FROM chat_sessions").run();
    db.prepare("DELETE FROM claude_session_entries").run();
    db.prepare("DELETE FROM users").run();
  });

  it("prunes session store entries correctly when regenerating a later message", () => {
    const db = getDatabase();
    const userId = "usr_test_prune";
    const sessionId = "sess_prune_1";
    const chatService = new ChatService(userId, "tests/knowledge-base");

    // Insert mock session store entries
    const entries = [
      {
        id: 1,
        type: "user",
        data: JSON.stringify({
          type: "user",
          message: { role: "user", content: "hello" },
        }),
      },
      {
        id: 2,
        type: "title",
        data: JSON.stringify({ type: "title", title: "hello" }),
      },
      {
        id: 3,
        type: "assistant",
        data: JSON.stringify({
          type: "assistant",
          message: { role: "assistant", content: "hi" },
        }),
      },
      {
        id: 4,
        type: "user",
        data: JSON.stringify({
          type: "user",
          message: { role: "user", content: "joke" },
        }),
      },
      {
        id: 5,
        type: "assistant",
        data: JSON.stringify({
          type: "assistant",
          message: { role: "assistant", content: "chicken" },
        }),
      },
    ];

    // Clear previous and insert new entries
    db.prepare("DELETE FROM claude_session_entries").run();
    const stmt = db.prepare(`
      INSERT INTO claude_session_entries (id, project_key, session_id, subpath, entry_uuid, data)
      VALUES (?, ?, ?, NULL, ?, ?)
    `);

    for (const e of entries) {
      stmt.run(e.id, userId, sessionId, `uuid-${e.id}`, e.data);
    }

    // Call pruneSessionStore simulating regeneration of "joke" (Message 2)
    // messages:
    // 0: User "hello"
    // 1: Assistant "hi"
    // 2: User "joke"
    // k = 1 (number of user messages in history prior to the regenerated turn)
    (chatService as any).pruneSessionStore(sessionId, 1);

    // Verify entries: Only 1, 2, 3 should remain. 4 and 5 should be deleted.
    const remaining = db
      .prepare(
        `
      SELECT id FROM claude_session_entries WHERE project_key = ? AND session_id = ? ORDER BY id ASC
    `,
      )
      .all(userId, sessionId) as { id: number }[];

    expect(remaining.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it("prunes all session store entries when regenerating the very first message", () => {
    const db = getDatabase();
    const userId = "usr_test_prune";
    const sessionId = "sess_prune_2";
    const chatService = new ChatService(userId, "tests/knowledge-base");

    // Insert mock entries
    const entries = [
      {
        id: 10,
        type: "user",
        data: JSON.stringify({
          type: "user",
          message: { role: "user", content: "hello" },
        }),
      },
      {
        id: 11,
        type: "assistant",
        data: JSON.stringify({
          type: "assistant",
          message: { role: "assistant", content: "hi" },
        }),
      },
    ];

    db.prepare("DELETE FROM claude_session_entries").run();
    const stmt = db.prepare(`
      INSERT INTO claude_session_entries (id, project_key, session_id, subpath, entry_uuid, data)
      VALUES (?, ?, ?, NULL, ?, ?)
    `);

    for (const e of entries) {
      stmt.run(e.id, userId, sessionId, `uuid-${e.id}`, e.data);
    }

    // Call pruneSessionStore simulating regeneration of "hello" (first message)
    // k = 0
    (chatService as any).pruneSessionStore(sessionId, 0);

    // Verify entries: All entries should be deleted because k = 0, meaning we look for the 1st user message entry and delete from there.
    const remaining = db
      .prepare(
        `
      SELECT id FROM claude_session_entries WHERE project_key = ? AND session_id = ?
    `,
      )
      .all(userId, sessionId) as any[];

    expect(remaining.length).toBe(0);
  });

  it("does not prune any entries during normal chat flow (new turn)", () => {
    const db = getDatabase();
    const userId = "usr_test_prune";
    const sessionId = "sess_prune_3";
    const chatService = new ChatService(userId, "tests/knowledge-base");

    const entries = [
      {
        id: 20,
        type: "user",
        data: JSON.stringify({
          type: "user",
          message: { role: "user", content: "hello" },
        }),
      },
      {
        id: 21,
        type: "assistant",
        data: JSON.stringify({
          type: "assistant",
          message: { role: "assistant", content: "hi" },
        }),
      },
    ];

    db.prepare("DELETE FROM claude_session_entries").run();
    const stmt = db.prepare(`
      INSERT INTO claude_session_entries (id, project_key, session_id, subpath, entry_uuid, data)
      VALUES (?, ?, ?, NULL, ?, ?)
    `);

    for (const e of entries) {
      stmt.run(e.id, userId, sessionId, `uuid-${e.id}`, e.data);
    }

    // Call pruneSessionStore simulating a normal new user message "how are you" (turn 2)
    // k = 1 (number of user messages in history prior to the new turn)
    (chatService as any).pruneSessionStore(sessionId, 1);

    // Verify entries: No entries should be deleted because there are only 1 user entries in DB,
    // and we look for the 2nd user entry (k+1 = 2) which doesn't exist.
    const remaining = db
      .prepare(
        `
      SELECT id FROM claude_session_entries WHERE project_key = ? AND session_id = ? ORDER BY id ASC
    `,
      )
      .all(userId, sessionId) as { id: number }[];

    expect(remaining.map((r) => r.id)).toEqual([20, 21]);
  });

  it("converts partial SDK text stream events into PSP content blocks", async () => {
    const userId = "usr_test_stream_text";
    const sessionId = "sess_stream_text";
    insertUser(userId);

    const { service } = createServiceWithSdkMessages(userId, [
      streamEvent(sessionId, {
        type: "message_start",
        message: {
          id: "sdk_msg_1",
          role: "assistant",
          content: [],
        },
      }),
      streamEvent(sessionId, {
        type: "content_block_start",
        index: 0,
        content_block: { type: "text", text: "" },
      }),
      streamEvent(sessionId, {
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text: "Hello" },
      }),
      streamEvent(sessionId, {
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text: " world" },
      }),
      streamEvent(sessionId, {
        type: "content_block_stop",
        index: 0,
      }),
      streamEvent(sessionId, {
        type: "message_delta",
        delta: { stop_reason: "end_turn" },
        usage: { output_tokens: 2 },
      }),
      assistantMessage(sessionId, [{ type: "text", text: "Hello world" }]),
    ]);

    const chunks = await collectChunks(service.chat({ message: "hello" }));

    expect(chunks.map((chunk) => chunk.event)).toEqual([
      "message_start",
      "session_created",
      "content_block_start",
      "content_block_delta",
      "content_block_delta",
      "content_block_stop",
      "message_delta",
      "message_end",
    ]);
    expect(chunks[2].data.index).toBe(0);
    expect(chunks[5].data.content_block).toEqual({
      type: "text",
      text: "Hello world",
    });
    expect(
      chunks.filter((chunk) => chunk.event === "content_block_start"),
    ).toHaveLength(1);

    const messages = getStoredMessages(sessionId);
    expect(messages.map((message) => message.role)).toEqual([
      "user",
      "assistant",
    ]);
    expect(messages[1].content).toBe("Hello world");
  });

  it("keeps streamed block mappings when SDK assistant snapshots arrive before block stops", async () => {
    const userId = "usr_test_snapshot_before_stop";
    const sessionId = "sess_snapshot_before_stop";
    insertUser(userId);

    const { service } = createServiceWithSdkMessages(userId, [
      streamEvent(sessionId, {
        type: "message_start",
        message: {
          id: "sdk_msg_snapshot",
          role: "assistant",
          content: [],
        },
      }),
      streamEvent(sessionId, {
        type: "content_block_start",
        index: 0,
        content_block: { type: "thinking", thinking: "", signature: "" },
      }),
      streamEvent(sessionId, {
        type: "content_block_delta",
        index: 0,
        delta: { type: "thinking_delta", thinking: "Plan" },
      }),
      streamEvent(sessionId, {
        type: "content_block_delta",
        index: 0,
        delta: { type: "signature_delta", signature: "sig_1" },
      }),
      assistantMessage(sessionId, [{ type: "thinking", thinking: "Plan" }]),
      streamEvent(sessionId, {
        type: "content_block_stop",
        index: 0,
      }),
      streamEvent(sessionId, {
        type: "content_block_start",
        index: 1,
        content_block: { type: "text", text: "" },
      }),
      streamEvent(sessionId, {
        type: "content_block_delta",
        index: 1,
        delta: { type: "text_delta", text: "Answer" },
      }),
      assistantMessage(sessionId, [{ type: "text", text: "Answer" }]),
      streamEvent(sessionId, {
        type: "content_block_stop",
        index: 1,
      }),
      streamEvent(sessionId, {
        type: "message_delta",
        delta: { stop_reason: "end_turn" },
        usage: { output_tokens: 2 },
      }),
    ]);

    const chunks = await collectChunks(
      service.chat({ message: "snapshot order" }),
    );
    const contentChunks = chunks.filter((chunk) =>
      chunk.event.startsWith("content_block_"),
    );
    const deltaChunks = chunks.filter(
      (chunk) => chunk.event === "content_block_delta",
    );
    const stopChunks = chunks.filter(
      (chunk) => chunk.event === "content_block_stop",
    );

    expect(contentChunks.map((chunk) => chunk.event)).toEqual([
      "content_block_start",
      "content_block_delta",
      "content_block_stop",
      "content_block_start",
      "content_block_delta",
      "content_block_stop",
    ]);
    expect(deltaChunks.map((chunk) => chunk.data.delta.type)).toEqual([
      "thinking_delta",
      "text_delta",
    ]);
    expect(stopChunks.map((chunk) => chunk.data.index)).toEqual([0, 1]);
    expect(stopChunks[0].data.content_block).toEqual({
      type: "thinking",
      text: "Plan",
    });
    expect(stopChunks[1].data.content_block).toEqual({
      type: "text",
      text: "Answer",
    });
  });

  it("falls back to complete assistant messages when partial events are absent", async () => {
    const userId = "usr_test_complete_assistant";
    const sessionId = "sess_complete_assistant";
    insertUser(userId);

    const { service } = createServiceWithSdkMessages(userId, [
      assistantMessage(sessionId, [{ type: "text", text: "Fallback answer" }]),
    ]);

    const chunks = await collectChunks(service.chat({ message: "answer me" }));

    expect(chunks.map((chunk) => chunk.event)).toEqual([
      "message_start",
      "session_created",
      "content_block_start",
      "content_block_stop",
      "message_end",
    ]);
    expect(chunks[2].data).toMatchObject({
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    });
    expect(chunks[3].data).toMatchObject({
      type: "content_block_stop",
      index: 0,
      content_block: { type: "text", text: "Fallback answer" },
    });

    const messages = getStoredMessages(sessionId);
    expect(messages[1].content).toBe("Fallback answer");
  });

  it("adds archival instructions for knowledge-entry attachments", async () => {
    const userId = "usr_test_knowledge_attachment";
    const sessionId = "sess_knowledge_attachment";
    insertUser(userId);

    const { service, agent } = createServiceWithSdkMessages(userId, [
      assistantMessage(sessionId, [{ type: "text", text: "Saved" }]),
    ]);

    await collectChunks(
      service.chat({
        message: "请整理附件为知识条目",
        intent: "knowledge_entry",
        attachment: {
          name: "原始研究报告.pdf",
          size: 12,
          path: "attachments/研究报告.pdf",
        },
      }),
    );

    expect(agent.chat).toHaveBeenCalledWith(
      expect.stringContaining("【知识条目附件归档要求】"),
      expect.any(String),
      undefined,
    );
    expect(agent.chat).toHaveBeenCalledWith(
      expect.stringContaining("临时存储文件名: 研究报告.pdf"),
      expect.any(String),
      undefined,
    );
    expect(getPendingKnowledgeAttachments(userId)).toEqual([]);
  });

  it("keeps PSP block indexes globally ordered across tool calls and follow-up assistant messages", async () => {
    const userId = "usr_test_tool_flow";
    const sessionId = "sess_tool_flow";
    insertUser(userId);

    const { service } = createServiceWithSdkMessages(userId, [
      streamEvent(sessionId, {
        type: "message_start",
        message: {
          id: "sdk_tool_msg",
          role: "assistant",
          content: [],
        },
      }),
      streamEvent(sessionId, {
        type: "content_block_start",
        index: 0,
        content_block: {
          type: "tool_use",
          id: "tool_1",
          name: "search_kb",
          input: {},
        },
      }),
      streamEvent(sessionId, {
        type: "content_block_delta",
        index: 0,
        delta: { type: "input_json_delta", partial_json: '{"query":"abc"}' },
      }),
      streamEvent(sessionId, {
        type: "content_block_stop",
        index: 0,
      }),
      assistantMessage(sessionId, [
        {
          type: "tool_use",
          id: "tool_1",
          name: "search_kb",
          input: { query: "abc" },
        },
      ]),
      userToolResultMessage(sessionId, {
        type: "tool_result",
        tool_use_id: "tool_1",
        content: "Found abc",
      }),
      streamEvent(sessionId, {
        type: "message_start",
        message: {
          id: "sdk_final_msg",
          role: "assistant",
          content: [],
        },
      }),
      streamEvent(sessionId, {
        type: "content_block_start",
        index: 0,
        content_block: { type: "thinking", thinking: "" },
      }),
      streamEvent(sessionId, {
        type: "content_block_delta",
        index: 0,
        delta: { type: "thinking_delta", thinking: "Checking" },
      }),
      streamEvent(sessionId, {
        type: "content_block_stop",
        index: 0,
      }),
      streamEvent(sessionId, {
        type: "content_block_start",
        index: 1,
        content_block: { type: "text", text: "" },
      }),
      streamEvent(sessionId, {
        type: "content_block_delta",
        index: 1,
        delta: { type: "text_delta", text: "Done" },
      }),
      streamEvent(sessionId, {
        type: "content_block_stop",
        index: 1,
      }),
      assistantMessage(sessionId, [
        { type: "thinking", thinking: "Checking" },
        { type: "text", text: "Done" },
      ]),
    ]);

    const chunks = await collectChunks(service.chat({ message: "search abc" }));
    const stopChunks = chunks.filter(
      (chunk) => chunk.event === "content_block_stop",
    );
    const deltaChunks = chunks.filter(
      (chunk) => chunk.event === "content_block_delta",
    );

    expect(stopChunks.map((chunk) => chunk.data.index)).toEqual([0, 1, 2, 3]);
    expect(stopChunks[0].data.content_block).toEqual({
      type: "tool_call",
      id: "tool_1",
      name: "search_kb",
      input: { query: "abc" },
    });
    expect(stopChunks[1].data.content_block).toEqual({
      type: "tool_result",
      tool_call_id: "tool_1",
      status: "success",
      content: "Found abc",
    });
    expect(deltaChunks[1].data.delta).toMatchObject({
      type: "thinking_delta",
      text: "Checking",
    });
    expect(stopChunks[3].data.content_block).toEqual({
      type: "text",
      text: "Done",
    });

    const messages = getStoredMessages(sessionId);
    expect(messages[1].content).toBe("Done");
  });
});

function createServiceWithSdkMessages(userId: string, messages: any[]) {
  const agent = {
    chat: vi.fn(async function* () {
      for (const message of messages) {
        yield message as SDKMessage;
      }
    }),
  };

  return {
    service: new ChatService(userId, "tests/knowledge-base", () => agent),
    agent,
  };
}

async function collectChunks(
  stream: AsyncGenerator<PspTestChunk>,
): Promise<PspTestChunk[]> {
  const chunks: PspTestChunk[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return chunks;
}

function insertUser(userId: string): void {
  getDatabase()
    .prepare(
      `INSERT OR IGNORE INTO users (id, username, password_hash, kb_path, settings)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(userId, `${userId}_name`, "hash", userId, "{}");
}

function getStoredMessages(sessionId: string) {
  return getDatabase()
    .prepare(
      "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
    )
    .all(sessionId) as { role: string; content: string }[];
}

function streamEvent(sessionId: string, event: any): SDKMessage {
  return {
    type: "stream_event",
    event,
    parent_tool_use_id: null,
    uuid: randomUUIDForTest(event.type),
    session_id: sessionId,
  } as SDKMessage;
}

function assistantMessage(sessionId: string, content: any[]): SDKMessage {
  return {
    type: "assistant",
    message: {
      id: randomUUIDForTest("assistant"),
      role: "assistant",
      model: "test-model",
      content,
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
    },
    parent_tool_use_id: null,
    uuid: randomUUIDForTest("assistant_message"),
    session_id: sessionId,
  } as SDKMessage;
}

function userToolResultMessage(sessionId: string, block: any): SDKMessage {
  return {
    type: "user",
    message: {
      role: "user",
      content: [block],
    },
    parent_tool_use_id: null,
    uuid: randomUUIDForTest("user_tool_result"),
    session_id: sessionId,
  } as SDKMessage;
}

function randomUUIDForTest(prefix: string): string {
  return `${prefix.replace(/[^a-z0-9]/gi, "_")}_uuid`;
}
