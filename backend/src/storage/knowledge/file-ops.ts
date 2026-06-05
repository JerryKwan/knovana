import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { generateFrontmatter, parseFrontmatter } from "./frontmatter";
import type {
  KnowledgeEntry,
  KnowledgeAttachment,
} from "../../models/knowledge";

export class KnowledgeFileOps {
  constructor(private readonly root: string) {}

  /**
   * Saves a knowledge entry to the filesystem.
   * If it has attachments, it ensures it is saved as `.../{slug}/index.md`
   * and creates an `assets` subdirectory.
   * Returns the relative path (entryId) within the user's KB root.
   */
  async saveEntry(entry: KnowledgeEntry): Promise<string> {
    const filePath = join(this.root, entry.id);

    // Ensure the folder exists
    await mkdir(dirname(filePath), { recursive: true });

    // If attachments exist, create the assets folder
    if (entry.attachments && entry.attachments.length > 0) {
      const assetsDir = join(dirname(filePath), "assets");
      await mkdir(assetsDir, { recursive: true });
    }

    const frontmatter = generateFrontmatter(entry);
    const fileContent = `${frontmatter}\n\n${entry.content}`;

    await writeFile(filePath, fileContent, "utf8");

    return entry.id;
  }

  /**
   * Reads a knowledge entry from the filesystem.
   */
  async readEntry(entryId: string): Promise<KnowledgeEntry> {
    const filePath = this.resolveEntryPath(entryId);
    const text = await readFile(filePath, "utf8");
    const { data, content } = parseFrontmatter(text);

    // Map parsed frontmatter to entry fields
    const attachments: KnowledgeAttachment[] = data.attachments || [];
    const tags: string[] = data.tags || [];

    return {
      id: relative(this.root, filePath).replace(/\\/g, "/"), // Normalized slash
      title: data.title || "Untitled",
      source: data.source,
      captured_at: data.captured_at || new Date().toISOString(),
      updated_at: data.updated_at,
      tags,
      type: data.type || "note",
      language: data.language,
      attachments,
      ai_generated: data.ai_generated,
      content,
    };
  }

  /**
   * Deletes a knowledge entry.
   * If the entry is folder-based (ends with index.md), it removes the entire folder (including attachments).
   * Otherwise, it deletes the single Markdown file.
   */
  async deleteEntry(entryId: string): Promise<void> {
    const filePath = this.resolveEntryPath(entryId);

    if (filePath.endsWith("index.md")) {
      const parentDir = dirname(filePath);
      await rm(parentDir, { recursive: true, force: true });
    } else {
      await rm(filePath, { force: true });
    }
  }

  /**
   * Helper to resolve the physical path from an entry ID.
   */
  public resolveEntryPath(entryId: string): string {
    // If it's already an absolute path, return it (used in testing or edge cases)
    if (entryId.startsWith(this.root)) {
      return entryId;
    }

    return join(this.root, entryId);
  }
}
