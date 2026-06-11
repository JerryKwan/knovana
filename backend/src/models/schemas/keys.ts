import { z } from "@hono/zod-openapi";

export const CreateKeyRequestSchema = z.object({
  name: z.string().min(1).max(50).openapi({
    description: "API Key 的描述性名称",
    example: "Chrome 扩展密钥",
  }),
});

export const ApiKeyResponseSchema = z.object({
  id: z.string().openapi({
    description: "API Key 的唯一 ID",
    example: "7e9ad170-07bf-4e2b-b6fb-97302482312b",
  }),
  name: z.string().openapi({
    description: "API Key 的描述性名称",
    example: "Chrome 扩展密钥",
  }),
  prefix: z.string().openapi({
    description: "API Key 的前缀，用于列表遮罩",
    example: "sk-",
  }),
  created_at: z.string().openapi({
    description: "密钥创建时间",
    example: "2026-06-11T14:00:00.000Z",
  }),
  last_used_at: z.string().nullable().optional().openapi({
    description: "最后使用该密钥访问 API 的时间",
    example: "2026-06-11T14:30:00.000Z",
  }),
});

export const CreateKeyResponseSchema = ApiKeyResponseSchema.extend({
  raw_key: z.string().openapi({
    description: "生成的完整原始 API 密钥，仅此接口返回一次",
    example: "sk-F6fB97302482312b_secure_entropy_key",
  }),
});

export const ApiKeyListResponseSchema = z.object({
  keys: z.array(ApiKeyResponseSchema).openapi({
    description: "当前用户的 API 密钥列表",
  }),
});
