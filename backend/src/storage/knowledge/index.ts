import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { existsSync } from "node:fs";
import type { KnowledgeEntry, KnowledgeListItem } from "../../models/knowledge";
import { parseFrontmatter } from "./frontmatter";
import { getISOStringWithOffset } from "../../utils/datetime";

export interface IndexCache {
  entries: {
    id: string; // Relative path, e.g., 'inbox/note.md'
    title: string;
    tags: string[];
    type: string;
    has_attachments: boolean;
    attachment_count: number;
    created_at: string;
    updated_at: string;
    source_url?: string;
    summary: string;
  }[];
  total: number;
  updated_at: string;
}

export interface TagsCache {
  tags: Record<string, { count: number; entries: string[] }>;
  updated_at: string;
}

export class IndexManager {
  private readonly indexFile: string;
  private readonly tagsFile: string;

  constructor(private readonly root: string) {
    this.indexFile = join(this.root, ".knovana", "index.json");
    this.tagsFile = join(this.root, ".knovana", "tags.json");
  }

  /**
   * Loads the index cache, creating it if it doesn't exist.
   */
  async loadIndex(): Promise<IndexCache> {
    if (!existsSync(this.indexFile)) {
      await this.saveIndex({
        entries: [],
        total: 0,
        updated_at: getISOStringWithOffset(),
      });
    }
    const content = await readFile(this.indexFile, "utf8");
    return JSON.parse(content) as IndexCache;
  }

  /**
   * Loads the tags cache, creating it if it doesn't exist.
   */
  async loadTags(): Promise<TagsCache> {
    if (!existsSync(this.tagsFile)) {
      await this.saveTags({ tags: {}, updated_at: getISOStringWithOffset() });
    }
    const content = await readFile(this.tagsFile, "utf8");
    return JSON.parse(content) as TagsCache;
  }

  async saveIndex(data: IndexCache): Promise<void> {
    await mkdir(dirname(this.indexFile), { recursive: true });
    await writeFile(this.indexFile, JSON.stringify(data, null, 2), "utf8");
  }

  async saveTags(data: TagsCache): Promise<void> {
    await mkdir(dirname(this.tagsFile), { recursive: true });
    await writeFile(this.tagsFile, JSON.stringify(data, null, 2), "utf8");
  }

  /**
   * Adds an entry to the index.
   */
  async addEntry(entry: KnowledgeEntry): Promise<void> {
    const indexData = await this.loadIndex();
    const tagsData = await this.loadTags();

    const summary = this.generateSummary(entry.content);
    const hasAttachments = !!(
      entry.attachments && entry.attachments.length > 0
    );
    const attachmentCount = entry.attachments ? entry.attachments.length : 0;

    // Remove existing if any (prevent duplicates)
    indexData.entries = indexData.entries.filter((e) => e.id !== entry.id);

    // Append new entry
    indexData.entries.push({
      id: entry.id,
      title: entry.title,
      tags: entry.tags || [],
      type: entry.type,
      has_attachments: hasAttachments,
      attachment_count: attachmentCount,
      created_at: entry.captured_at,
      updated_at: entry.updated_at || entry.captured_at,
      source_url: entry.source,
      summary,
    });

    indexData.total = indexData.entries.length;
    indexData.updated_at = getISOStringWithOffset();

    await this.saveIndex(indexData);
    await this.rebuildTagsCacheFromIndex(indexData, tagsData);
  }

  /**
   * Updates an entry in the index.
   */
  async updateEntry(entryId: string, entry: KnowledgeEntry): Promise<void> {
    await this.addEntry(entry); // addEntry overwrites if key matches
  }

  /**
   * Removes an entry from the index.
   */
  async removeEntry(entryId: string): Promise<void> {
    const indexData = await this.loadIndex();
    const tagsData = await this.loadTags();

    indexData.entries = indexData.entries.filter((e) => e.id !== entryId);
    indexData.total = indexData.entries.length;
    indexData.updated_at = getISOStringWithOffset();

    await this.saveIndex(indexData);
    await this.rebuildTagsCacheFromIndex(indexData, tagsData);
  }

