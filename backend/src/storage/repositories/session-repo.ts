import { getDatabase } from "../database";
import type { ChatSession, ChatSessionListItem } from "../../models/session";

export class SessionRepository {
  private readonly db = getDatabase();

  create(
    sessionId: string,
    userId: string,
    context?: Record<string, unknown>,
  ): ChatSession {
    const contextStr = context ? JSON.stringify(context) : null;
    this.db
      .prepare(
        "INSERT INTO chat_sessions (id, user_id, context) VALUES (?, ?, ?)",
      )
      .run(sessionId, userId, contextStr);

    return this.get(sessionId)!;
  }

  get(sessionId: string): ChatSession | null {
    const row = this.db
      .prepare("SELECT * FROM chat_sessions WHERE id = ?")
      .get(sessionId);

    return row ? (row as unknown as ChatSession) : null;
  }

  listByUser(
    userId: string,
    page: number,
    perPage: number,
  ): { items: ChatSessionListItem[]; total: number } {
    const offset = (page - 1) * perPage;

    // Get total count
    const totalRow = this.db
      .prepare("SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = ?")
      .get(userId) as { count: number };
    const total = totalRow ? totalRow.count : 0;

    // Get paginated items with message count
    const rows = this.db
      .prepare(
        `
        SELECT s.*, COUNT(m.id) as message_count
        FROM chat_sessions s
        LEFT JOIN chat_messages m ON s.id = m.session_id
        WHERE s.user_id = ?
        GROUP BY s.id
        ORDER BY s.updated_at DESC
        LIMIT ? OFFSET ?
      `,
      )
      .all(userId, perPage, offset) as any[];

    const items = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      context: row.context,
      created_at: row.created_at,
      updated_at: row.updated_at,
      message_count: row.message_count,
    }));

    return { items, total };
  }

  updateTitle(sessionId: string, title: string): void {
    this.db
      .prepare(
        "UPDATE chat_sessions SET title = ?, updated_at = datetime('now') WHERE id = ?",
      )
      .run(title, sessionId);
  }

  updateTimestamp(sessionId: string): void {
    this.db
      .prepare(
        "UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?",
      )
      .run(sessionId);
  }

  delete(sessionId: string): void {
    this.db.prepare("DELETE FROM chat_sessions WHERE id = ?").run(sessionId);
  }
}
