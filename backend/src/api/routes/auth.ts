import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  AuthRequestSchema,
  AuthResponseSchema,
} from "../../models/schemas/auth";
import { ErrorResponseSchema } from "../../models/schemas/common";
import { UserService } from "../../services/user-service";

export const authRoutes = new OpenAPIHono();

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  summary: "用户注册",
  description: "注册新用户并创建专属知识库目录",
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
  description: "校验用户凭证，并分发 JWT token",
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