  /**
   * Fetches lists of entries with sorting and filters.
   */
  async getEntries(
    filters: {
      tags?: string[];
      category?: string;
      sortBy?: "created_at" | "updated_at" | "title";
    } = {},
  ): Promise<KnowledgeListItem[]> {
    const indexData = await this.loadIndex();
    let entries = [...indexData.entries];

    // Filter by category (e.g. 'inbox', 'topics/frontend')
    if (filters.category) {
      const categoryPrefix = filters.category.endsWith("/")
        ? filters.category
        : `${filters.category}/`;
      entries = entries.filter(
        (e) => e.id.startsWith(categoryPrefix) || e.id === filters.category,
      );
    }

    // Filter by tags (match all tags specified)
    if (filters.tags && filters.tags.length > 0) {
      entries = entries.filter((e) =>
        filters.tags!.every((tag) => e.tags.includes(tag)),
      );
    }

    // Sort entries
    const sortBy = filters.sortBy || "created_at";
    entries.sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      const valA = sortBy === "updated_at" ? a.updated_at : a.created_at;
      const valB = sortBy === "updated_at" ? b.updated_at : b.created_at;
      return new Date(valB).getTime() - new Date(valA).getTime(); // Descending by default
    });

    return entries as KnowledgeListItem[];
  }

  /**
   * Retrieves tag counts list.
   */
  async getTags(): Promise<{ name: string; count: number }[]> {
    const tagsData = await this.loadTags();
    return Object.entries(tagsData.tags)
      .map(([name, val]) => ({ name, count: val.count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  /**
   * Retrieves stats.
   */
  async getStats(): Promise<{
    total_entries: number;
    total_tags: number;
    total_sources: number;
    total_attachments: number;
    entries_this_week: number;
    categories: {
      inbox: number;
      topics: number;
      daily: number;
    };
  }> {
    const indexData = await this.loadIndex();
    const tagsData = await this.loadTags();

    const categories = { inbox: 0, topics: 0, daily: 0 };
    let totalAttachments = 0;
    const sourcesSet = new Set<string>();

    for (const entry of indexData.entries) {
      totalAttachments += entry.attachment_count;
      if (entry.source_url) {
        sourcesSet.add(new URL(entry.source_url).hostname || entry.source_url);
      }

      const topFolder = entry.id.split("/")[0];
      if (topFolder && topFolder in categories) {
        categories[topFolder as keyof typeof categories]++;
      }
    }

    // Calculate entries created this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const entriesThisWeek = indexData.entries.filter(
      (e) => new Date(e.created_at).getTime() >= oneWeekAgo.getTime(),
    ).length;

    return {
      total_entries: indexData.total,
      total_tags: Object.keys(tagsData.tags).length,
      total_sources: sourcesSet.size,
      total_attachments: totalAttachments,
      entries_this_week: entriesThisWeek,
      categories,
    };
  }

  /**
   * Scans filesystem and fully rebuilds the index.
   */
  async rebuildIndex(): Promise<void> {
    const entriesList: IndexCache["entries"] = [];
    const mdFiles = await this.findMdFiles(this.root);

    for (const filePath of mdFiles) {
      try {
        const text = await readFile(filePath, "utf8");
        const relativePath = relative(this.root, filePath).replace(/\\/g, "/");
        const { data, content } = parseFrontmatter(text);

        const attachments = data.attachments || [];
        const hasAttachments = attachments.length > 0;
        const attachmentCount = attachments.length;

        entriesList.push({
          id: relativePath,
          title: data.title || "Untitled",
          tags: data.tags || [],
          type: data.type || "note",
          has_attachments: hasAttachments,
          attachment_count: attachmentCount,
          created_at: data.captured_at || getISOStringWithOffset(),
          updated_at:
            data.updated_at || data.captured_at || getISOStringWithOffset(),
          source_url: data.source,
          summary: this.generateSummary(content),
        });
      } catch (err) {
        console.error(`Failed to index file ${filePath}:`, err);
      }
    }

    const indexData: IndexCache = {
      entries: entriesList,
      total: entriesList.length,
      updated_at: getISOStringWithOffset(),
    };

    const tagsData: TagsCache = {
      tags: {},
      updated_at: getISOStringWithOffset(),
    };

    await this.saveIndex(indexData);
    await this.rebuildTagsCacheFromIndex(indexData, tagsData);
  }

  /**
   * Helper to recursively scan folders for .md files.
   */
  private async findMdFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    try {
      const list = await readdir(dir, { withFileTypes: true });
      for (const file of list) {
        // Skip index/system files
        if (
          file.name === ".knovana" ||
          file.name === "node_modules" ||
          file.name === ".git"
        ) {
          continue;
        }

        const res = join(dir, file.name);
        if (file.isDirectory()) {
          results.push(...(await this.findMdFiles(res)));
        } else if (file.name.endsWith(".md")) {
          results.push(res);
        }
      }
    } catch (err) {
      // Ignore directory read errors
    }
    return results;
  }

  /**
   * Generates a short summary from Markdown body text.
   */
  private generateSummary(content: string, limit = 200): string {
    return content
      .replace(/[#*`>_\-[\]]/g, "") // Strip markdown formatting
      .replace(/\s+/g, " ") // Strip extra spacing
      .trim()
      .slice(0, limit);
  }

  /**
   * Updates tags cache map based on the active index structure.
   */
  private async rebuildTagsCacheFromIndex(
    indexData: IndexCache,
    tagsData: TagsCache,
  ): Promise<void> {
    const tagsMap: Record<string, { count: number; entries: string[] }> = {};

    for (const entry of indexData.entries) {
      for (const tag of entry.tags) {
        if (!tagsMap[tag]) {
          tagsMap[tag] = { count: 0, entries: [] };
        }
        tagsMap[tag].count++;
        if (!tagsMap[tag].entries.includes(entry.id)) {
          tagsMap[tag].entries.push(entry.id);
        }
      }
    }

    tagsData.tags = tagsMap;
    tagsData.updated_at = getISOStringWithOffset();

    await this.saveTags(tagsData);
  }
}
