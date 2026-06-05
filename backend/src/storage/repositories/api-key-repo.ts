import { getDatabase } from "../database";
import type { ApiKey } from "../../models/user";

export class ApiKeyRepository {
  private readonly db = getDatabase();

  create(apiKey: Omit<ApiKey, "created_at" | "last_used_at">): ApiKey {
    this.db
      .prepare(
        "INSERT INTO api_keys (id, user_id, name, key_hash, prefix) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        apiKey.id,
        apiKey.user_id,
        apiKey.name,
        apiKey.key_hash,
        apiKey.prefix,
      );

    return this.get(apiKey.id)!;
  }

  get(id: string): ApiKey | null {
    const row = this.db.prepare("SELECT * FROM api_keys WHERE id = ?").get(id);
    return row ? (row as unknown as ApiKey) : null;
  }

  findByHash(hash: string): ApiKey | null {
    const row = this.db
      .prepare("SELECT * FROM api_keys WHERE key_hash = ?")
      .get(hash);
    return row ? (row as unknown as ApiKey) : null;
  }

  listByUser(userId: string): ApiKey[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
      )
      .all(userId);
    return rows as unknown as ApiKey[];
  }

  delete(id: string, userId: string): void {
    this.db
      .prepare("DELETE FROM api_keys WHERE id = ? AND user_id = ?")
      .run(id, userId);
  }

  updateLastUsed(id: string): void {
    this.db
      .prepare(
        "UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?",
      )
      .run(id);
  }
}
