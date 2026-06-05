import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { config } from "../config";

let dbInstance: DatabaseSync | null = null;

/**
 * Initializes and returns a synchronous SQLite database connection.
 * Uses Node's built-in node:sqlite module for zero native compilation dependencies.
 */
export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = config.dbPath;
  const dbDir = dirname(dbPath);

  // Ensure the database directory exists
  try {
    mkdirSync(dbDir, { recursive: true });
  } catch (err) {
    // Ignore if directory already exists
  }

  dbInstance = new DatabaseSync(dbPath);

  // Enable foreign key support in SQLite
  dbInstance.exec("PRAGMA foreign_keys = ON;");

  return dbInstance;
}
