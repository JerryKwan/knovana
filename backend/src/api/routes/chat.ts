import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";
import {
  ChatRequestSchema,
  ChatSessionsListResponseSchema,
  ChatSessionDetailResponseSchema,
} from "../../models/schemas/chat";
import {
  StatusResponseSchema,
  ErrorResponseSchema,
} from "../../models/schemas/common";
import { ChatService } from "../../services/chat-service";
import type { AppEnv } from "../env";

export const chatRoutes = new OpenAPIHono<AppEnv>();

// 1. Post stream chat/capture route
const chatStreamRoute = createRoute({
  method: "post",
  path: "/",
  summary: "流式对话 / 内容捕获",
  description:
    "与 Knovana Agent 进行双向流式对话，或者发起内容捕获/摘要指令。返回标准的 SSE（Server-Sent Events）事件流。",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ChatRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "SSE 事件流（Prism Stream Protocol v1 格式）",
      headers: {
        "Content-Type": {
          schema: {
            type: "string",
          },
          description: "text/event-stream",
        },
      },
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "用户未认证",
    },
  },
});

// 2. Get sessions list
const listSessionsRoute = createRoute({
  method: "get",
  path: "/sessions",
  summary: "获取会话列表",
  description: "按更新时间倒序，获取当前用户的所有聊天/捕获历史会话",
  request: {
    query: z.object({
      page: z.coerce
        .number()
        .int()
        .positive()
        .default(1)
        .openapi({ description: "分页页码", example: 1 }),
      per_page: z.coerce
        .number()
        .int()
        .positive()
        .default(20)
        .openapi({ description: "每页条数", example: 20 }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ChatSessionsListResponseSchema,
        },
      },
      description: "会话列表获取成功",
    },
  },
});

// 3. Get session details
const getSessionRoute = createRoute({
  method: "get",
  path: "/sessions/{id}",
  summary: "获取会话详情",
  description: "获取指定会话 ID 的元数据及其所有的聊天消息历史记录",
  request: {
    params: z.object({
      id: z
        .string()
        .openapi({ description: "会话 ID", example: "sess_abc123" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ChatSessionDetailResponseSchema,
        },
      },
      description: "会话详情及消息记录获取成功",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "会话未找到",
    },
  },
});

// 4. Delete session
const deleteSessionRoute = createRoute({
  method: "delete",
  path: "/sessions/{id}",
  summary: "删除会话",
  description: "物理删除指定会话 ID 及其下的所有聊天记录",
  request: {
    params: z.object({
      id: z
        .string()
        .openapi({ description: "会话 ID", example: "sess_abc123" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: StatusResponseSchema,
        },
      },
      description: "会话删除成功",
    },
  },
});

// Implement handlers
chatRoutes.openapi(chatStreamRoute, async (c) => {
  const input = c.req.valid("json");
  const user = c.get("user");
  const chatService = new ChatService(user.id, user.kb_path);

  return streamSSE(c, async (stream) => {
    try {
      for await (const chunk of chatService.chat(input)) {
        await stream.writeSSE({
          event: chunk.event,
          data: JSON.stringify(chunk.data),
        });
      }
    } catch (err: any) {
      console.error("[SSE Error] Streaming failure:", err);
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({
          error: {
            code: "INTERNAL_ERROR",
            message: err.message || "Streaming failed mid-turn",
          },
        }),
      });
    }
  });
});

chatRoutes.openapi(listSessionsRoute, async (c) => {
  const { page, per_page } = c.req.valid("query");
  const user = c.get("user");
  const chatService = new ChatService(user.id, user.kb_path);
  const result = chatService.listSessions(page, per_page);
  return c.json(result, 200);
});

chatRoutes.openapi(getSessionRoute, async (c) => {
  const { id } = c.req.valid("param");
  const user = c.get("user");
  const chatService = new ChatService(user.id, user.kb_path);
  try {
    const result = chatService.getSession(id);
    return c.json(result, 200);
  } catch (err: any) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: err.message || "Session not found",
        },
      },
      404,
    );
  }
});

chatRoutes.openapi(deleteSessionRoute, async (c) => {
  const { id } = c.req.valid("param");
  const user = c.get("user");
  const chatService = new ChatService(user.id, user.kb_path);
  chatService.deleteSession(id);
  return c.json({ status: "deleted" }, 200);
});
