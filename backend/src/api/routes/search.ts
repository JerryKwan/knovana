import { join } from "node:path";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  SearchQuerySchema,
  SearchResponseSchema,
} from "../../models/schemas/common";
import { SearchService } from "../../services/search-service";
import { config } from "../../config";
import type { AppEnv } from "../env";

export const searchRoutes = new OpenAPIHono<AppEnv>();

const searchRoute = createRoute({
  method: "get",
  path: "/",
  summary: "检索知识库条目",
  description:
    "快速在用户知识条目的标题、标签和文档正文内容中检索匹配的文件，并返回带匹配高亮片段的排序结果。",
  request: {
    query: SearchQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SearchResponseSchema,
        },
      },
      description: "检索成功并返回结果",
    },
  },
});

searchRoutes.openapi(searchRoute, async (c) => {
  const query = c.req.valid("query");
  const user = c.get("user");

  const userKbRoot = join(config.kbRoot, user.id);
  const searchService = new SearchService(user.id, userKbRoot);
  const results = await searchService.quickSearch(query.q, query.max_results);

  return c.json(
    {
      query: query.q,
      results,
      total: results.length,
    },
    200,
  );
});
