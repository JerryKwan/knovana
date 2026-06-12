import { randomBytes, createHash, randomUUID } from "node:crypto";
import { ApiKeyRepository } from "../storage/repositories/api-key-repo";
import type { ApiKey } from "../models/user";

export class ApiKeyService {
  private readonly repo = new ApiKeyRepository();

  /**
   * Generates a new API Key for the user.
   * The full key is persisted and can be retrieved from the key list later.
   */
  async createKey(
    userId: string,
    name: string,
  ): Promise<{
    id: string;
    name: string;
    key: string;
    raw_key: string;
    created_at: string;
  }> {
    const id = randomUUID();
    const prefix = "sk-";

    // Generate 32 characters of secure random text (approx. 24 bytes in base64url)
    const rawEntropy = randomBytes(24).toString("base64url");
    const rawKey = `${prefix}${rawEntropy}`;
    const hash = this.hashKey(rawKey);

    const apiKey = this.repo.create({
      id,
      user_id: userId,
      name: name.trim() || "Default API Key",
      key_hash: hash,
      prefix,
      key_value: rawKey,
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      raw_key: rawKey,
      created_at: apiKey.created_at,
    };
  }

  /**
   * Lists all active API Keys for the user, including the stored full key value.
   */
  async listKeys(userId: string): Promise<
    Array<
      Pick<ApiKey, "id" | "name" | "created_at" | "last_used_at"> & {
        key: string | null;
      }
    >
  > {
    const keys = this.repo.listByUser(userId);
    return keys.map(({ id, name, key_value, created_at, last_used_at }) => ({
      id,
      name,
      key: key_value ?? null,
      created_at,
      last_used_at,
    }));
  }

  /**
   * Revokes/deletes an API key.
   */
  async deleteKey(id: string, userId: string): Promise<void> {
    this.repo.delete(id, userId);
  }

  /**
   * Validates a raw API Key.
   * On success, updates its last used timestamp and returns the associated user_id.
   */
  async validateKey(rawKey: string): Promise<string | null> {
    if (!rawKey.startsWith("sk-")) {
      return null;
    }

    const hash = this.hashKey(rawKey);
    const keyRecord = this.repo.findByHash(hash);

    if (!keyRecord) {
      return null;
    }

    this.repo.updateLastUsed(keyRecord.id);
    return keyRecord.user_id;
  }

  /**
   * Helper to hash an API key securely using SHA-256.
   */
  private hashKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
  }
}
