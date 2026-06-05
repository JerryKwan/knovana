import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  SettingsSchema,
  SettingsUpdateSchema,
  StatusResponseSchema,
  ApiKeyListResponseSchema,
  ApiKeyCreateRequestSchema,
  ApiKeyCreateResponseSchema,
} from "../../models/schemas/common";
import { UserService } from "../../services/user-service";
import { ApiKeyService } from "../../services/api-key-service";
import type { AppEnv } from "../env";

export const settingsRoutes = new OpenAPIHono<AppEnv>();

// 1. Get settings route
const getSettingsRoute = createRoute({
  method: "get",
  path: "/",
  summary: "获取当前用户设置",
  description:
    "读取当前已验证登录用户的默认一级分类、主题、语言等偏好设置参数。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: SettingsSchema,
        },
      },
      description: "设置读取成功",
    },
  },
});

// 2. Put settings route
const updateSettingsRoute = createRoute({
  method: "put",
  path: "/",
  summary: "更新当前用户设置",
  description: "全量或增量修改当前已登录用户的全局偏好设置。",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SettingsUpdateSchema,
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
      description: "设置更新成功",
    },
  },
});

settingsRoutes.openapi(getSettingsRoute, async (c) => {
  const user = c.get("user");
  const userService = new UserService();
  const settings = await userService.getSettings(user.id);
  return c.json(settings, 200);
});

settingsRoutes.openapi(updateSettingsRoute, async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");
  const userService = new UserService();
  await userService.updateSettings(user.id, body);
  return c.json({ status: "updated" }, 200);
});

// 3. List API keys
const listKeysRoute = createRoute({
  method: "get",
  path: "/keys",
  summary: "获取当前用户的 API 密钥列表",
  description:
    "列出当前已登录用户创建的所有 Personal Access Token / API Key（出于安全考虑，只展示元数据，不展示签名密钥本身）。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiKeyListResponseSchema,
        },
      },
      description: "密钥列表拉取成功",
    },
  },
});

// 4. Create API key
const createKeyRoute = createRoute({
  method: "post",
  path: "/keys",
  summary: "生成新 API 密钥",
  description:
    "创建一个新的 API 密钥，并将包含 `sk-` 前缀的原始密钥返回给用户。请注意，原始密钥仅在此处返回一次，请妥善保存！",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ApiKeyCreateRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiKeyCreateResponseSchema,
        },
      },
      description: "密钥创建成功",
    },
  },
});

// 5. Delete API key
const deleteKeyRoute = createRoute({
  method: "delete",
  path: "/keys/{id}",
  summary: "撤销/删除 API 密钥",
  description:
    "物理删除并撤销指定的 API 密钥，该密钥对应的客户端请求将立即可视作未授权。",
  request: {
    params: z.object({
      id: z.string().openapi({ description: "密钥 ID", example: "uuid-12345" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: StatusResponseSchema,
        },
      },
      description: "密钥撤销成功",
    },
  },
});

settingsRoutes.openapi(listKeysRoute, async (c) => {
  const user = c.get("user");
  const keyService = new ApiKeyService();
  const keys = await keyService.listKeys(user.id);
  return c.json({ keys }, 200);
});

settingsRoutes.openapi(createKeyRoute, async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");
  const keyService = new ApiKeyService();
  const result = await keyService.createKey(user.id, body.name);
  return c.json(result, 200);
});

settingsRoutes.openapi(deleteKeyRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const keyService = new ApiKeyService();
  await keyService.deleteKey(id, user.id);
  return c.json({ status: "deleted" }, 200);
});
