import { describe, it, expect, afterEach } from "vitest";
import { join } from "node:path";
import { mkdir, readFile, rm } from "node:fs/promises";
import { generateSlug } from "../src/utils/slug";
import { getISOStringWithOffset } from "../src/utils/datetime";
import { BadRequestError } from "../src/utils/errors";
import {
  sanitizeAttachmentFilename,
  writeUniqueFile,
} from "../src/utils/filename";

const tempRoot = join(process.cwd(), ".tmp", "test-utils");

describe("Utils Tests", () => {
  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("generateSlug cleans titles correctly and supports multilingual chars", () => {
    expect(generateSlug("React Server Components 详解")).toBe(
      "react-server-components-详解",
    );
    expect(generateSlug("  Hello World!!!  ")).toBe("hello-world");
    expect(generateSlug("Obsidian - note/with/slashes")).toBe(
      "obsidian-notewithslashes",
    );
  });

  it("getISOStringWithOffset formats ISO date containing timezone offset", () => {
    const iso = getISOStringWithOffset();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });

  it("custom errors assign code and status properly", () => {
    const err = new BadRequestError("Invalid query");
    expect(err.status).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("Invalid query");
  });

  it("sanitizes attachment filenames while preserving readable names", () => {
    expect(sanitizeAttachmentFilename("资料 2026.pdf")).toBe("资料 2026.pdf");
    expect(sanitizeAttachmentFilename("C:\\tmp\\报告(最终版).pdf")).toBe(
      "报告-最终版-.pdf",
    );
    expect(sanitizeAttachmentFilename("../secret?.md")).toBe("secret-.md");
    expect(sanitizeAttachmentFilename("CON.txt")).toBe("CON-file.txt");
  });

  it("writes same-name attachments with compact numeric suffixes", async () => {
    await mkdir(tempRoot, { recursive: true });

    const first = await writeUniqueFile(tempRoot, "报告.pdf", "one");
    const second = await writeUniqueFile(tempRoot, "报告.pdf", "two");

    expect(first.filename).toBe("报告.pdf");
    expect(second.filename).toBe("报告-2.pdf");
    expect(await readFile(join(tempRoot, "报告.pdf"), "utf8")).toBe("one");
    expect(await readFile(join(tempRoot, "报告-2.pdf"), "utf8")).toBe("two");
  });
});
