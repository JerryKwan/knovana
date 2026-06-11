import { getDatabase } from "./database";
import bcrypt from "bcryptjs";
import { config } from "../config";
import { DEFAULT_SETTINGS } from "../models/user";

/**
 * Runs the database migrations, initializing SQLite tables and indexes if they do not exist.
 */
export function runMigrations(): void {
  const db = getDatabase();

  db.exec("BEGIN TRANSACTION;");
  try {
    // 1. Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        username      TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        kb_path       TEXT NOT NULL,
        settings      TEXT DEFAULT '{}',
        created_at    TEXT DEFAULT (datetime('now')),
        status        TEXT DEFAULT 'inactive'
      );
    `);

    // Migration for existing users table to add status column if it doesn't exist
    try {
      db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'inactive';");
    } catch (err) {
      // Ignore error if column already exists
    }

    // 2. Chat sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT,
        context     TEXT,
        created_at  TEXT DEFAULT (datetime('now')),
        updated_at  TEXT DEFAULT (datetime('now'))
      );
    `);

    // Indexes for chat sessions
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON chat_sessions(user_id);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_updated ON chat_sessions(updated_at DESC);
    `);

    // 3. Chat messages table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id          TEXT PRIMARY KEY,
        session_id  TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role        TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content     TEXT NOT NULL,
        metadata    TEXT,
        created_at  TEXT DEFAULT (datetime('now'))
      );
    `);

    // Indexes for chat messages
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
    `);

    // 4. API Keys table for Personal Access Tokens
    db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name         TEXT NOT NULL,
        key_hash     TEXT UNIQUE NOT NULL,
        prefix       TEXT NOT NULL,
        created_at   TEXT DEFAULT (datetime('now')),
        last_used_at TEXT
      );
    `);

    // Indexes for api_keys
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
    `);

    // 5. Claude Session Entries table for external session transcripts
    db.exec(`
      CREATE TABLE IF NOT EXISTS claude_session_entries (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        project_key  TEXT NOT NULL,
        session_id   TEXT NOT NULL,
        subpath      TEXT,
        entry_uuid   TEXT UNIQUE,
        data         TEXT NOT NULL,
        created_at   TEXT DEFAULT (datetime('now'))
      );
    `);

    // Index for claude_session_entries queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_claude_entries_lookup ON claude_session_entries(project_key, session_id);
    `);

    db.exec("COMMIT;");

    // Sync admin user
    syncAdminUser(db);
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

/**
 * Synchronizes the administrator credentials from environmental config to SQLite users database.
 */
function syncAdminUser(db: any): void {
  const username = config.adminUsername;
  const password = config.adminPassword;

  if (!username || !password) return;

  const existing = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  if (!existing) {
    const userId = "usr_admin";
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const kbPath = userId;
    const settings = JSON.stringify(DEFAULT_SETTINGS);

    db.prepare(
      "INSERT INTO users (id, username, password_hash, kb_path, settings, status) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(userId, username, hash, kbPath, settings, "active");

    console.log(`[SQLite] Admin user '${username}' created and activated.`);
  } else {
    // Verify password matching config, sync changes
    const matches = bcrypt.compareSync(password, existing.password_hash);
    if (!matches) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(
        hash,
        username,
      );
      console.log(
        `[SQLite] Admin user '${username}' credentials synced from env configuration.`,
      );
    }
    // Admin must always be active
    if (existing.status !== "active") {
      db.prepare("UPDATE users SET status = 'active' WHERE username = ?").run(
        username,
      );
      console.log(
        `[SQLite] Admin user '${username}' status forced to 'active'.`,
      );
    }
  }
}
