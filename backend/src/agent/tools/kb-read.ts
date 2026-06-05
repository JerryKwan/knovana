import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { ToolContext } from "./index";
import { KnowledgeFileOps } from "../../storage/knowledge/file-ops";

export function createReadKbTool(ctx: ToolContext) {
  return tool(
    "read_kb",
    "读取特定知识条目的完整详细信息（包括 YAML 元数据和 Markdown 正文）。",
    {
      entry_id: z
        .string()
        .describe(
          '条目相对路径（如 "inbox/2024-12-01-react-patterns.md" 或 "daily/2024-12-01.md"）',
        ),
    },
    async (args) => {
      const fileOps = new KnowledgeFileOps(ctx.kbRoot);
      try {
        const entry = await fileOps.readEntry(args.entry_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(entry, null, 2),
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `读取失败: 找不到文件 "${args.entry_id}" 或读取出错。具体原因: ${err.message}`,
            },
          ],
        };
      }
    },
  );
}
