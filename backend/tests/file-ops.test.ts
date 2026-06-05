import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { join } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { KnowledgeFileOps } from "../src/storage/knowledge/file-ops";
import { IndexManager } from "../src/storage/knowledge/index";
import { config } from "../src/config";

describe("Obsidian File Operations and Indexing", () => {
  const tempKbRoot = join(process.cwd(), ".tmp", "test-kb");
  let fileOps: KnowledgeFileOps;
  let indexMgr: IndexManager;

  beforeAll(async () => {
    config.kbRoot = tempKbRoot;
    await mkdir(tempKbRoot, { recursive: true });
    fileOps = new KnowledgeFileOps(tempKbRoot);
    indexMgr = new IndexManager(tempKbRoot);
  });

  afterAll(async () => {
    await rm(tempKbRoot, { recursive: true, force: true });
  });

  it("performs CRUD operations on simple Markdown notes and synchronizes index caches", async () => {
    const entry = {
      id: "inbox/2026-06-04-test-note.md",
      title: "Test Note",
      source: "http://example.com",
      captured_at: "2026-06-04T10:00:00+08:00",
      tags: ["test", "hono"],
      type: "note" as const,
      content: "This is body content.",
    };

    // 1. Save entry
    await fileOps.saveEntry(entry);
    await indexMgr.addEntry(entry);

    const physicalPath = fileOps.resolveEntryPath(entry.id);
    expect(existsSync(physicalPath)).toBe(true);

    // 2. Read entry back
    const read = await fileOps.readEntry(entry.id);
    expect(read.title).toBe(entry.title);
    expect(read.content).toBe(entry.content);
    expect(read.tags).toEqual(entry.tags);
    expect(read.source).toBe(entry.source);

    // 3. Verify index and tag summaries
    const list = await indexMgr.getEntries();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe("Test Note");
    expect(list[0].summary).toBe("This is body content.");

    const stats = await indexMgr.getStats();
    expect(stats.total_entries).toBe(1);
    expect(stats.categories.inbox).toBe(1);

    const tags = await indexMgr.getTags();
    expect(tags.some((t) => t.name === "test")).toBe(true);
    expect(tags.find((t) => t.name === "test")?.count).toBe(1);

    // 4. Update entry content
    entry.content = "Updated body content.";
    await fileOps.saveEntry(entry);
    await indexMgr.addEntry(entry);

    const readUpdated = await fileOps.readEntry(entry.id);
    expect(readUpdated.content).toBe("Updated body content.");

    // 5. Delete entry and verify index cleanup
    await fileOps.deleteEntry(entry.id);
    await indexMgr.removeEntry(entry.id);
    expect(existsSync(physicalPath)).toBe(false);

    const listEmpty = await indexMgr.getEntries();
    expect(listEmpty.length).toBe(0);

    const statsEmpty = await indexMgr.getStats();
    expect(statsEmpty.total_entries).toBe(0);
  });
});
