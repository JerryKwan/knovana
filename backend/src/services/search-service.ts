import { randomUUID } from "node:crypto";
import { IndexManager } from "../storage/knowledge/index";
import { KnowledgeFileOps } from "../storage/knowledge/file-ops";
import { KnovanaAgent } from "../agent/client";
import { SEARCH_SYSTEM_PROMPT } from "../agent/prompts/search";

export class SearchService {
  private readonly indexMgr: IndexManager;
  private readonly fileOps: KnowledgeFileOps;

  constructor(
    private readonly userId: string,
    private readonly kbRoot: string,
  ) {
    this.indexMgr = new IndexManager(this.kbRoot);
    this.fileOps = new KnowledgeFileOps(this.kbRoot);
  }

  /**
   * Performs a rapid, index-based full text search, calculating relevance scores and extracting snippets.
   */
  async quickSearch(
    query: string,
    maxResults = 20,
  ): Promise<
    Array<{
      id: string;
      title: string;
      tags: string[];
      source_url?: string;
      snippet: string;
      relevance: "high" | "medium" | "low";
    }>
  > {
    const indexData = await this.indexMgr.loadIndex();
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return [];
    }

    const results: Array<{
      id: string;
      title: string;
      tags: string[];
      source_url?: string;
      snippet: string;
      relevance: "high" | "medium" | "low";
      score: number;
    }> = [];

    for (const entry of indexData.entries) {
      let score = 0;

      // 1. Title match (highest weight)
      if (entry.title.toLowerCase().includes(lowerQuery)) {
        score += 10;
      }

      // 2. Tag match (medium weight)
      if (entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
        score += 5;
      }

      let snippet = entry.summary;

      // 3. Body text match
      try {
        const fileEntry = await this.fileOps.readEntry(entry.id);
        const contentLower = fileEntry.content.toLowerCase();

        if (contentLower.includes(lowerQuery)) {
          score += 2;

          // Generate a context-rich snippet around the match
          const index = contentLower.indexOf(lowerQuery);
          const start = Math.max(0, index - 60);
          const end = Math.min(
            fileEntry.content.length,
            index + lowerQuery.length + 60,
          );
          snippet =
            "..." +
            fileEntry.content.slice(start, end).replace(/\s+/g, " ").trim() +
            "...";
        }
      } catch (err) {
        // Fallback to entry.summary if file read fails
      }

      if (score > 0) {
        results.push({
          id: entry.id,
          title: entry.title,
          tags: entry.tags,
          source_url: entry.source_url,
          snippet,
          relevance: score >= 10 ? "high" : score >= 5 ? "medium" : "low",
          score,
        });
      }
    }

    // Sort by calculated score desc
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, maxResults);
  }

  /**
   * Runs the Agent loop to review notes and synthesize an answer to the search query.
   */
  async smartSearch(queryText: string): Promise<string> {
    const agent = new KnovanaAgent(this.userId, this.kbRoot);
    const tempSessionId = `search_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    return agent.process(
      `在知识库中搜索并汇总与以下问题相关的知识: ${queryText}`,
      SEARCH_SYSTEM_PROMPT,
      tempSessionId,
    );
  }
}
