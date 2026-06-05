import { describe, it, expect, beforeAll } from "vitest";
import { getDatabase } from "../src/storage/database";
import { runMigrations } from "../src/storage/migrations";
import { UserRepository } from "../src/storage/repositories/user-repo";
import { ApiKeyService } from "../src/services/api-key-service";
import { config } from "../src/config";

describe("API Key Service & Repository Tests", () => {
  const userId = "usr_apikey_test";

  beforeAll(() => {
    config.dbPath = ":memory:";
    runMigrations();

    // Seed test user
    const userRepo = new UserRepository();
    userRepo.create({
      id: userId,
      username: "apikey_user",
      password_hash: "hashed",
      kb_path: userId,
      settings: "{}",
    });
  });

  it("Generates a secure API Key with sk- prefix and hashes it in repository", async () => {
    const keyService = new ApiKeyService();
    const keyResult = await keyService.createKey(userId, "Extension Key");

    expect(keyResult.id).toBeDefined();
    expect(keyResult.prefix).toBe("sk-");
    expect(keyResult.raw_key.startsWith("sk-")).toBe(true);
    expect(keyResult.name).toBe("Extension Key");

    // Retrieve active keys list
    const keysList = await keyService.listKeys(userId);
    const key = keysList.find((k) => k.id === keyResult.id);
    expect(key).toBeDefined();
    expect(key?.name).toBe("Extension Key");
    expect((key as any).key_hash).toBeUndefined(); // Should hide the hash!
  });

  it("Validates active keys and updates usage timestamp", async () => {
    const keyService = new ApiKeyService();
    const keyResult = await keyService.createKey(userId, "Validation Key");

    // Initially validated successfully
    const validatedUserId = await keyService.validateKey(keyResult.raw_key);
    expect(validatedUserId).toBe(userId);

    // Lists should reflect that it was used
    const keysList = await keyService.listKeys(userId);
    const validatedKeyMetadata = keysList.find((k) => k.id === keyResult.id);
    expect(validatedKeyMetadata?.last_used_at).not.toBeNull();
  });

  it("Rejects invalid and deleted/revoked API keys", async () => {
    const keyService = new ApiKeyService();
    const keyResult = await keyService.createKey(userId, "Revocable Key");

    // Valid initially
    let validated = await keyService.validateKey(keyResult.raw_key);
    expect(validated).toBe(userId);

    // Delete key
    await keyService.deleteKey(keyResult.id, userId);

    // Validation fails after revocation
    validated = await keyService.validateKey(keyResult.raw_key);
    expect(validated).toBeNull();

    // Validation fails on completely invalid keys
    validated = await keyService.validateKey("sk-invalidkey12345");
    expect(validated).toBeNull();
  });
});
