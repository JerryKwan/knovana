import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { join, relative, extname } from "node:path";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import type { ToolContext } from "./index";

export function createReadAttachmentTool(ctx: ToolContext) {
  return tool(
    "read_attachment",
    "读取用户已上传到临时 attachments 目录下的文本文件内容。支持 text, markdown, json, html, css, yaml 等常见文本格式。对于无法直接读取的二进制格式，返回文件大小和元数据。",
    {
      filename: z
        .string()
        .describe("需要读取的文件名（如 'todo.txt' 或 'code.js'）"),
    },
    async (args) => {
      const attachmentsDir = join(ctx.kbRoot, "attachments");
      const filePath = join(attachmentsDir, args.filename);

      // Prevent directory traversal (path traversal check)
      const rel = relative(attachmentsDir, filePath);
      if (rel.startsWith("..") || rel.includes("/") || rel.includes("\\")) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `错误: 非法的文件名 "${args.filename}"。`,
            },
          ],
        };
      }

      if (!existsSync(filePath)) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `错误: 附件文件 "${args.filename}" 不存在。`,
            },
          ],
        };
      }

      try {
        const fileStat = await stat(filePath);
        const ext = extname(args.filename).toLowerCase();

        // List of typical text extensions
        const textExtensions = new Set([
          ".txt",
          ".md",
          ".json",
          ".html",
          ".css",
          ".js",
          ".ts",
          ".jsx",
          ".tsx",
          ".yaml",
          ".yml",
          ".csv",
          ".xml",
          ".ini",
          ".conf",
          ".log",
          ".py",
          ".sh",
          ".go",
          ".rs",
          ".java",
          ".c",
          ".cpp",
          ".h",
        ]);

        if (textExtensions.has(ext)) {
          const content = await readFile(filePath, "utf8");
          return {
            content: [
              {
                type: "text" as const,
                text: content,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text" as const,
                text: `该文件是二进制格式，无法直接读取内容。
元数据信息:
- 文件名: ${args.filename}
- 大小: ${fileStat.size} 字节
- 修改时间: ${fileStat.mtime.toISOString()}`,
              },
            ],
          };
        }
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `读取附件失败: ${err.message}`,
            },
          ],
        };
      }
    },
  );
}
