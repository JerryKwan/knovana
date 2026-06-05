import { randomUUID } from "node:crypto";
import { getDatabase } from "../database";
import type { ChatMessage } from "../../models/session";

export class MessageRepository {
  private readonly db = getDatabase();

  create(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    metadata?: Record<string, unknown>,
  ): ChatMessage {
    const id = randomUUID();
    const metadataStr = metadata ? JSON.stringify(metadata) : null;

    this.db
      .prepare(
        "INSERT INTO chat_messages (id, session_id, role, content, metadata) VALUES (?, ?, ?, ?, ?)",
      )
      .run(id, sessionId, role, content, metadataStr);

    return this.get(id)!;
  }

  get(id: string): ChatMessage | null {
    const row = this.db
      .prepare("SELECT * FROM chat_messages WHERE id = ?")
      .get(id);

    return row ? (row as unknown as ChatMessage) : null;
  }

  listBySession(sessionId: string): ChatMessage[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
      )
      .all(sessionId);

    return rows as unknown as ChatMessage[];
  }

  deleteMessage(sessionId: string, messageId: string): void {
    this.db
      .prepare("DELETE FROM chat_messages WHERE session_id = ? AND id = ?")
      .run(sessionId, messageId);
  }

  clearSessionMessages(sessionId: string): void {
    this.db
      .prepare("DELETE FROM chat_messages WHERE session_id = ?")
      .run(sessionId);
  }
}
