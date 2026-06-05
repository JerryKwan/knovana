import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  KnowledgeListQuerySchema,
  KnowledgeListResponseSchema,
  KnowledgeEntryResponseSchema,
  KnowledgeUpdateSchema,
  TagsListResponseSchema,
  StatsResponseSchema,
} from "../../models/schemas/knowledge";
import {
  StatusResponseSchema,
  ErrorResponseSchema,
} from "../../models/schemas/common";
import { KnowledgeService } from "../../services/knowledge-service";
import type { AppEnv } from "../env";

export const knowledgeRoutes = new OpenAPIHono<AppEnv>();

// 1. Get entries list route
const listEntriesRoute = createRoute({
  method: "get",
  path: "/",
  summary: "拉取知识条目列表",
  description: "根据分页、分类目录和标签，获取用户知识库中的条目概要列表。",
  request: {
    query: KnowledgeListQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: KnowledgeListResponseSchema,
        },
      },
      description: "成功拉取列表",
    },
  },
});

// 2. Get tags list route
const listTagsRoute = createRoute({
  method: "get",
  path: "/tags",
  summary: "获取所有标签",
  description: "统计用户知识库中所有文档的标签，并返回各标签出现次数。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TagsListResponseSchema,
        },
      },
      description: "成功获取标签列表",
    },
  },
});

// 3. Get stats route
const getStatsRoute = createRoute({
  method: "get",
  path: "/stats",
  summary: "获取库统计指标",
  description: "计算知识库的文档总量、标签总量、关联附件总量及分类计数。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: StatsResponseSchema,
        },
      },
      description: "成功获取统计信息",
    },
  },
});

// 4. Get trigger reindex route
const triggerReindexRoute = createRoute({
  method: "get",
  path: "/reindex",
  summary: "重构检索索引",
  description: "手动触发全量磁盘扫描，重新生成 .knovana 索引缓存文件。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: StatusResponseSchema,
        },
      },
      description: "索引重构完成",
    },
  },
});

// 5. Get entry details route (regex path captures nested slashes)
const getEntryRoute = createRoute({
  method: "get",
  path: "/{entryId{.+$}}",
  summary: "获取条目详情",
  description:
    "使用相对物理路径获取单个文档的详细 frontmatter 元数据与正文内容。",
  request: {
    params: z.object({
      entryId: z.string().openapi({
        description: "条目的相对路径，支持包含斜杠",
        example: "topics/frontend/react-server-components.md",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: KnowledgeEntryResponseSchema,
        },
      },
      description: "成功获取条目内容",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "文件未找到",
    },
  },
});

// 6. Put update entry route
const updateEntryRoute = createRoute({
  method: "put",
  path: "/{entryId{.+$}}",
  summary: "更新条目内容",
  description: "更新指定路径文档的标题、正文或标签元数据，并同步更新索引。",
  request: {
    params: z.object({
      entryId: z.string().openapi({
        description: "条目的相对路径",
        example: "topics/frontend/react-server-components.md",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: KnowledgeUpdateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: StatusResponseSchema,
        },
      },
      description: "条目更新成功",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "文档未找到",
    },
  },
});

// 7. Delete entry route
const deleteEntryRoute = createRoute({
  method: "delete",
  path: "/{entryId{.+$}}",
  summary: "删除条目",
  description:
    "物理删除指定相对路径下的 Markdown 文档。如果是文件夹文档，会连带删除其下的 assets 附件文件夹。",
  request: {
    params: z.object({
      entryId: z.string().openapi({
        description: "条目的相对路径",
        example: "topics/frontend/react-server-components.md",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: StatusResponseSchema,
        },
      },
      description: "成功删除条目",
    },
  },
});

// Implement handlers
knowledgeRoutes.openapi(listEntriesRoute, async (c) => {
  const query = c.req.valid("query");
  const user = c.get("user");
  const service = new KnowledgeService(user.id);

  const items = await service.listEntries({
    tags: query.tags ? query.tags.split(",") : undefined,
    category: query.category,
    sortBy: query.sort,
  });

  const total = items.length;
  const start = (query.page - 1) * query.per_page;
  const paginatedItems = items.slice(start, start + query.per_page);

  return c.json(
    {
      entries: paginatedItems,
      total,
      page: query.page,
      per_page: query.per_page,
    },
    200,
  );
});

knowledgeRoutes.openapi(listTagsRoute, async (c) => {
  const user = c.get("user");
  const service = new KnowledgeService(user.id);
  const tags = await service.getTags();
  return c.json({ tags }, 200);
});

knowledgeRoutes.openapi(getStatsRoute, async (c) => {
  const user = c.get("user");
  const service = new KnowledgeService(user.id);
  const stats = await service.getStats();
  return c.json(stats, 200);
});

knowledgeRoutes.openapi(triggerReindexRoute, async (c) => {
  const user = c.get("user");
  const service = new KnowledgeService(user.id);
  await service.rebuildIndex();
  return c.json({ status: "reindexed" }, 200);
});

knowledgeRoutes.openapi(getEntryRoute, async (c) => {
  const { entryId } = c.req.valid("param");
  const user = c.get("user");
  const service = new KnowledgeService(user.id);

  try {
    const entry = await service.getEntry(entryId);
    return c.json(
      {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        tags: entry.tags || [],
        source_url: entry.source,
        attachments: entry.attachments
          ? entry.attachments.map((a) => ({
              name: a.name,
              description: a.description,
              size: a.size,
              mime_type: a.mime_type,
              ai_description: a.ai_description,
            }))
          : [],
        created_at: entry.captured_at,
        updated_at: entry.updated_at || entry.captured_at,
      },
      200,
    );
  } catch (err: any) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `File not found or unreadable: ${entryId}`,
        },
      },
      404,
    );
  }
});

knowledgeRoutes.openapi(updateEntryRoute, async (c) => {
  const { entryId } = c.req.valid("param");
  const body = c.req.valid("json");
  const user = c.get("user");
  const service = new KnowledgeService(user.id);

  try {
    await service.updateEntry(entryId, {
      title: body.title,
      content: body.content,
      tags: body.tags,
      source: body.source,
    });
    return c.json({ status: "updated" }, 200);
  } catch (err: any) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `Entry update failed: ${entryId}. Reason: ${err.message}`,
        },
      },
      404,
    );
  }
});

knowledgeRoutes.openapi(deleteEntryRoute, async (c) => {
  const { entryId } = c.req.valid("param");
  const user = c.get("user");
  const service = new KnowledgeService(user.id);

  await service.deleteEntry(entryId);
  return c.json({ status: "deleted" }, 200);
});
