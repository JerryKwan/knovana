import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { join } from "node:path";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createReadAttachmentTool } from "../src/agent/tools/read-attachment";
import { createAttachmentManagerTool } from "../src/agent/tools/attachment-manager";
import { KnowledgeFileOps } from "../src/storage/knowledge/file-ops";
import { IndexManager } from "../src/storage/knowledge/index";
import { config } from "../src/config";

describe("Agent Tools - read_attachment & attachment_manager import", () => {
  const tempKbRoot = join(process.cwd(), ".tmp", "test-tools-kb");
  const ctx = { userId: "test_user", kbRoot: tempKbRoot };
  let fileOps: KnowledgeFileOps;
  let indexMgr: IndexManager;

  beforeAll(async () => {
    config.kbRoot = tempKbRoot;
    await mkdir(join(tempKbRoot, "attachments"), { recursive: true });
    fileOps = new KnowledgeFileOps(tempKbRoot);
    indexMgr = new IndexManager(tempKbRoot);
  });

  afterAll(async () => {
    await rm(tempKbRoot, { recursive: true, force: true });
  });

  describe("read_attachment tool", () => {
    const tool = createReadAttachmentTool(ctx);

    it("should read text files in attachments folder successfully", async () => {
      const filename = "test_note.txt";
      const fileContent = "Hello, world! This is a test file.";
      await writeFile(
        join(tempKbRoot, "attachments", filename),
        fileContent,
        "utf8",
      );

      const result = await (tool.handler as any)({ filename });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toBe(fileContent);
    });

    it("should return metadata for binary files", async () => {
      const filename = "image.png";
      const binaryData = Buffer.from([1, 2, 3, 4]);
      await writeFile(join(tempKbRoot, "attachments", filename), binaryData);

      const result = await (tool.handler as any)({ filename });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("该文件是二进制格式");
      expect(result.content[0].text).toContain("大小: 4 字节");
    });

    it("should return error for directory traversal", async () => {
      const result = await (tool.handler as any)({
        filename: "../config.json",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("错误: 非法的文件名");
    });

    it("should return error for non-existent files", async () => {
      const result = await (tool.handler as any)({
        filename: "does_not_exist.txt",
      });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("错误: 附件文件");
    });
  });

  describe("attachment_manager import action", () => {
    const tool = createAttachmentManagerTool(ctx);

    it("should import file from attachments to note assets and update note frontmatter", async () => {
      // 1. Create a markdown note
      const noteEntry = {
        id: "inbox/my-note.md",
        title: "My Note",
        captured_at: new Date().toISOString(),
        tags: [],
        type: "note" as const,
        content: "Note content here.",
      };
      await fileOps.saveEntry(noteEntry);
      await indexMgr.addEntry(noteEntry);

      // 2. Prepare uploaded attachment
      const srcFilename = "doc.txt";
      const attachmentContent = "Secret agent files.";
      await writeFile(
        join(tempKbRoot, "attachments", srcFilename),
        attachmentContent,
        "utf8",
      );

      // 3. Run tool action import
      const result = await (tool.handler as any)({
        action: "import",
        local_path: `attachments/${srcFilename}`,
        target_entry_id: "inbox/my-note.md",
        description: "Test local doc import",
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("成功导入并保存");

      // 4. Verify original .md is deleted and index.md folder-based note exists
      const oldNotePath = join(tempKbRoot, "inbox/my-note.md");
      expect(existsSync(oldNotePath)).toBe(false);

      const folderNotePath = join(tempKbRoot, "inbox/my-note/index.md");
      expect(existsSync(folderNotePath)).toBe(true);

      const assetPath = join(tempKbRoot, "inbox/my-note/assets", srcFilename);
      expect(existsSync(assetPath)).toBe(true);

      const readAsset = await readFile(assetPath, "utf8");
      expect(readAsset).toBe(attachmentContent);

      // 5. Read note and check frontmatter attachment metadata
      const entry = await fileOps.readEntry("inbox/my-note/index.md");
      expect(entry.attachments).toBeDefined();
      expect(entry.attachments!.length).toBe(1);
      expect(entry.attachments![0].name).toBe(srcFilename);
      expect(entry.attachments![0].description).toBe("Test local doc import");
      expect(entry.attachments![0].size).toBe(attachmentContent.length);
    });
  });
});
