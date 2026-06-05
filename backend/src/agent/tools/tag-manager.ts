import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { ToolContext } from "./index";
import { IndexManager } from "../../storage/knowledge/index";
import { KnowledgeFileOps } from "../../storage/knowledge/file-ops";

export function createTagManagerTool(ctx: ToolContext) {
  return tool(
    "tag_manager",
    "管理标签库。支持列出所有标签及出现的计数，或者全局重命名某个标签（将修改所有相关的物理 Markdown 文件并更新索引缓存）。",
    {
      action: z
        .enum(["list", "rename"])
        .describe("执行的动作: list (列出所有标签) 或 rename (重命名标签)"),
      old_tag: z.string().optional().describe("旧标签名（rename 动作时必填）"),
      new_tag: z.string().optional().describe("新标签名（rename 动作时必填）"),
    },
    async (args) => {
      const indexMgr = new IndexManager(ctx.kbRoot);
      const fileOps = new KnowledgeFileOps(ctx.kbRoot);

      try {
        if (args.action === "list") {
          const tags = await indexMgr.getTags();
          const listStr = tags
            .map((t) => `- #${t.name} (${t.count})`)
            .join("\n");
          const output =
            tags.length > 0
              ? `所有标签列表:\n\n${listStr}`
              : "目前知识库中没有任何标签。";

          return {
            content: [{ type: "text", text: output }],
          };
        } else {
          // rename action
          if (!args.old_tag || !args.new_tag) {
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: "错误: 执行重命名动作时，必须提供 old_tag 和 new_tag。",
                },
              ],
            };
          }

          const indexData = await indexMgr.loadIndex();
          let count = 0;

          for (const entry of indexData.entries) {
            if (entry.tags.includes(args.old_tag)) {
              try {
                // Read physical file
                const fileEntry = await fileOps.readEntry(entry.id);

                // Replace tag
                fileEntry.tags =
                  fileEntry.tags?.map((t) =>
                    t === args.old_tag ? args.new_tag! : t,
                  ) || [];

                // Save physical file
                await fileOps.saveEntry(fileEntry);

                // Update index cache
                await indexMgr.addEntry(fileEntry);

                count++;
              } catch (err) {
                console.error(`Failed to rename tag in file ${entry.id}:`, err);
              }
            }
          }

          return {
            content: [
              {
                type: "text",
                text: `成功将标签 #${args.old_tag} 重命名为 #${args.new_tag}。共修改了 ${count} 篇文档。`,
              },
            ],
          };
        }
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `操作失败: ${err.message}`,
            },
          ],
        };
      }
    },
  );
}
