import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  CreateKeyRequestSchema,
  CreateKeyResponseSchema,
  ApiKeyListResponseSchema,
} from "../../models/schemas/keys";
import { StatusResponseSchema } from "../../models/schemas/common";
import { ApiKeyService } from "../../services/api-key-service";
import type { AppEnv } from "../env";

export const keysRoutes = new OpenAPIHono<AppEnv>();

// 1. Get keys list route
const listKeysRoute = createRoute({
  method: "get",
  path: "/",
  summary: "拉取密钥列表",
  description: "拉取当前已登录用户创建的所有 API 密钥（遮罩形式安全显示）。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiKeyListResponseSchema,
        },
      },
      description: "成功获取密钥列表",
    },
  },
});

// 2. Create key route
const createKeyRoute = createRoute({
  method: "post",
  path: "/",
  summary: "创建新密钥",
  description:
    "为当前用户生成一个新的 API 访问密钥，并返回明文密钥（仅此接口返回一次，请妥善保存）。",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateKeyRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: CreateKeyResponseSchema,
        },
      },
      description: "成功创建密钥",
    },
  },
});

// 3. Revoke key route
const deleteKeyRoute = createRoute({
  method: "delete",
  path: "/{id}",
  summary: "吊销/删除密钥",
  description:
    "物理删除并吊销指定的 API 密钥，被吊销的密钥将无法再通过 API 校验。",
  request: {
    params: z.object({
      id: z.string().openapi({
        description: "待删除的密钥唯一 ID",
        example: "7e9ad170-07bf-4e2b-b6fb-97302482312b",
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
      description: "密钥成功吊销",
    },
  },
});

keysRoutes.openapi(listKeysRoute, async (c) => {
  const user = c.get("user");
  const keyService = new ApiKeyService();
  const keys = await keyService.listKeys(user.id);
  return c.json({ keys }, 200);
});

keysRoutes.openapi(createKeyRoute, async (c) => {
  const user = c.get("user");
  const { name } = c.req.valid("json");
  const keyService = new ApiKeyService();
  const result = await keyService.createKey(user.id, name);
  return c.json(
    {
      id: result.id,
      name: result.name,
      prefix: result.prefix,
      raw_key: result.raw_key,
      created_at: result.created_at,
    },
    201,
  );
});

keysRoutes.openapi(deleteKeyRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const keyService = new ApiKeyService();
  await keyService.deleteKey(id, user.id);
  return c.json({ status: "deleted" }, 200);
});
