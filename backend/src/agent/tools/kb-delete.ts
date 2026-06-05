import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { ToolContext } from "./index";
import { KnowledgeFileOps } from "../../storage/knowledge/file-ops";
import { IndexManager } from "../../storage/knowledge/index";

export function createDeleteKbTool(ctx: ToolContext) {
  return tool(
    "delete_kb",
    "从用户的知识库中物理删除指定的知识条目（包含关联文件夹及附件）并同步更新索引缓存。",
    {
      entry_id: z
        .string()
        .describe('条目相对路径（如 "inbox/2024-12-01-react-patterns.md"）'),
    },
    async (args) => {
      const fileOps = new KnowledgeFileOps(ctx.kbRoot);
      const indexMgr = new IndexManager(ctx.kbRoot);

      try {
        await fileOps.deleteEntry(args.entry_id);
        await indexMgr.removeEntry(args.entry_id);
        return {
          content: [
            {
              type: "text",
              text: `成功删除知识条目 "${args.entry_id}"。`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `删除条目 "${args.entry_id}" 失败。原因: ${err.message}`,
            },
          ],
        };
      }
    },
  );
}
