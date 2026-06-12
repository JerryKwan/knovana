import { z } from "@hono/zod-openapi";

export const KnowledgeListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .openapi({ description: "页码，默认 1", example: 1 }),
  per_page: z.coerce
    .number()
    .int()
    .positive()
    .default(20)
    .openapi({ description: "每页拉取的条目数量，默认 20", example: 20 }),
  tags: z.string().optional().openapi({
    description: '过滤标签。支持传入逗号分隔的多个标签，如: "react,frontend"',
    example: "react,frontend",
  }),
  category: z.string().optional().openapi({
    description: '过滤分类文件夹。如: "inbox" 或 "topics/frontend"',
    example: "topics/frontend",
  }),
  sort: z
    .enum(["created_at", "updated_at", "title"])
    .default("created_at")
    .openapi({
      description:
        "排序规则：按创建时间、更新时间或按拼音/英文字母标题排序，默认 created_at",
      example: "updated_at",
    }),
});

export const KnowledgeListItemSchema = z.object({
  id: z.string().openapi({
    description: "相对物理路径作为全局唯一标识 ID",
    example: "topics/frontend/react-server-components.md",
  }),
  title: z
    .string()
    .openapi({ description: "文档标题", example: "React Server Components" }),
  summary: z.string().openapi({
    description: "AI 生成的 200 字以内简短摘要/摘要片段",
    example: "RSC 允许在服务端直接渲染组件...",
  }),
  tags: z.array(z.string()).openapi({
    description: "绑定的标签列表",
    example: ["react", "frontend", "ssr"],
  }),
  source_url: z.string().optional().openapi({
    description: "来源 URL",
    example: "https://blog.example.com/rsc",
  }),
  has_attachments: z
    .boolean()
    .openapi({ description: "是否包含关联的附件图片或文件", example: false }),
  attachment_count: z
    .number()
    .openapi({ description: "附件文件总数", example: 0 }),
  created_at: z.string().openapi({
    description: "创建时间 (ISO 8601)",
    example: "2024-12-01T14:30:00+08:00",
  }),
  updated_at: z.string().openapi({
    description: "最后更新时间 (ISO 8601)",
    example: "2024-12-01T15:30:00+08:00",
  }),
  type: z.string().openapi({ description: "条目类型", example: "excerpt" }),
});

export const KnowledgeListResponseSchema = z.object({
  entries: z.array(KnowledgeListItemSchema),
  total: z
    .number()
    .openapi({ description: "过滤结果下的文档总条数", example: 342 }),
  page: z.number().openapi({ description: "当前页码", example: 1 }),
  per_page: z.number().openapi({ description: "当前分页大小", example: 20 }),
});

export const KnowledgeAttachmentSchema = z.object({
  name: z
    .string()
    .openapi({ description: "附件文件名", example: "architecture.png" }),
  description: z
    .string()
    .optional()
    .openapi({ description: "附件描述说明", example: "系统整体架构图" }),
  size: z
    .number()
    .optional()
    .openapi({ description: "附件字节大小", example: 245000 }),
  mime_type: z
    .string()
    .optional()
    .openapi({ description: "MIME 类型", example: "image/png" }),
  ai_description: z.string().optional().openapi({
    description: "AI 对附件内容的自动解读",
    example: "图表展示了单体应用解耦为三个微服务的拓扑图",
  }),
});

export const KnowledgeEntryResponseSchema = z.object({
  id: z.string().openapi({
    description: "相对物理路径唯一标识 ID",
    example: "topics/frontend/react-server-components.md",
  }),
  title: z
    .string()
    .openapi({ description: "文档标题", example: "React Server Components" }),
  content: z.string().openapi({
    description: "Markdown 文档正文内容",
    example:
      "# React Server Components\n\nServer Components allow developer...",
  }),
  tags: z
    .array(z.string())
    .openapi({ description: "绑定的标签列表", example: ["react", "frontend"] }),
  source_url: z.string().optional().openapi({
    description: "来源 URL",
    example: "https://blog.example.com/rsc",
  }),
  attachments: z
    .array(KnowledgeAttachmentSchema)
    .optional()
    .openapi({ description: "关联的附件列表" }),
  created_at: z.string().openapi({
    description: "创建时间 (ISO 8601)",
    example: "2024-12-01T14:30:00+08:00",
  }),
  updated_at: z.string().openapi({
    description: "最后更新时间 (ISO 8601)",
    example: "2024-12-01T14:30:00+08:00",
  }),
});

export const KnowledgeUpdateSchema = z.object({
  title: z.string().optional().openapi({ description: "更新后的文档标题" }),
  content: z
    .string()
    .optional()
    .openapi({ description: "更新后的 Markdown 正文" }),
  tags: z
    .array(z.string())
    .optional()
    .openapi({ description: "更新后的标签列表" }),
  source: z.string().optional().openapi({ description: "更新后的来源 URL" }),
  category: z
    .string()
    .optional()
    .openapi({ description: "更新后的分类目录，如 inbox, daily, 或 topics/frontend" }),
  storage_name: z
    .string()
    .optional()
    .openapi({ description: "更新后的物理存储文件名（不含扩展名或index.md）" }),
  attachments: z
    .array(KnowledgeAttachmentSchema)
    .optional()
    .openapi({ description: "更新后的附件列表" }),
});

export const TagsListResponseSchema = z.object({
  tags: z
    .array(
      z.object({
        name: z.string().openapi({ description: "标签名称", example: "react" }),
        count: z
          .number()
          .openapi({ description: "使用此标签的文档总计数", example: 15 }),
      }),
    )
    .openapi({ description: "标签及对应频次计数列表" }),
});

export const StatsResponseSchema = z.object({
  total_entries: z
    .number()
    .openapi({ description: "知识条目总量", example: 342 }),
  total_tags: z.number().openapi({ description: "标签总量", example: 45 }),
  total_sources: z
    .number()
    .openapi({ description: "来源域名总量", example: 89 }),
  total_attachments: z
    .number()
    .openapi({ description: "附件文件总量", example: 56 }),
  entries_this_week: z
    .number()
    .openapi({ description: "本周新增条目数", example: 12 }),
  categories: z
    .object({
      inbox: z
        .number()
        .openapi({ description: "Inbox 目录下的条目数", example: 23 }),
      topics: z
        .number()
        .openapi({ description: "Topics 目录下的条目数", example: 280 }),
      daily: z
        .number()
        .openapi({ description: "Daily 目录下的条目数", example: 39 }),
    })
    .openapi({ description: "分类目录文档计数分布" }),
});
