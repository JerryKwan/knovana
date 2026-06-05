import { z } from "@hono/zod-openapi";

export const ChatRequestSchema = z.object({
  message: z.string().openapi({
    description: "用户向 Agent 发送的聊天消息、提问或指令",
    example: "请帮我总结当前这个网页的重点内容。",
  }),
  session_id: z.string().optional().openapi({
    description: "历史会话 ID，如果不传则后端会自动创建并分配一个新会话",
    example: "sess_1234567890ab",
  }),
  context: z
    .object({
      page_url: z.string().optional().openapi({
        description: "来源网页 URL",
        example: "https://blog.example.com/react-server-components",
      }),
      page_title: z.string().optional().openapi({
        description: "来源网页标题",
        example: "React Server Components deep dive",
      }),
      selected_text: z.string().optional().openapi({
        description: "用户在网页中划选的文本片段",
        example:
          "Server Components allow developer to render components on server...",
      }),
      selected_images: z
        .array(
          z.object({
            src: z.string().openapi({ description: "选中图片的 URL 地址" }),
            alt: z.string().optional().openapi({ description: "图片替代说明" }),
          }),
        )
        .optional()
        .openapi({
          description: "划选或保存的图片列表",
        }),
    })
    .optional()
    .openapi({
      description:
        "浏览器当前所在的页面上下文，AI 能够通过此上下文更智能地回答或整理内容",
    }),
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
