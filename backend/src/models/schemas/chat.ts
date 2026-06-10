import { z } from "@hono/zod-openapi";

export const ChatRequestSchema = z.object({
  message: z.string().openapi({
    description: "用户当前输入的消息内容",
    example: "总结此页面",
  }),
  session_id: z.string().optional().openapi({
    description: "历史会话 ID，如果不传则后端会自动创建并分配一个新会话",
    example: "sess_1234567890ab",
  }),
  intent: z.enum(["chat", "knowledge_entry"]).optional().openapi({
    description:
      "本次消息意图。knowledge_entry 表示应将上传附件作为知识条目附件归档。",
    example: "knowledge_entry",
  }),
  attachment: z
    .object({
      name: z.string().openapi({ description: "附件文件名" }),
      size: z.number().optional().openapi({ description: "附件大小" }),
      path: z.string().openapi({ description: "附件在存储中的相对路径" }),
    })
    .optional()
    .openapi({ description: "用户上传的附件信息" }),
});

export const CreateSessionRequestSchema = z.object({
  title: z
    .string()
    .optional()
    .openapi({ description: "会话初始标题", example: "新网页对话" }),
  context: z.any().optional().openapi({ description: "页面上下文" }),
});

export const CreateSessionResponseSchema = z.object({
  id: z.string().openapi({ example: "sess_abc123" }),
  title: z.string().nullable().openapi({ example: "新网页对话" }),
  context: z
    .string()
    .nullable()
    .openapi({ description: "JSON 序列化的页面上下文" }),
  created_at: z.string().openapi({ example: "2024-12-01T14:30:00Z" }),
  updated_at: z.string().openapi({ example: "2024-12-01T14:30:00Z" }),
});

export const ChatSessionListItemSchema = z.object({
  id: z.string().openapi({ example: "sess_abc123" }),
  title: z.string().nullable().openapi({ example: "关于 React RSC 的讨论" }),
  message_count: z.number().openapi({ example: 12 }),
  created_at: z.string().openapi({ example: "2024-12-01T14:30:00Z" }),
  updated_at: z.string().openapi({ example: "2024-12-01T15:00:00Z" }),
});

export const ChatSessionsListResponseSchema = z.object({
  sessions: z.array(ChatSessionListItemSchema),
  total: z.number().openapi({ example: 25 }),
  page: z.number().openapi({ example: 1 }),
});

export const ChatMessageSchema = z.object({
  id: z.string().openapi({ example: "msg_001abc" }),
  role: z.enum(["user", "assistant"]).openapi({ example: "user" }),
  content: z.string().openapi({ example: "帮我总结这段内容..." }),
  metadata: z
    .string()
    .nullable()
    .optional()
    .openapi({ description: "序列化的 JSON 元数据" }),
  created_at: z.string().openapi({ example: "2024-12-01T14:30:00Z" }),
});

export const ChatSessionDetailResponseSchema = z.object({
  id: z.string().openapi({ example: "sess_abc123" }),
  title: z.string().nullable().openapi({ example: "关于 React RSC 的讨论" }),
  context: z
    .string()
    .nullable()
    .openapi({ description: "JSON 字符串序列化的关联页面上下文" }),
  created_at: z.string().openapi({ example: "2024-12-01T14:30:00Z" }),
  updated_at: z.string().openapi({ example: "2024-12-01T15:00:00Z" }),
  messages: z.array(ChatMessageSchema),
});
