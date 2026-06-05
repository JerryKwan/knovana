import { describe, it, expect, beforeAll } from "vitest";
import { getDatabase } from "../src/storage/database";
import { runMigrations } from "../src/storage/migrations";
import { ChatService } from "../src/services/chat-service";
import { config } from "../src/config";

describe("ChatService Session Store Pruning Tests", () => {
  beforeAll(() => {
    config.dbPath = ":memory:";
    runMigrations();
  });

  it("prunes session store entries correctly when regenerating a later message", () => {
    const db = getDatabase();
    const userId = "usr_test_prune";
    const sessionId = "sess_prune_1";
    const chatService = new ChatService(userId, "tests/knowledge-base");

    // Insert mock session store entries
    const entries = [
      { id: 1, type: "user", data: JSON.stringify({ type: "user", message: { role: "user", content: "hello" } }) },
      { id: 2, type: "title", data: JSON.stringify({ type: "title", title: "hello" }) },
      { id: 3, type: "assistant", data: JSON.stringify({ type: "assistant", message: { role: "assistant", content: "hi" } }) },
      { id: 4, type: "user", data: JSON.stringify({ type: "user", message: { role: "user", content: "joke" } }) },
      { id: 5, type: "assistant", data: JSON.stringify({ type: "assistant", message: { role: "assistant", content: "chicken" } }) },
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
    const remaining = db.prepare(`
      SELECT id FROM claude_session_entries WHERE project_key = ? AND session_id = ? ORDER BY id ASC
    `).all(userId, sessionId) as { id: number }[];

    expect(remaining.map(r => r.id)).toEqual([1, 2, 3]);
  });

  it("prunes all session store entries when regenerating the very first message", () => {
    const db = getDatabase();
    const userId = "usr_test_prune";
    const sessionId = "sess_prune_2";
    const chatService = new ChatService(userId, "tests/knowledge-base");

    // Insert mock entries
    const entries = [
      { id: 10, type: "user", data: JSON.stringify({ type: "user", message: { role: "user", content: "hello" } }) },
      { id: 11, type: "assistant", data: JSON.stringify({ type: "assistant", message: { role: "assistant", content: "hi" } }) },
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
    const remaining = db.prepare(`
      SELECT id FROM claude_session_entries WHERE project_key = ? AND session_id = ?
    `).all(userId, sessionId) as any[];

    expect(remaining.length).toBe(0);
  });

  it("does not prune any entries during normal chat flow (new turn)", () => {
    const db = getDatabase();
    const userId = "usr_test_prune";
    const sessionId = "sess_prune_3";
    const chatService = new ChatService(userId, "tests/knowledge-base");

    const entries = [
      { id: 20, type: "user", data: JSON.stringify({ type: "user", message: { role: "user", content: "hello" } }) },
      { id: 21, type: "assistant", data: JSON.stringify({ type: "assistant", message: { role: "assistant", content: "hi" } }) },
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
    const remaining = db.prepare(`
      SELECT id FROM claude_session_entries WHERE project_key = ? AND session_id = ? ORDER BY id ASC
    `).all(userId, sessionId) as { id: number }[];

    expect(remaining.map(r => r.id)).toEqual([20, 21]);
  });
});
