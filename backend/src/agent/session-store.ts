import {
  type SessionStore,
  type SessionKey,
  type SessionStoreEntry,
} from "@anthropic-ai/claude-agent-sdk";
import { getDatabase } from "../storage/database";

export class KnovanaSessionStore implements SessionStore {
  private readonly db = getDatabase();

  constructor(private readonly userId: string) {}

  async append(key: SessionKey, entries: SessionStoreEntry[]): Promise<void> {
    const subpathStr = key.subpath || null;
    const stmt = this.db.prepare(
      `INSERT INTO claude_session_entries (project_key, session_id, subpath, entry_uuid, data)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(entry_uuid) DO UPDATE SET data = excluded.data`,
    );

    try {
      this.db.exec("BEGIN TRANSACTION;");
      for (const entry of entries) {
        const uuid = entry.uuid || null;
        stmt.run(
          this.userId,
          key.sessionId,
          subpathStr,
          uuid,
          JSON.stringify(entry),
        );
      }
      this.db.exec("COMMIT;");
    } catch (err) {
      this.db.exec("ROLLBACK;");
      throw err;
    }
  }

  async load(key: SessionKey): Promise<SessionStoreEntry[] | null> {
    const subpathStr = key.subpath || null;
    let rows: any[];
    if (subpathStr === null) {
      rows = this.db
        .prepare(
          `SELECT data FROM claude_session_entries
           WHERE project_key = ? AND session_id = ? AND subpath IS NULL
           ORDER BY id ASC`,
        )
        .all(this.userId, key.sessionId) as any[];
    } else {
      rows = this.db
        .prepare(
          `SELECT data FROM claude_session_entries
           WHERE project_key = ? AND session_id = ? AND subpath = ?
           ORDER BY id ASC`,
        )
        .all(this.userId, key.sessionId, subpathStr) as any[];
    }

    if (rows.length === 0) {
      return null;
    }

    return rows.map((row) => JSON.parse(row.data) as SessionStoreEntry);
  }

  async listSessions(
    _projectKey: string,
  ): Promise<Array<{ sessionId: string; mtime: number }>> {
    const rows = this.db
      .prepare(
        `SELECT session_id, MAX(created_at) as max_created FROM claude_session_entries
         WHERE project_key = ?
         GROUP BY session_id`,
      )
      .all(this.userId) as any[];

    return rows.map((row) => ({
      sessionId: row.session_id,
      mtime: row.max_created
        ? new Date(row.max_created.replace(" ", "T") + "Z").getTime()
        : Date.now(),
    }));
  }

  async delete(key: SessionKey): Promise<void> {
    this.db
      .prepare(
        `DELETE FROM claude_session_entries
         WHERE project_key = ? AND session_id = ?`,
      )
      .run(this.userId, key.sessionId);
  }

  async listSubkeys(key: {
    projectKey: string;
    sessionId: string;
  }): Promise<string[]> {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT subpath FROM claude_session_entries
         WHERE project_key = ? AND session_id = ? AND subpath IS NOT NULL`,
      )
      .all(this.userId, key.sessionId) as any[];

    return rows.map((row) => row.subpath);
  }
}
