import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { dirname } from "node:path";
import type { ToolContext } from "./index";
import { KnowledgeFileOps } from "../../storage/knowledge/file-ops";
import { IndexManager } from "../../storage/knowledge/index";
import { generateSlug } from "../../utils/slug";
import { getISOStringWithOffset } from "../../utils/datetime";
import type { KnowledgeEntry } from "../../models/knowledge";

export function createUpdateKbTool(ctx: ToolContext) {
  return tool(
    "update_kb",
    "更新已有的知识库条目。如果标题变更，会自动重命名物理文件并重新关联索引。",
    {
      entry_id: z
        .string()
        .describe('需要更新的条目相对路径（如 "inbox/2024-12-01-react.md"）'),
      title: z.string().optional().describe("更新后的文档标题"),
      content: z
        .string()
        .optional()
        .describe("更新后的 Markdown 正文（不包含 frontmatter）"),
      tags: z.array(z.string()).optional().describe("更新后的标签列表"),
      source: z.string().optional().describe("更新后的来源 URL"),
      attachments: z
        .array(
          z.object({
            name: z.string().describe("附件文件名"),
            description: z.string().optional().describe("描述"),
            size: z.number().optional().describe("字节数"),
            mime_type: z.string().optional().describe("MIME类型"),
            ai_description: z.string().optional().describe("AI 解读"),
          }),
        )
        .optional()
        .describe("更新后的附件列表"),
    },
    async (args) => {
      const fileOps = new KnowledgeFileOps(ctx.kbRoot);
      const indexMgr = new IndexManager(ctx.kbRoot);

      try {
        const oldEntry = await fileOps.readEntry(args.entry_id);

        const updatedEntry: KnowledgeEntry = {
          id: oldEntry.id,
          title: args.title !== undefined ? args.title : oldEntry.title,
          content: args.content !== undefined ? args.content : oldEntry.content,
          tags: args.tags !== undefined ? args.tags : oldEntry.tags,
          source: args.source !== undefined ? args.source : oldEntry.source,
          attachments:
            args.attachments !== undefined
              ? args.attachments
              : oldEntry.attachments,
          type: oldEntry.type,
          captured_at: oldEntry.captured_at,
          updated_at: getISOStringWithOffset(),
          ai_generated: oldEntry.ai_generated,
          language: oldEntry.language,
        };

        let finalId = args.entry_id;

        // If title changed and it's not a daily note, handle file renaming
        if (args.title !== undefined && !args.entry_id.startsWith("daily/")) {
          const newSlug = generateSlug(args.title);
          const datePrefix =
            oldEntry.captured_at.split("T")[0] ||
            getISOStringWithOffset().split("T")[0];

          const hasAttachments = !!(
            updatedEntry.attachments && updatedEntry.attachments.length > 0
          );

          // Get the base folder structure, preserving topics subdirectories (e.g. 'topics/frontend')
          const currentDir = dirname(args.entry_id).replace(/\\/g, "/");
          const isFolderBased = args.entry_id.endsWith("/index.md");

          const newFolder = isFolderBased ? dirname(currentDir) : currentDir;

          const newId = hasAttachments
            ? `${newFolder}/${datePrefix}-${newSlug}/index.md`
            : `${newFolder}/${datePrefix}-${newSlug}.md`;

          // Clean paths for comparison
          const normalizedNewId = newId.replace(/\\/g, "/");
          const normalizedOldId = args.entry_id.replace(/\\/g, "/");

          if (normalizedNewId !== normalizedOldId) {
            updatedEntry.id = normalizedNewId;
            finalId = normalizedNewId;

            // Delete old file and clear from index
            await fileOps.deleteEntry(args.entry_id);
            await indexMgr.removeEntry(args.entry_id);
          }
        }

        // Save updated content and register in index
        await fileOps.saveEntry(updatedEntry);
        await indexMgr.addEntry(updatedEntry);

        return {
          content: [
            {
              type: "text",
              text: `条目已成功更新。当前相对路径为: ${finalId}`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `更新条目 "${args.entry_id}" 失败。原因: ${err.message}`,
            },
          ],
        };
      }
    },
  );
}
