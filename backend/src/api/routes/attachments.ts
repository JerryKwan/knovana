import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { extname, join } from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { AttachmentManager } from "../../storage/knowledge/attachment";
import { BadRequestError } from "../../utils/errors";
import { config } from "../../config";
import type { AppEnv } from "../env";

export const attachmentsRoutes = new OpenAPIHono<AppEnv>();

// 1. Post upload route
const uploadRoute = createRoute({
  method: "post",
  path: "/",
  summary: "上传图片或文件附件",
  description:
    "将划选的网页图片或本地文件以 multipart/form-data 形式上传，保存至用户的 attachments 文件夹。",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.any().openapi({
              type: "string",
              format: "binary",
              description: "文件二进制流",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            url: z.string().openapi({
              description: "附件拉取 URL 地址",
              example: "/api/v1/attachments/usr_123/img_20241201_143000.png",
            }),
            filename: z.string().openapi({
              description: "保存至本地的文件名",
              example: "img_20241201_143000.png",
            }),
          }),
        },
      },
      description: "上传成功",
    },
    400: {
      description: "未提供有效文件",
    },
  },
});

// 2. Get serve file route
const serveAttachmentRoute = createRoute({
  method: "get",
  path: "/{userId}/{filename}",
  summary: "拉取二进制附件",
  description:
    "通过用户 ID 和文件名获取已保存附件的二进制流，并在头部添加匹配的 Content-Type 进行预览或下载。",
  request: {
    params: z.object({
      userId: z
        .string()
        .openapi({ description: "用户唯一标识", example: "usr_123" }),
      filename: z.string().openapi({
        description: "附件文件名",
        example: "img_20241201_143000.png",
      }),
    }),
  },
  responses: {
    200: {
      description: "返回文件内容二进制流",
    },
    404: {
      description: "附件文件未找到",
    },
  },
});

attachmentsRoutes.openapi(uploadRoute, async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || !(file instanceof File)) {
    throw new BadRequestError("No valid file supplied in request body");
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const userKbRoot = join(config.kbRoot, user.id);
  const manager = new AttachmentManager(userKbRoot);

  const result = await manager.saveUploadedFile(fileBuffer, file.name);

  // Return the relative endpoint that client can query
  return c.json(
    {
      url: `/api/v1/attachments/${user.id}/${result.filename}`,
      filename: result.filename,
    },
    200,
  );
});

attachmentsRoutes.openapi(serveAttachmentRoute, async (c) => {
  const { userId, filename } = c.req.valid("param");
  const filePath = join(config.kbRoot, userId, "attachments", filename);

  if (!existsSync(filePath)) {
    return c.body("File Not Found", 404);
  }

  const fileBuffer = await readFile(filePath);
  const ext = extname(filename).toLowerCase();

  // Set appropriate mime-type header
  let mimeType = "application/octet-stream";
  if (ext === ".png") mimeType = "image/png";
  else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
  else if (ext === ".gif") mimeType = "image/gif";
  else if (ext === ".webp") mimeType = "image/webp";
  else if (ext === ".svg") mimeType = "image/svg+xml";
  else if (ext === ".pdf") mimeType = "application/pdf";

  return c.body(fileBuffer, 200, {
    "Content-Type": mimeType,
  });
});
