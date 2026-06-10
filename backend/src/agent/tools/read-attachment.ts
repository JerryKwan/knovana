import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { execFile } from "node:child_process";
import { join, relative, extname } from "node:path";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import type { ToolContext } from "./index";

const DOCUMENT_PREVIEW_PAGE_COUNT = 3;
const DOCUMENT_PREVIEW_PAGE_RANGE = `1-${DOCUMENT_PREVIEW_PAGE_COUNT}`;
const ATTACHMENT_PREVIEW_MAX_CHARS = 12_000;
const DOCUMENT_PARSE_TIMEOUT_MS = 30_000;
const DOCUMENT_PARSE_MAX_BUFFER_BYTES = 1024 * 1024;

// Knowledge-entry generation needs a bounded summary preview; the original
// attachment is still kept intact and later archived by save_to_kb.
const textExtensions = new Set([
  ".txt",
  ".md",
  ".json",
  ".html",
  ".css",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".yaml",
  ".yml",
  ".csv",
  ".xml",
  ".ini",
  ".conf",
  ".log",
  ".py",
  ".sh",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
]);

const documentExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".docm",
  ".odt",
  ".rtf",
  ".ppt",
  ".pptx",
  ".pptm",
  ".odp",
  ".xls",
  ".xlsx",
  ".xlsm",
  ".ods",
]);

interface CommandRunnerOptions {
  timeoutMs: number;
  maxBufferBytes: number;
}

interface CommandRunnerResult {
  stdout: string;
  stderr: string;
}

type CommandRunner = (
  command: string,
  args: string[],
  options: CommandRunnerOptions,
) => Promise<CommandRunnerResult>;

interface ReadAttachmentToolOptions {
  commandRunner?: CommandRunner;
}

export function createReadAttachmentTool(
  ctx: ToolContext,
  options: ReadAttachmentToolOptions = {},
) {
  return tool(
    "read_attachment",
    "读取用户已上传到临时 attachments 目录下的附件摘要预览。文本文件会限制返回字符数；PDF、Office 等文档会尽量只解析前 3 页。对于无法直接读取的二进制格式，返回文件大小和元数据。",
    {
      filename: z
        .string()
        .describe("需要读取的文件名（如 'todo.txt' 或 'code.js'）"),
    },
    async (args) => {
      const attachmentsDir = join(ctx.kbRoot, "attachments");
      const filePath = join(attachmentsDir, args.filename);

      // Prevent directory traversal (path traversal check)
      const rel = relative(attachmentsDir, filePath);
      if (rel.startsWith("..") || rel.includes("/") || rel.includes("\\")) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `错误: 非法的文件名 "${args.filename}"。`,
            },
          ],
        };
      }

      if (!existsSync(filePath)) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `错误: 附件文件 "${args.filename}" 不存在。`,
            },
          ],
        };
      }

      try {
        const fileStat = await stat(filePath);
        const ext = extname(args.filename).toLowerCase();

        if (textExtensions.has(ext)) {
          const content = await readFile(filePath, "utf8");
          return {
            content: [
              {
                type: "text" as const,
                text: truncateAttachmentPreview(content).text,
              },
            ],
          };
        }

        if (documentExtensions.has(ext)) {
          try {
            const preview = await parseDocumentPreview(
              filePath,
              options.commandRunner ?? defaultCommandRunner,
            );
            return {
              content: [
                {
                  type: "text" as const,
                  text: formatDocumentPreview(preview),
                },
              ],
            };
          } catch (parseErr: unknown) {
            // Parsing is best-effort: a missing local parser should not block
            // the user from archiving the original attachment into the note.
            return {
              content: [
                {
                  type: "text" as const,
                  text: `文档解析预览不可用，已返回附件元数据。原因: ${formatErrorMessage(parseErr)}

${formatMetadata(args.filename, fileStat)}`,
                },
              ],
            };
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `该文件是二进制格式，无法直接读取内容。

${formatMetadata(args.filename, fileStat)}`,
            },
          ],
        };
      } catch (err: any) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `读取附件失败: ${err.message}`,
            },
          ],
        };
      }
    },
  );
}

async function parseDocumentPreview(
  filePath: string,
  commandRunner: CommandRunner,
): Promise<string> {
  const args = [
    "parse",
    filePath,
    "--format",
    "text",
    "--target-pages",
    DOCUMENT_PREVIEW_PAGE_RANGE,
  ];

  // LiteParse handles PDF and Office formats; target-pages prevents large
  // documents from flooding the agent context during summarization.
  try {
    const result = await commandRunner("lit", args, {
      timeoutMs: DOCUMENT_PARSE_TIMEOUT_MS,
      maxBufferBytes: DOCUMENT_PARSE_MAX_BUFFER_BYTES,
    });
    return result.stdout;
  } catch (err: unknown) {
    if (process.platform === "win32" && isCommandNotFoundError(err)) {
      const result = await commandRunner("lit.cmd", args, {
        timeoutMs: DOCUMENT_PARSE_TIMEOUT_MS,
        maxBufferBytes: DOCUMENT_PARSE_MAX_BUFFER_BYTES,
      });
      return result.stdout;
    }
    throw err;
  }
}

function defaultCommandRunner(
  command: string,
  args: string[],
  options: CommandRunnerOptions,
): Promise<CommandRunnerResult> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        timeout: options.timeoutMs,
        maxBuffer: options.maxBufferBytes,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        });
      },
    );
  });
}

function formatDocumentPreview(content: string): string {
  const preview = truncateAttachmentPreview(content, false);
  const text = preview.text.trim() || "（未解析到可用文本内容。）";
  const truncationNotice = preview.truncated
    ? `\n\n...（内容已截断，仅保留前 ${ATTACHMENT_PREVIEW_MAX_CHARS} 字符用于摘要整理。）`
    : "";

  return `系统已按摘要预览策略仅解析附件前 ${DOCUMENT_PREVIEW_PAGE_COUNT} 页，并限制返回字符数。原附件仍会完整保存和归档。

--- 附件解析预览 ---
${text}${truncationNotice}`;
}

function truncateAttachmentPreview(
  content: string,
  appendNotice = true,
): {
  text: string;
  truncated: boolean;
} {
  const sanitized = content.replaceAll(String.fromCharCode(0), "");
  if (sanitized.length <= ATTACHMENT_PREVIEW_MAX_CHARS) {
    return { text: sanitized, truncated: false };
  }

  const text = sanitized.slice(0, ATTACHMENT_PREVIEW_MAX_CHARS);
  if (!appendNotice) {
    return { text, truncated: true };
  }

  return {
    text: `${text}

...（内容已截断，仅保留前 ${ATTACHMENT_PREVIEW_MAX_CHARS} 字符用于摘要整理。原附件仍完整保存。）`,
    truncated: true,
  };
}

function formatMetadata(
  filename: string,
  fileStat: { size: number; mtime: Date },
): string {
  return `元数据信息:
- 文件名: ${filename}
- 大小: ${fileStat.size} 字节
- 修改时间: ${fileStat.mtime.toISOString()}`;
}

function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  return "未知错误";
}

function isCommandNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as NodeJS.ErrnoException).code === "ENOENT"
  );
}
