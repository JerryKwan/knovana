import { getDatabase } from "./database";

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
        created_at    TEXT DEFAULT (datetime('now'))
      );
    `);

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

    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}
