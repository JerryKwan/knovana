import { existsSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { config } from "../config";
import { KnowledgeFileOps } from "../storage/knowledge/file-ops";
import { IndexManager } from "../storage/knowledge/index";
import { moveFileUnique, extractAttachmentFilename } from "../utils/filename";
import { generateSlug } from "../utils/slug";
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
    updates: Partial<KnowledgeEntry> & { category?: string; storage_name?: string },
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

    // Compute new ID based on category and title changes
    let targetCategory = "inbox";
    if (updates.category !== undefined) {
      targetCategory = updates.category;
    } else {
      if (oldEntry.id.startsWith("daily/")) {
        targetCategory = "daily";
      } else if (oldEntry.id.startsWith("topics/")) {
        const parts = oldEntry.id.split("/");
        targetCategory = parts.length >= 3 ? `topics/${parts[1]}` : "topics";
      } else {
        targetCategory = "inbox";
      }
    }

    // Helper to get storage name from entry ID
    const getStorageName = (idStr: string): string => {
      const parts = idStr.split("/");
      const lastPart = parts.pop() || "";
      if (lastPart === "index.md") {
        return parts.pop() || "";
      } else {
        return lastPart.replace(/\.md$/, "");
      }
    };

    const oldStorageName = getStorageName(oldEntry.id);
    let finalStorageName = oldStorageName;
    if (updates.storage_name !== undefined && updates.storage_name.trim() !== "") {
      finalStorageName = generateSlug(updates.storage_name);
    }

    const finalAttachments = updates.attachments !== undefined ? updates.attachments : oldEntry.attachments || [];
    const hasAttachments = finalAttachments.length > 0;

    let newEntryId = "";
    if (targetCategory === "daily") {
      newEntryId = hasAttachments ? `daily/${finalStorageName}/index.md` : `daily/${finalStorageName}.md`;
    } else {
      newEntryId = hasAttachments
        ? `${targetCategory}/${finalStorageName}/index.md`
        : `${targetCategory}/${finalStorageName}.md`;
    }

    const oldPath = this.fileOps.resolveEntryPath(oldEntry.id);
    const newPath = this.fileOps.resolveEntryPath(newEntryId);

    if (newPath !== oldPath && existsSync(newPath)) {
      throw new Error(`目标路径已存在，请更换标题或分类: ${newEntryId}`);
    }

    if (newEntryId !== oldEntry.id) {
      await this.safeMoveEntry(oldPath, newPath);
      // Remove old entry from index cache
      await this.indexMgr.removeEntry(oldEntry.id);
    }

    // Process attachments migration from global attachments folder to note assets folder
    let entryContent =
      updates.content !== undefined ? updates.content : oldEntry.content;
    let processedAttachments = [...finalAttachments];

    if (processedAttachments.length > 0) {
      const assetsDir = join(dirname(newPath), "assets");
      const globalAttachmentsDir = join(
        config.kbRoot,
        this.userId,
        "attachments",
      );

      const finalProcessed: typeof processedAttachments = [];
      let assetsDirCreated = false;

      for (const att of processedAttachments) {
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

          finalProcessed.push({
            ...att,
            name: finalName,
          });
        } else {
          // If the file is already migrated or doesn't exist in global attachments, keep it as is
          finalProcessed.push(att);
        }
      }
      processedAttachments = finalProcessed;
    }

    const updatedEntry: KnowledgeEntry = {
      ...oldEntry,
      ...updates,
      id: newEntryId,
      content: entryContent,
      attachments: processedAttachments,
      updated_at: new Date().toISOString(),
    };

    await this.fileOps.saveEntry(updatedEntry);
    await this.indexMgr.updateEntry(newEntryId, updatedEntry);
    return updatedEntry;
  }

  private async safeMoveEntry(oldPath: string, newPath: string): Promise<void> {
    if (oldPath === newPath) return;
    if (!existsSync(oldPath)) return;

    const oldIsFolder = oldPath.endsWith("index.md");
    const newIsFolder = newPath.endsWith("index.md");

    if (oldIsFolder && newIsFolder) {
      const oldDir = dirname(oldPath);
      const newDir = dirname(newPath);
      await mkdir(dirname(newDir), { recursive: true });
      await rename(oldDir, newDir);
    } else if (!oldIsFolder && !newIsFolder) {
      await mkdir(dirname(newPath), { recursive: true });
      await rename(oldPath, newPath);
    } else if (!oldIsFolder && newIsFolder) {
      // File to Folder
      const newDir = dirname(newPath);
      await mkdir(newDir, { recursive: true });
      await rename(oldPath, newPath);
    } else if (oldIsFolder && !newIsFolder) {
      // Folder to File
      await mkdir(dirname(newPath), { recursive: true });
      await rename(oldPath, newPath);
      // Delete old parent folder
      await rm(dirname(oldPath), { recursive: true, force: true });
    }
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
