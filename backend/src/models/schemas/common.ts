import { z } from "@hono/zod-openapi";

export const SearchQuerySchema = z.object({
  q: z.string().openapi({
    description: "搜索文本关键词",
    example: "react components",
  }),
  tags: z.string().optional().openapi({
    description: "限定标签，多个标签以逗号分隔",
    example: "frontend",
  }),
  category: z.string().optional().openapi({
    description: '限定一级分类目录，如 "topics" 或 "inbox"',
    example: "topics",
  }),
  max_results: z.coerce.number().int().positive().default(20).openapi({
    description: "最大返回条数，默认 20",
    example: 20,
  }),
});

export const SearchResultSchema = z.object({
  id: z.string().openapi({ example: "topics/frontend/rsc.md" }),
  title: z.string().openapi({ example: "React Server Components" }),
  snippet: z.string().openapi({ example: "...匹配的上下文片段..." }),
  relevance: z.enum(["high", "medium", "low"]).openapi({ example: "high" }),
  tags: z.array(z.string()).openapi({ example: ["react", "frontend"] }),
  source_url: z
    .string()
    .optional()
    .openapi({ example: "https://blog.example.com/rsc" }),
});

export const SearchResponseSchema = z.object({
  query: z.string().openapi({ example: "react components" }),
  results: z.array(SearchResultSchema),
  total: z.number().openapi({ example: 3 }),
});

export const SettingsSchema = z.object({
  default_category: z
    .string()
    .openapi({ description: "默认保存的一级分类", example: "inbox" }),
  default_language: z
    .string()
    .openapi({ description: "默认内容语言", example: "zh-CN" }),
  auto_tag: z
    .boolean()
    .openapi({ description: "是否自动生成标签", example: true }),
  theme: z.string().openapi({ description: "UI 主题模式", example: "system" }),
});

export const SettingsUpdateSchema = SettingsSchema.partial();

export const ApiKeyListItemSchema = z.object({
  id: z.string().openapi({ description: "密钥唯一 ID", example: "uuid-12345" }),
  name: z
    .string()
    .openapi({ description: "密钥名称", example: "Chrome Extension Key" }),
  prefix: z.string().openapi({ description: "密钥前缀", example: "sk-" }),
  created_at: z.string().openapi({
    description: "创建时间 (ISO 8601)",
    example: "2024-12-01T14:30:00Z",
  }),
  last_used_at: z.string().nullable().optional().openapi({
    description: "最近使用时间 (ISO 8601)",
    example: "2024-12-01T15:00:00Z",
  }),
});

export const ApiKeyListResponseSchema = z.object({
  keys: z.array(ApiKeyListItemSchema),
});

export const ApiKeyCreateRequestSchema = z.object({
  name: z
    .string()
    .openapi({ description: "密钥名称描述", example: "Chrome Extension Key" }),
});

export const ApiKeyCreateResponseSchema = z.object({
  id: z.string().openapi({ description: "密钥唯一 ID", example: "uuid-12345" }),
  name: z
    .string()
    .openapi({ description: "密钥名称", example: "Chrome Extension Key" }),
  prefix: z.string().openapi({ description: "密钥前缀", example: "sk-" }),
  raw_key: z.string().openapi({
    description: "生成的完整原始密钥（仅展示一次）",
    example: "sk-abcdef...",
  }),
  created_at: z
    .string()
    .openapi({ description: "创建时间", example: "2024-12-01T14:30:00Z" }),
});

export const StatusResponseSchema = z.object({
  status: z
    .string()
    .openapi({ description: "处理状态状态描述", example: "updated" }),
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().openapi({
      description: "系统定义的统一错误代码",
      example: "UNAUTHORIZED",
    }),
    message: z.string().openapi({
      description: "面向开发者或用户的可读错误描述",
      example: "Invalid token",
    }),
  }),
});
