import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { ToolContext } from "./index";
import { KnowledgeFileOps } from "../../storage/knowledge/file-ops";
import { IndexManager } from "../../storage/knowledge/index";
import { generateSlug } from "../../utils/slug";
import { getISOStringWithOffset } from "../../utils/datetime";
import type { KnowledgeEntry } from "../../models/knowledge";

export function createSaveToKbTool(ctx: ToolContext) {
  return tool(
    "save_to_kb",
    "保存整理后的内容到用户的 Obsidian 知识库中。自动创建对应分类的目录结构并更新索引缓存。",
    {
      title: z.string().describe("文档标题"),
      content: z
        .string()
        .describe("整理后的 Markdown 正文（不包含 frontmatter 头部）"),
      tags: z.array(z.string()).default([]).describe("标签列表"),
      source: z.string().optional().describe("来源 URL"),
      category: z
        .enum(["inbox", "topics", "daily"])
        .default("inbox")
        .describe("一级分类目录"),
      sub_category: z
        .string()
        .optional()
        .describe(
          '二级子分类目录（当 category 为 topics 时有效，如 "frontend"、"backend"）',
        ),
      attachments: z
        .array(
          z.object({
            name: z.string().describe("附件文件名"),
            description: z.string().optional().describe("附件描述"),
            size: z.number().optional().describe("附件字节大小"),
            mime_type: z.string().optional().describe("MIME 类型"),
            ai_description: z
              .string()
              .optional()
              .describe("AI 对该附件内容的解读"),
          }),
        )
        .default([])
        .describe("关联的附件列表"),
    },
    async (args) => {
      const fileOps = new KnowledgeFileOps(ctx.kbRoot);
      const indexMgr = new IndexManager(ctx.kbRoot);

      const slug = generateSlug(args.title);
      const nowStr = getISOStringWithOffset();
      const dateStr = nowStr.split("T")[0];

      let entryId = "";
      const hasAttachments = args.attachments.length > 0;

      if (args.category === "daily") {
        // Daily notes are traditionally named by date
        entryId = `daily/${dateStr}.md`;
      } else {
        const folder =
          args.category === "topics"
            ? `topics/${args.sub_category || "general"}`
            : "inbox";
        entryId = hasAttachments
          ? `${folder}/${dateStr}-${slug}/index.md`
          : `${folder}/${dateStr}-${slug}.md`;
      }

      const entry: KnowledgeEntry = {
        id: entryId,
        title: args.title,
        source: args.source,
        captured_at: nowStr,
        tags: args.tags,
        type: args.category === "daily" ? "note" : "excerpt",
        attachments: args.attachments,
        content: args.content,
      };

      await fileOps.saveEntry(entry);
      await indexMgr.addEntry(entry);

      return {
        content: [
          {
            type: "text",
            text: `已成功保存条目 "${args.title}"。文件相对路径为: ${entryId}`,
          },
        ],
      };
    },
  );
}
