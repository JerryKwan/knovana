import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { dirname, join, basename } from "node:path";
import { mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { ToolContext } from "./index";
import { KnowledgeFileOps } from "../../storage/knowledge/file-ops";
import { IndexManager } from "../../storage/knowledge/index";
import { getISOStringWithOffset } from "../../utils/datetime";
import {
  copyFileUnique,
  encodePathSegments,
  extractAttachmentFilename,
  filenameFromContentDisposition,
  inferExtensionFromContentType,
  sanitizeAttachmentFilename,
  writeUniqueFile,
} from "../../utils/filename";
import type { KnowledgeAttachment } from "../../models/knowledge";

export function createAttachmentManagerTool(ctx: ToolContext) {
  return tool(
    "attachment_manager",
    "下载远程图片或文件附件并保存到指定知识条目的本地 assets 目录中。会自动将普通 .md 条目升级为包含 attachments 的文件夹格式。",
    {
      action: z
        .enum(["download", "list", "import"])
        .describe(
          "操作动作: download (下载保存), list (列出关联附件) 或 import (导入本地已上传的文件)",
        ),
      url: z
        .string()
        .optional()
        .describe("远程文件的下载 URL（download 动作时必填）"),
      local_path: z
        .string()
        .optional()
        .describe(
          "本地已上传附件的相对路径，如 'attachments/todo.txt'（import 动作时必填）",
        ),
      target_entry_id: z
        .string()
        .describe('关联的知识条目相对路径（如 "inbox/2024-12-01-react.md"）'),
      description: z
        .string()
        .optional()
        .describe("附件描述，将记录在 YAML frontmatter 中"),
    },
    async (args) => {
      const fileOps = new KnowledgeFileOps(ctx.kbRoot);
      const indexMgr = new IndexManager(ctx.kbRoot);

      try {
        const entryId = args.target_entry_id.replace(/\\/g, "/");

        if (args.action === "list") {
          const entry = await fileOps.readEntry(entryId);
          const attachments = entry.attachments || [];
          const listStr = attachments
            .map(
              (att) =>
                `- ${att.name} (${att.size || 0} bytes) - Description: ${att.description || ""}`,
            )
            .join("\n");
          const output =
            attachments.length > 0
              ? `该条目绑定的附件列表:\n\n${listStr}`
              : "此条目目前没有绑定任何附件。";

          return {
            content: [{ type: "text", text: output }],
          };
        }

        if (args.action === "import") {
          if (!args.local_path) {
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: "错误: 执行导入动作时必须提供 local_path。",
                },
              ],
            };
          }

          const sourceFilename = extractAttachmentFilename(args.local_path);
          if (!sourceFilename) {
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: `错误: 非法的本地附件路径 "${args.local_path}"。`,
                },
              ],
            };
          }

          const srcPath = join(ctx.kbRoot, "attachments", sourceFilename);
          if (!existsSync(srcPath)) {
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: `错误: 找不到本地已上传文件 "${args.local_path}"。`,
                },
              ],
            };
          }

          const entry = await fileOps.readEntry(entryId);
          let finalEntryId = entryId;

          // If target is not a folder-based note, convert it
          if (!entryId.endsWith("/index.md")) {
            const currentDir = dirname(entryId).replace(/\\/g, "/");
            const slug = basename(entryId, ".md");

            const newEntryId = `${currentDir}/${slug}/index.md`;

            // Delete old single file and clear index
            await fileOps.deleteEntry(entryId);
            await indexMgr.removeEntry(entryId);

            entry.id = newEntryId;
            finalEntryId = newEntryId;
          }

          const targetFilePath = fileOps.resolveEntryPath(finalEntryId);
          const assetsDir = join(dirname(targetFilePath), "assets");
          await mkdir(assetsDir, { recursive: true });

          const copied = await copyFileUnique(
            srcPath,
            assetsDir,
            sourceFilename,
          );
          const filename = copied.filename;

          // Get file stat for size
          const fileStat = await stat(copied.path);

          const newAttachment: KnowledgeAttachment = {
            name: filename,
            description: args.description || filename,
            size: fileStat.size,
          };

          entry.attachments = entry.attachments || [];
          entry.attachments = entry.attachments.filter(
            (a) => a.name !== filename,
          );
          entry.attachments.push(newAttachment);
          entry.updated_at = getISOStringWithOffset();

          await fileOps.saveEntry(entry);
          await indexMgr.addEntry(entry);

          const assetRef = `assets/${encodePathSegments(filename)}`;
          return {
            content: [
              {
                type: "text",
                text: `附件 "${filename}" 成功导入并保存至 ${assetsDir}。
本地相对引用路径为: ${assetRef}。
此条目已升级/更新为文件夹格式: ${finalEntryId}。
请务必在 Markdown 正文中使用 ![描述](${assetRef}) 来引用该附件。`,
              },
            ],
          };
        }

        // download action
        if (!args.url) {
          return {
            isError: true,
            content: [
              { type: "text", text: "错误: 执行下载动作时必须提供 url。" },
            ],
          };
        }

        // Read the target note
        const entry = await fileOps.readEntry(entryId);

        // Fetch remote file
        const response = await fetch(args.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine filename
        const urlObj = new URL(args.url);
        const urlFilename = decodeFilenameFromUrlPath(urlObj.pathname);
        const contentType = response.headers.get("Content-Type") || "";
        const fallbackExt = inferExtensionFromContentType(contentType);
        const filename = sanitizeAttachmentFilename(
          filenameFromContentDisposition(
            response.headers.get("Content-Disposition"),
          ) ||
            urlFilename ||
            "attachment",
          { fallbackBase: "attachment", fallbackExt },
        );

        // If not folder-based note, convert it!
        let finalEntryId = entryId;

        if (!entryId.endsWith("/index.md")) {
          const currentDir = dirname(entryId).replace(/\\/g, "/");
          const slug = basename(entryId, ".md");

          const newEntryId = `${currentDir}/${slug}/index.md`;

          // Delete old single file and clear index
          await fileOps.deleteEntry(entryId);
          await indexMgr.removeEntry(entryId);

          entry.id = newEntryId;
          finalEntryId = newEntryId;
        }

        // Save binary file to disk under the note's assets folder
        const targetFilePath = fileOps.resolveEntryPath(finalEntryId);
        const assetsDir = join(dirname(targetFilePath), "assets");
        await mkdir(assetsDir, { recursive: true });

        const written = await writeUniqueFile(assetsDir, filename, buffer);
        const finalFilename = written.filename;

        // Update frontmatter attachments meta
        const newAttachment: KnowledgeAttachment = {
          name: finalFilename,
          description: args.description || finalFilename,
          size: buffer.length,
          mime_type: response.headers.get("Content-Type") || undefined,
        };

        entry.attachments = entry.attachments || [];
        // Prevent duplicate attachment listing
        entry.attachments = entry.attachments.filter(
          (a) => a.name !== finalFilename,
        );
        entry.attachments.push(newAttachment);
        entry.updated_at = getISOStringWithOffset();

        // Write the note file and update index cache
        await fileOps.saveEntry(entry);
        await indexMgr.addEntry(entry);

        const assetRef = `assets/${encodePathSegments(finalFilename)}`;
        return {
          content: [
            {
              type: "text",
              text: `附件成功保存至 ${assetsDir}。
下载后的相对引用路径为: ${assetRef}。
此条目已升级/更新为文件夹格式: ${finalEntryId}。
请务必在 Markdown 正文中使用 ![描述](${assetRef}) 来引用下载好的文件。`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `下载或关联附件失败: ${err.message}`,
            },
          ],
        };
      }
    },
  );
}

function decodeFilenameFromUrlPath(pathname: string): string {
  const rawName = basename(pathname);
  if (!rawName) return "";

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}
