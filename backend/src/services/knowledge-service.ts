import { join } from "node:path";
import { config } from "../config";
import { KnowledgeFileOps } from "../storage/knowledge/file-ops";
import { IndexManager } from "../storage/knowledge/index";
import type { KnowledgeEntry, KnowledgeListItem } from "../models/knowledge";

export class KnowledgeService {
  private readonly fileOps: KnowledgeFileOps;
  private readonly indexMgr: IndexManager;

  constructor(userId: string) {
    const userKbRoot = join(config.kbRoot, userId);
    this.fileOps = new KnowledgeFileOps(userKbRoot);
    this.indexMgr = new IndexManager(userKbRoot);
  }

  /**
   * Lists entries matching the tag/category filters.
   */
  async listEntries(filters?: {
    tags?: string[];
    category?: string;
    sortBy?: "created_at" | "updated_at" | "title";
  }): Promise<KnowledgeListItem[]> {
    return this.indexMgr.getEntries(filters);
  }

  /**
   * Retrieves a specific Markdown note by its relative ID.
   */
  async getEntry(entryId: string): Promise<KnowledgeEntry> {
    return this.fileOps.readEntry(entryId);
  }

  /**
   * Updates note details and syncs the index cache.
   */
  async updateEntry(
    entryId: string,
    updates: Partial<KnowledgeEntry>,
  ): Promise<KnowledgeEntry> {
    const oldEntry = await this.fileOps.readEntry(entryId);
    const updatedEntry: KnowledgeEntry = {
      ...oldEntry,
      ...updates,
      id: oldEntry.id, // Keeps old ID (if renaming is required, use update_kb tool)
      updated_at: new Date().toISOString(),
    };

    await this.fileOps.saveEntry(updatedEntry);
    await this.indexMgr.updateEntry(entryId, updatedEntry);
    return updatedEntry;
  }

  /**
   * Deletes a note and removes it from the index cache.
   */
  async deleteEntry(entryId: string): Promise<void> {
    await this.fileOps.deleteEntry(entryId);
    await this.indexMgr.removeEntry(entryId);
  }

  /**
   * Returns all tags and counts.
   */
  async getTags(): Promise<{ name: string; count: number }[]> {
    return this.indexMgr.getTags();
  }

  /**
   * Returns storage stats.
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
    return this.indexMgr.getStats();
  }

  /**
   * Triggers a manual full scan and index rebuild.
   */
  async rebuildIndex(): Promise<void> {
    await this.indexMgr.rebuildIndex();
  }
}
