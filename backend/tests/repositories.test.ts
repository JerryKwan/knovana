import { describe, it, expect, beforeAll } from "vitest";
import { getDatabase } from "../src/storage/database";
import { runMigrations } from "../src/storage/migrations";
import { UserRepository } from "../src/storage/repositories/user-repo";
import { SessionRepository } from "../src/storage/repositories/session-repo";
import { MessageRepository } from "../src/storage/repositories/message-repo";
import { config } from "../src/config";

describe("SQLite Repositories Tests", () => {
  beforeAll(() => {
    // Override db path to run tests in-memory
    config.dbPath = ":memory:";
    runMigrations();
  });

  it("UserRepository creates and retrieves users", () => {
    const userRepo = new UserRepository();
    const mockUser = {
      id: "usr_test123",
      username: "testuser",
      password_hash: "hashedpass",
      kb_path: "usr_test123",
      settings: "{}",
    };

    const created = userRepo.create(mockUser);
    expect(created.id).toBe(mockUser.id);
    expect(created.username).toBe(mockUser.username);

    const found = userRepo.findById(mockUser.id);
    expect(found).not.toBeNull();
    expect(found?.username).toBe(mockUser.username);

    const foundByName = userRepo.findByUsername(mockUser.username);
    expect(foundByName).not.toBeNull();
    expect(foundByName?.id).toBe(mockUser.id);
  });

  it("Session and Message repositories manage history sessions", () => {
    const sessionRepo = new SessionRepository();
    const messageRepo = new MessageRepository();

    const session = sessionRepo.create("sess_test1", "usr_test123", {
      page_url: "https://test.com",
    });
    expect(session.id).toBe("sess_test1");
    expect(session.user_id).toBe("usr_test123");

    // Create user and assistant messages
    messageRepo.create("sess_test1", "user", "What is RSC?");
    messageRepo.create("sess_test1", "assistant", "React Server Components...");

    // Retrieve messages
    const messages = messageRepo.listBySession("sess_test1");
    expect(messages.length).toBe(2);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toBe("What is RSC?");
    expect(messages[1].role).toBe("assistant");

    // List session items including message count
    const listResult = sessionRepo.listByUser("usr_test123", 1, 10);
    expect(listResult.total).toBe(1);
    expect(listResult.items[0].message_count).toBe(2);
    expect(listResult.items[0].id).toBe("sess_test1");

    // Clean up session
    sessionRepo.delete("sess_test1");
    const deletedSession = sessionRepo.get("sess_test1");
    expect(deletedSession).toBeNull();
  });
});
