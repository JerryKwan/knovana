import { z } from "@hono/zod-openapi";

export const AuthRequestSchema = z.object({
  username: z.string().min(3).max(30).openapi({
    description: "用户名",
    example: "alice",
  }),
  password: z.string().min(6).max(100).openapi({
    description: "密码",
    example: "secure-password123",
  }),
});

export const AuthResponseSchema = z.object({
  user_id: z.string().openapi({
    description: "用户唯一标识 ID",
    example: "usr_ab12cd34ef56",
  }),
  token: z.string().openapi({
    description: "JWT 访问 Token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  }),
});
