import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  UserListResponseSchema,
  UpdateStatusRequestSchema,
  AdminApiKeyListResponseSchema,
} from "../../models/schemas/users";
import {
  StatusResponseSchema,
  ErrorResponseSchema,
} from "../../models/schemas/common";
import { UserRepository } from "../../storage/repositories/user-repo";
import { ApiKeyRepository } from "../../storage/repositories/api-key-repo";
import { NotFoundError } from "../../utils/errors";
import type { AppEnv } from "../env";

export const adminRoutes = new OpenAPIHono<AppEnv>();

// 1. Get users list
const listUsersRoute = createRoute({
  method: "get",
  path: "/users",
  summary: "列出系统所有用户",
  description: "获取数据库中所有已注册用户基本信息的列表（管理员专属）。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserListResponseSchema,
        },
      },
      description: "成功拉取用户列表",
    },
  },
});

// 2. Put user activation status
const updateUserStatusRoute = createRoute({
  method: "put",
  path: "/users/{userId}/status",
  summary: "设置用户激活状态",
  description: "激活或停用指定的用户账号（管理员专属）。",
  request: {
    params: z.object({
      userId: z.string().openapi({
        description: "待更新的目标用户唯一 ID",
        example: "usr_admin",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateStatusRequestSchema,
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
      description: "用户状态成功更新",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "用户未找到",
    },
  },
});

// 3. Get keys list
const listAllKeysRoute = createRoute({
  method: "get",
  path: "/keys",
  summary: "跨用户列出所有 API 密钥",
  description:
    "跨所有用户提取系统中生成的所有 API 密钥基本信息（管理员专属）。",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AdminApiKeyListResponseSchema,
        },
      },
      description: "成功拉取系统密钥列表",
    },
  },
});

// 4. Revoke any key
const deleteAnyKeyRoute = createRoute({
  method: "delete",
  path: "/keys/{id}",
  summary: "强制吊销/删除任意密钥",
  description:
    "管理员可强行物理删除并吊销系统中任意 API 访问密钥，无视密钥所有权（管理员专属）。",
  request: {
    params: z.object({
      id: z.string().openapi({
        description: "待强行吊销的密钥唯一 ID",
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
      description: "密钥被成功强制吊销",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "密钥未找到",
    },
  },
});

adminRoutes.openapi(listUsersRoute, async (c) => {
  const userRepo = new UserRepository();
  const rawUsers = userRepo.listAll();
  const users = rawUsers.map(({ password_hash: _, settings: __, ...u }) => ({
    ...u,
    status: u.status || "inactive",
  }));
  return c.json({ users }, 200);
});

adminRoutes.openapi(updateUserStatusRoute, async (c) => {
  const { userId } = c.req.valid("param");
  const { status } = c.req.valid("json");
  const userRepo = new UserRepository();
  const user = userRepo.findById(userId);

  if (!user) {
    throw new NotFoundError("User", userId);
  }

  userRepo.updateStatus(userId, status);
  return c.json({ status: "updated" }, 200);
});

adminRoutes.openapi(listAllKeysRoute, async (c) => {
  const apiRepo = new ApiKeyRepository();
  const rawKeys = apiRepo.listAllKeys();
  const keys = rawKeys.map(({ key_hash: _, prefix: __, key_value, ...k }) => ({
    ...k,
    key: key_value ?? null,
  }));
  return c.json({ keys }, 200);
});

adminRoutes.openapi(deleteAnyKeyRoute, async (c) => {
  const { id } = c.req.valid("param");
  const apiRepo = new ApiKeyRepository();
  const keyRecord = apiRepo.get(id);

  if (!keyRecord) {
    throw new NotFoundError("API Key", id);
  }

  apiRepo.delete(id, keyRecord.user_id);
  return c.json({ status: "deleted" }, 200);
});
