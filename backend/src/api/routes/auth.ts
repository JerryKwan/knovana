import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  AuthRequestSchema,
  AuthResponseSchema,
} from "../../models/schemas/auth";
import { ErrorResponseSchema } from "../../models/schemas/common";
import { UserService } from "../../services/user-service";
import type { AppEnv } from "../env";

export const authRoutes = new OpenAPIHono<AppEnv>();

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  summary: "用户注册",
  description: "注册新用户并创建专属知识库目录。新用户状态默认是 inactive。",
  security: [],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
      description: "用户注册成功，并返回访问 token",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "请求参数有误或用户名已被占用",
    },
  },
});

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  summary: "用户登录",
  description: "校验用户凭证，并分发 JWT token。允许 inactive 用户登录。",
  security: [],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuthRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
      description: "登录验证成功，并返回访问 token",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "用户名或密码错误",
    },
  },
});

const meRoute = createRoute({
  method: "get",
  path: "/me",
  summary: "获取当前登录用户信息",
  description:
    "获取当前已登录用户的 ID、用户名和激活状态。此接口仅进行基础 Token/Key 验证，不拦截 inactive 状态账号，以便前端展示激活状态提示。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            id: z
              .string()
              .openapi({ description: "用户唯一 ID", example: "usr_abc123" }),
            username: z
              .string()
              .openapi({ description: "用户名", example: "bob" }),
            status: z
              .string()
              .openapi({ description: "账户激活状态", example: "inactive" }),
            is_admin: z
              .boolean()
              .openapi({ description: "是否为系统管理员", example: false }),
          }),
        },
      },
      description: "成功获取当前用户信息",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "未登录或凭证失效",
    },
  },
});

authRoutes.openapi(registerRoute, async (c) => {
  const { username, password } = c.req.valid("json");
  const userService = new UserService();
  const result = await userService.register(username, password);
  return c.json(
    {
      user_id: result.userId,
      token: result.token,
    },
    201,
  );
});

authRoutes.openapi(loginRoute, async (c) => {
  const { username, password } = c.req.valid("json");
  const userService = new UserService();
  const result = await userService.login(username, password);
  return c.json(
    {
      user_id: result.userId,
      token: result.token,
    },
    200,
  );
});

authRoutes.openapi(meRoute, async (c) => {
  const user = c.get("user");
  const { config } = await import("../../config");
  return c.json(
    {
      id: user.id,
      username: user.username,
      status: user.status,
      is_admin: user.username === config.adminUsername,
    },
    200,
  );
});
