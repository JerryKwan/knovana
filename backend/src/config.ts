import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load .env file at startup relative to this file's location
dotenv.config({ path: path.resolve(import.meta.dirname, "../.env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  KNOVANA_HOST: z.string().default("127.0.0.1"),
  KNOVANA_PORT: z.coerce.number().int().positive().default(8000),
  KNOVANA_JWT_SECRET: z
    .string()
    .default("change-me-in-production-secret-key-default"),
  KNOVANA_JWT_EXPIRE_DAYS: z.coerce.number().int().positive().default(30),
  KNOVANA_DB_PATH: z.string().default("data/knovana.db"),
  KNOVANA_KB_ROOT: z.string().default("knowledge-base"),
  KNOVANA_MAX_CONTEXT_LENGTH: z.coerce
    .number()
    .int()
    .positive()
    .default(128000),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_AUTH_TOKEN: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().default("https://api.anthropic.com"),
  ANTHROPIC_MODEL: z.string().optional(),
  KNOVANA_AGENT_TRACE: z.string().optional(),
  KNOVANA_CORS_ORIGINS: z
    .string()
    .default("chrome-extension://*,http://localhost:*,http://127.0.0.1:*"),
  KNOVANA_ADMIN_USERNAME: z.string().default("admin"),
  KNOVANA_ADMIN_PASSWORD: z.string().default("admin-password-123456"),
});

const parsedEnv = envSchema.parse(process.env);

import fs from "node:fs";
// Automatically ensure KNOVANA_KB_ROOT directory exists on load
if (parsedEnv.KNOVANA_KB_ROOT) {
  try {
    if (!fs.existsSync(parsedEnv.KNOVANA_KB_ROOT)) {
      fs.mkdirSync(parsedEnv.KNOVANA_KB_ROOT, { recursive: true });
      console.log(
        `[Config] Created KNOVANA_KB_ROOT directory: ${parsedEnv.KNOVANA_KB_ROOT}`,
      );
    }
  } catch (err) {
    console.error(
      `[Config] Failed to create KNOVANA_KB_ROOT directory ${parsedEnv.KNOVANA_KB_ROOT}:`,
      err,
    );
  }
}

export const config = {
  env: parsedEnv.NODE_ENV,
  host: parsedEnv.KNOVANA_HOST,
  port: parsedEnv.KNOVANA_PORT,
  jwtSecret: parsedEnv.KNOVANA_JWT_SECRET,
  jwtExpireDays: parsedEnv.KNOVANA_JWT_EXPIRE_DAYS,
  dbPath: parsedEnv.KNOVANA_DB_PATH,
  kbRoot: parsedEnv.KNOVANA_KB_ROOT,
  maxContextLength: parsedEnv.KNOVANA_MAX_CONTEXT_LENGTH,
  anthropicApiKey:
    parsedEnv.ANTHROPIC_API_KEY || parsedEnv.ANTHROPIC_AUTH_TOKEN,
  anthropicBaseUrl: parsedEnv.ANTHROPIC_BASE_URL,
  anthropicModel: parsedEnv.ANTHROPIC_MODEL,
  agentTrace: /^(1|true|yes|on)$/i.test(parsedEnv.KNOVANA_AGENT_TRACE || ""),
  corsOrigins: parsedEnv.KNOVANA_CORS_ORIGINS.split(",").map((origin) =>
    origin.trim(),
  ),
  adminUsername: parsedEnv.KNOVANA_ADMIN_USERNAME,
  adminPassword: parsedEnv.KNOVANA_ADMIN_PASSWORD,
};
