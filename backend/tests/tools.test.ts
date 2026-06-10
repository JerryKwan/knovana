import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { dirname, join } from "node:path";
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createReadAttachmentTool } from "../src/agent/tools/read-attachment";
import { createAttachmentManagerTool } from "../src/agent/tools/attachment-manager";
import { createSaveToKbTool } from "../src/agent/tools/kb-save";
import {
  clearPendingKnowledgeAttachments,
  setPendingKnowledgeAttachments,
} from "../src/agent/tools/pending-attachments";
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

    it("should truncate oversized text previews", async () => {
      const filename = "large_note.md";
      const fileContent = "A".repeat(12_050);
      await writeFile(
        join(tempKbRoot, "attachments", filename),
        fileContent,
        "utf8",
      );

      const result = await (tool.handler as any)({ filename });
      const text = result.content[0].text as string;
      expect(result.isError).toBeUndefined();
      expect(text).not.toBe(fileContent);
      expect(text.startsWith("A".repeat(100))).toBe(true);
      expect(text).toContain("内容已截断");
      expect(text).toContain("原附件仍完整保存");
    });

    it("should parse document attachments with a fixed first-three-pages preview", async () => {
      const filename = "report.pdf";
      const filePath = join(tempKbRoot, "attachments", filename);
      const calls: Array<{
        command: string;
        args: string[];
        options: { timeoutMs: number; maxBufferBytes: number };
      }> = [];
      const docTool = createReadAttachmentTool(ctx, {
        commandRunner: async (command, args, options) => {
          calls.push({ command, args, options });
          return { stdout: "第一页内容\n第二页内容", stderr: "" };
        },
      });
      await writeFile(filePath, Buffer.from("%PDF-1.7"));

      const result = await (docTool.handler as any)({ filename });
      const text = result.content[0].text as string;

      expect(result.isError).toBeUndefined();
      expect(calls).toHaveLength(1);
      expect(calls[0].command).toBe("lit");
      expect(calls[0].args).toEqual([
        "parse",
        filePath,
        "--format",
        "text",
        "--target-pages",
        "1-3",
      ]);
      expect(calls[0].options.timeoutMs).toBe(30_000);
      expect(text).toContain("仅解析附件前 3 页");
      expect(text).toContain("第一页内容");
    });

    it("should degrade to document metadata when preview parsing fails", async () => {
      const filename = "broken.docx";
      const content = Buffer.from([1, 2, 3, 4]);
      const docTool = createReadAttachmentTool(ctx, {
        commandRunner: async () => {
          throw new Error("lit is unavailable");
        },
      });
      await writeFile(join(tempKbRoot, "attachments", filename), content);

      const result = await (docTool.handler as any)({ filename });
      const text = result.content[0].text as string;

      expect(result.isError).toBeUndefined();
      expect(text).toContain("文档解析预览不可用");
      expect(text).toContain("lit is unavailable");
      expect(text).toContain("大小: 4 字节");
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

    it("should avoid overwriting existing note assets during import", async () => {
      const noteEntry = {
        id: "inbox/conflict-note/index.md",
        title: "Conflict Note",
        captured_at: new Date().toISOString(),
        tags: [],
        type: "note" as const,
        attachments: [{ name: "doc.txt", description: "Existing doc" }],
        content: "Note content here.",
      };
      await fileOps.saveEntry(noteEntry);
      await indexMgr.addEntry(noteEntry);
      await writeFile(
        join(tempKbRoot, "inbox", "conflict-note", "assets", "doc.txt"),
        "existing",
        "utf8",
      );
      await writeFile(
        join(tempKbRoot, "attachments", "doc.txt"),
        "incoming",
        "utf8",
      );

      const result = await (tool.handler as any)({
        action: "import",
        local_path: "attachments/doc.txt",
        target_entry_id: "inbox/conflict-note/index.md",
        description: "Incoming doc",
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain("assets/doc-2.txt");
      expect(
        existsSync(
          join(tempKbRoot, "inbox", "conflict-note", "assets", "doc.txt"),
        ),
      ).toBe(true);
      expect(
        existsSync(
          join(tempKbRoot, "inbox", "conflict-note", "assets", "doc-2.txt"),
        ),
      ).toBe(true);

      const entry = await fileOps.readEntry("inbox/conflict-note/index.md");
      expect(entry.attachments?.map((att) => att.name).sort()).toEqual([
        "doc-2.txt",
        "doc.txt",
      ]);
    });
  });

  describe("save_to_kb tool", () => {
    const tool = createSaveToKbTool(ctx);

    it("should archive pending knowledge-entry attachments as note assets", async () => {
      const filename = "研究报告.pdf";
      const content = Buffer.from([1, 2, 3, 4, 5]);
      await writeFile(join(tempKbRoot, "attachments", filename), content);
      setPendingKnowledgeAttachments(ctx.userId, [
        {
          name: "原始研究报告.pdf",
          size: content.length,
          path: `attachments/${filename}`,
        },
      ]);

      try {
        const result = await (tool.handler as any)({
          title: "Uploaded Report Knowledge Entry",
          content: "这是一条根据上传附件整理的知识条目。",
          tags: [],
          category: "inbox",
          attachments: [],
        });

        expect(result.isError).toBeUndefined();
        const text = result.content[0].text as string;
        const entryId = text.match(/文件相对路径为: (.+)$/)?.[1];
        expect(entryId).toBeTruthy();
        expect(entryId).toContain("/index.md");

        const entry = await fileOps.readEntry(entryId!);
        expect(entry.attachments).toEqual([
          {
            name: filename,
            description: "原始研究报告.pdf",
            size: content.length,
          },
        ]);
        expect(
          existsSync(
            join(
              dirname(fileOps.resolveEntryPath(entryId!)),
              "assets",
              filename,
            ),
          ),
        ).toBe(true);
        expect(existsSync(join(tempKbRoot, "attachments", filename))).toBe(
          false,
        );
      } finally {
        clearPendingKnowledgeAttachments(ctx.userId);
      }
    });
  });
});
