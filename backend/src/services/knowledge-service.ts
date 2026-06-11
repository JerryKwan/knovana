import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { config } from "../config";
import { KnowledgeFileOps } from "../storage/knowledge/file-ops";
import { IndexManager } from "../storage/knowledge/index";
import { moveFileUnique, extractAttachmentFilename } from "../utils/filename";
import type { KnowledgeEntry, KnowledgeListItem } from "../models/knowledge";

export class KnowledgeService {
  private readonly fileOps: KnowledgeFileOps;
  private readonly indexMgr: IndexManager;
  private readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
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
    let oldEntry: KnowledgeEntry;
    try {
      oldEntry = await this.fileOps.readEntry(entryId);
    } catch (err: any) {
      // If note doesn't exist, initialize a new blank entry (supports PUT-to-create)
      oldEntry = {
        id: entryId,
        title: updates.title || "Untitled",
        content: updates.content || "",
        tags: updates.tags || [],
        captured_at: new Date().toISOString(),
        type: "note",
        attachments: [],
      };
    }

    // Process attachments migration from global attachments folder to note assets folder
    let entryContent =
      updates.content !== undefined ? updates.content : oldEntry.content;
    let finalAttachments =
      updates.attachments !== undefined
        ? updates.attachments
        : oldEntry.attachments || [];

    if (finalAttachments.length > 0) {
      const targetFilePath = this.fileOps.resolveEntryPath(entryId);
      const assetsDir = join(dirname(targetFilePath), "assets");
      const globalAttachmentsDir = join(
        config.kbRoot,
        this.userId,
        "attachments",
      );

      const processedAttachments: typeof finalAttachments = [];
      let assetsDirCreated = false;

      for (const att of finalAttachments) {
        const sourceFilename =
          extractAttachmentFilename(`attachments/${att.name}`) || att.name;
        const sourcePath = join(globalAttachmentsDir, sourceFilename);

        if (existsSync(sourcePath)) {
          if (!assetsDirCreated) {
            await mkdir(assetsDir, { recursive: true });
            assetsDirCreated = true;
          }

          const moved = await moveFileUnique(
            sourcePath,
            assetsDir,
            sourceFilename,
          );
          const finalName = moved.filename;

          // Replace attachment reference in Markdown text
          const finalAssetRef = `assets/${finalName}`;
          const refs = new Set([
            `attachments/${att.name}`,
            `attachments/${sourceFilename}`,
            `attachments/${encodeURIComponent(att.name)}`,
            `attachments/${encodeURIComponent(sourceFilename)}`,
          ]);
          for (const ref of refs) {
            entryContent = entryContent.replaceAll(ref, finalAssetRef);
          }

          processedAttachments.push({
            ...att,
            name: finalName,
          });
        } else {
          // If the file is already migrated or doesn't exist in global attachments, keep it as is
          processedAttachments.push(att);
        }
      }
      finalAttachments = processedAttachments;
    }

    const updatedEntry: KnowledgeEntry = {
      ...oldEntry,
      ...updates,
      id: oldEntry.id, // Keeps old ID (if renaming is required, use update_kb tool)
      content: entryContent,
      attachments: finalAttachments,
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
