import { z } from "@hono/zod-openapi";
import { ApiKeyResponseSchema } from "./keys";

export const UserStatusEnum = z.enum(["active", "inactive"]);

export const UserResponseSchema = z.object({
  id: z.string().openapi({
    description: "用户唯一 ID",
    example: "usr_abc123xyz456",
  }),
  username: z.string().openapi({
    description: "用户名",
    example: "bob",
  }),
  status: UserStatusEnum.openapi({
    description: "账户激活状态",
    example: "inactive",
  }),
  kb_path: z.string().openapi({
    description: "用户知识库相对于存储根目录的路径",
    example: "usr_abc123xyz456",
  }),
  created_at: z.string().openapi({
    description: "用户创建时间",
    example: "2026-06-11 14:00:00",
  }),
});

export const UserListResponseSchema = z.object({
  users: z.array(UserResponseSchema).openapi({
    description: "系统所有注册用户列表",
  }),
});

export const UpdateStatusRequestSchema = z.object({
  status: UserStatusEnum.openapi({
    description: "新的账号状态",
    example: "active",
  }),
});

export const AdminApiKeyResponseSchema = ApiKeyResponseSchema.extend({
  user_id: z.string().openapi({
    description: "密钥所有者的用户 ID",
    example: "usr_abc123xyz456",
  }),
  username: z.string().openapi({
    description: "密钥所有者的用户名",
    example: "bob",
  }),
});

export const AdminApiKeyListResponseSchema = z.object({
  keys: z.array(AdminApiKeyResponseSchema).openapi({
    description: "系统所有 API 密钥列表",
  }),
});
