import { describe, it, expect, beforeAll } from "vitest";
import { createApp } from "../src/api/app";
import { getDatabase } from "../src/storage/database";
import { runMigrations } from "../src/storage/migrations";
import { UserRepository } from "../src/storage/repositories/user-repo";
import { config } from "../src/config";

describe("Dashboard HTTP API Integration Tests", () => {
  let app: any;
  let bobToken: string;
  let bobUserId: string;
  let adminToken: string;
  let createdKeyId: string;

  beforeAll(() => {
    config.dbPath = ":memory:";
    config.adminUsername = "testadmin";
    config.adminPassword = "adminpassword123";
    runMigrations();
    app = createApp();
  });

  it("1. Registers a new user who is 'inactive' by default", async () => {
    const res = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "bob",
        password: "password123456",
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.user_id).toBeDefined();

    bobToken = data.token;
    bobUserId = data.user_id;

    // Verify DB entry status is inactive
    const userRepo = new UserRepository();
    const bobUser = userRepo.findById(bobUserId);
    expect(bobUser).not.toBeNull();
    expect(bobUser?.status).toBe("inactive");
  });

  it("2. Allows inactive user to access /me to read their status", async () => {
    const res = await app.request("/api/v1/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bobToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.username).toBe("bob");
    expect(data.status).toBe("inactive");
  });

  it("3. Blocks inactive user from creating or listing API keys", async () => {
    // Attempt List Keys
    const listRes = await app.request("/api/v1/keys", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bobToken}`,
      },
    });
    expect(listRes.status).toBe(403);
    const listData = await listRes.json();
    expect(listData.error?.code).toBe("FORBIDDEN");

    // Attempt Create Key
    const createRes = await app.request("/api/v1/keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bobToken}`,
      },
      body: JSON.stringify({ name: "Extension Key" }),
    });
    expect(createRes.status).toBe(403);
  });

  it("4. Authenticates the admin user synced from env configuration", async () => {
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testadmin",
        password: "adminpassword123",
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    adminToken = data.token;
  });

  it("5. Allows admin to list all users", async () => {
    const res = await app.request("/api/v1/admin/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.users).toBeDefined();
    expect(data.users.length).toBeGreaterThanOrEqual(2);

    const bob = data.users.find((u: any) => u.username === "bob");
    expect(bob).toBeDefined();
    expect(bob.status).toBe("inactive");
  });

  it("6. Allows admin to activate bob", async () => {
    const res = await app.request(`/api/v1/admin/users/${bobUserId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "active" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("updated");

    // Verify in DB
    const userRepo = new UserRepository();
    const bobUser = userRepo.findById(bobUserId);
    expect(bobUser?.status).toBe("active");
  });

  it("7. Allows activated bob to create and list keys", async () => {
    // Create Key
    const createRes = await app.request("/api/v1/keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bobToken}`,
      },
      body: JSON.stringify({ name: "Bob's Key" }),
    });

    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.id).toBeDefined();
    expect(createData.raw_key).toBeDefined();
    expect(createData.raw_key.startsWith("sk-")).toBe(true);

    createdKeyId = createData.id;

    // List Keys
    const listRes = await app.request("/api/v1/keys", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bobToken}`,
      },
    });

    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.keys.length).toBe(1);
    expect(listData.keys[0].name).toBe("Bob's Key");
  });

  it("8. Allows admin to list all keys in the system and revoke bob's key", async () => {
    // Admin list keys
    const listRes = await app.request("/api/v1/admin/keys", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.keys.length).toBeGreaterThanOrEqual(1);

    const bobKey = listData.keys.find((k: any) => k.id === createdKeyId);
    expect(bobKey).toBeDefined();
    expect(bobKey.username).toBe("bob");

    // Admin revoke key
    const revokeRes = await app.request(`/api/v1/admin/keys/${createdKeyId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    expect(revokeRes.status).toBe(200);

    // Verify bob's keys list is now empty
    const verifyRes = await app.request("/api/v1/keys", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bobToken}`,
      },
    });

    expect(verifyRes.status).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.keys.length).toBe(0);
  });
});
