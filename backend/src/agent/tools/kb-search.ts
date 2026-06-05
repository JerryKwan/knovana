import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { ToolContext } from "./index";
import { IndexManager } from "../../storage/knowledge/index";
import { KnowledgeFileOps } from "../../storage/knowledge/file-ops";

export function createSearchKbTool(ctx: ToolContext) {
  return tool(
    "search_kb",
    "在用户的知识库中执行全文搜索，检索标题、标签和文档正文。",
    {
      query: z
        .string()
        .describe('检索关键词（如 "react components" 或 "设计模式"）'),
    },
    async (args) => {
      const indexMgr = new IndexManager(ctx.kbRoot);
      const fileOps = new KnowledgeFileOps(ctx.kbRoot);

      try {
        const indexData = await indexMgr.loadIndex();
        const lowerQuery = args.query.toLowerCase().trim();

        if (!lowerQuery) {
          return {
            content: [{ type: "text", text: "搜索查询为空。" }],
          };
        }

        const results: Array<{
          id: string;
          title: string;
          tags: string[];
          type: string;
          created_at: string;
          score: number;
        }> = [];

        for (const entry of indexData.entries) {
          let score = 0;

          // Score title match
          if (entry.title.toLowerCase().includes(lowerQuery)) {
            score += 10;
          }

          // Score tag match
          if (
            entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
          ) {
            score += 5;
          }

          // Score content match
          try {
            const fileEntry = await fileOps.readEntry(entry.id);
            const contentLower = fileEntry.content.toLowerCase();

            if (contentLower.includes(lowerQuery)) {
              score += 2;

              // Add weight for multiple occurrences
              const escapedQuery = lowerQuery.replace(
                /[-/\\^$*+?.()|[\]{}]/g,
                "\\$&",
              );
              const regex = new RegExp(escapedQuery, "g");
              const occurrences = (contentLower.match(regex) || []).length;
              score += Math.min(occurrences, 5);
            }
          } catch (err) {
            // Ignore file read errors for indexing
          }

          if (score > 0) {
            results.push({
              id: entry.id,
              title: entry.title,
              tags: entry.tags,
              type: entry.type,
              created_at: entry.created_at,
              score,
            });
          }
        }

        // Sort by score desc, then by date desc
        results.sort(
          (a, b) =>
            b.score - a.score ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        const outputList = results
          .slice(0, 15)
          .map(
            (r) =>
              `- [${r.title}](${r.id}) (Relevance: ${r.score}) - Tags: [${r.tags.join(", ")}]`,
          );

        const summary =
          results.length > 0
            ? `共找到 ${results.length} 条匹配结果（展示前 15 条）：\n\n${outputList.join("\n")}`
            : "未能在知识库中检索到匹配内容。";

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
              text: `搜索出错: ${err.message}`,
            },
          ],
        };
      }
    },
  );
}
