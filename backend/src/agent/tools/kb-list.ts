import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { ToolContext } from "./index";
import { IndexManager } from "../../storage/knowledge/index";

export function createListKbTool(ctx: ToolContext) {
  return tool(
    "list_kb",
    "列出指定分类或标签条件过滤下的知识库条目摘要列表。",
    {
      category: z
        .enum(["inbox", "topics", "daily"])
        .optional()
        .describe("过滤的一级分类"),
      tags: z
        .array(z.string())
        .optional()
        .describe("要筛选的标签（匹配包含全部指定标签的文档）"),
    },
    async (args) => {
      const indexMgr = new IndexManager(ctx.kbRoot);
      try {
        const items = await indexMgr.getEntries({
          category: args.category,
          tags: args.tags,
        });

        const listString = items
          .map(
            (item) =>
              `- [${item.title}](${item.id}) [分类: ${item.id.split("/")[0]}, 标签: ${item.tags.join(", ")}]`,
          )
          .join("\n");

        const summary =
          items.length > 0
            ? `共检索到 ${items.length} 个匹配条目:\n\n${listString}`
            : "未检索到符合条件的知识条目。";

        return {
          content: [
            {
              type: "text",
              text: summary,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `列出失败: ${err.message}`,
            },
          ],
        };
      }
    },
  );
}
