import { getDatabase } from "../database";
import type { User, UserSettings } from "../../models/user";

export class UserRepository {
  private readonly db = getDatabase();

  findById(id: string): User | null {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return row ? (row as unknown as User) : null;
  }

  findByUsername(username: string): User | null {
    const row = this.db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);
    return row ? (row as unknown as User) : null;
  }

  create(user: Omit<User, "created_at">): User {
    this.db
      .prepare(
        "INSERT INTO users (id, username, password_hash, kb_path, settings) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        user.id,
        user.username,
        user.password_hash,
        user.kb_path,
        user.settings,
      );

    return this.findById(user.id)!;
  }

  updateSettings(id: string, settings: UserSettings): void {
    this.db
      .prepare("UPDATE users SET settings = ? WHERE id = ?")
      .run(JSON.stringify(settings), id);
  }

  listAll(): User[] {
    const rows = this.db
      .prepare("SELECT * FROM users ORDER BY created_at DESC")
      .all();
    return rows as unknown as User[];
  }

  updateStatus(id: string, status: "active" | "inactive"): void {
    this.db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, id);
  }
}
