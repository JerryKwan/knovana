import { constants } from "node:fs";
import { copyFile, rm, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const UNSAFE_FILENAME_CHARS = /[<>:"/\\|?*[\]()]/g;
const MAX_FILENAME_LENGTH = 180;

export interface UniqueFileResult {
  filename: string;
  path: string;
}

export function sanitizeAttachmentFilename(
  originalName: string,
  options: { fallbackBase?: string; fallbackExt?: string } = {},
): string {
  const fallbackBase = sanitizeFallbackBase(
    options.fallbackBase || "attachment",
  );
  const fallbackExt = sanitizeExtension(options.fallbackExt || "");
  const rawLeaf =
    originalName
      .normalize("NFC")
      .replace(/\\/g, "/")
      .split("/")
      .pop()
      ?.trim() || "";

  let cleaned = rawLeaf
    .split("")
    .map((char) => (isControlChar(char) ? " " : char))
    .join("")
    .replace(UNSAFE_FILENAME_CHARS, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[. ]+|[. ]+$/g, "");

  if (!cleaned || cleaned === "." || cleaned === "..") {
    cleaned = `${fallbackBase}${fallbackExt}`;
  }

  if (!extname(cleaned) && fallbackExt) {
    cleaned = `${cleaned}${fallbackExt}`;
  }

  cleaned = avoidReservedWindowsName(cleaned);
  return truncateFilename(cleaned || `${fallbackBase}${fallbackExt}`);
}

export async function writeUniqueFile(
  directory: string,
  desiredName: string,
  data: Buffer | Uint8Array | string,
): Promise<UniqueFileResult> {
  const safeName = sanitizeAttachmentFilename(desiredName);

  for (let index = 1; index <= 10_000; index += 1) {
    const filename =
      index === 1 ? safeName : appendFilenameSuffix(safeName, index);
    const targetPath = join(directory, filename);
    try {
      await writeFile(targetPath, data, { flag: "wx" });
      return { filename, path: targetPath };
    } catch (err) {
      if (isFileExistsError(err)) continue;
      throw err;
    }
  }

  throw new Error(`Unable to allocate a unique filename for "${safeName}"`);
}

export async function copyFileUnique(
  sourcePath: string,
  directory: string,
  desiredName: string,
): Promise<UniqueFileResult> {
  const safeName = sanitizeAttachmentFilename(desiredName);

  for (let index = 1; index <= 10_000; index += 1) {
    const filename =
      index === 1 ? safeName : appendFilenameSuffix(safeName, index);
    const targetPath = join(directory, filename);
    try {
      await copyFile(sourcePath, targetPath, constants.COPYFILE_EXCL);
      return { filename, path: targetPath };
    } catch (err) {
      if (isFileExistsError(err)) continue;
      throw err;
    }
  }

  throw new Error(`Unable to allocate a unique filename for "${safeName}"`);
}

export async function moveFileUnique(
  sourcePath: string,
  directory: string,
  desiredName: string,
): Promise<UniqueFileResult> {
  const result = await copyFileUnique(sourcePath, directory, desiredName);
  await rm(sourcePath, { force: true });
  return result;
}

export function extractAttachmentFilename(localPath: string): string | null {
  const normalized = localPath.replace(/\\/g, "/");
  if (!normalized.startsWith("attachments/")) return null;

  const filename = normalized.slice("attachments/".length);
  if (
    !filename ||
    filename.includes("/") ||
    filename === "." ||
    filename === ".."
  ) {
    return null;
  }

  return filename;
}

export function encodePathSegments(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function inferExtensionFromContentType(contentType: string): string {
  const type = contentType.toLowerCase();
  if (type.includes("image/jpeg") || type.includes("image/jpg")) return ".jpg";
  if (type.includes("image/png")) return ".png";
  if (type.includes("image/gif")) return ".gif";
  if (type.includes("image/webp")) return ".webp";
  if (type.includes("image/svg+xml")) return ".svg";
  if (type.includes("application/pdf")) return ".pdf";
  if (type.includes("text/markdown")) return ".md";
  if (type.includes("text/plain")) return ".txt";
  if (type.includes("text/html")) return ".html";
  if (type.includes("application/json")) return ".json";
  if (type.includes("audio/mpeg")) return ".mp3";
  if (type.includes("audio/wav")) return ".wav";
  if (type.includes("audio/ogg")) return ".ogg";
  if (type.includes("video/mp4")) return ".mp4";
  if (type.includes("video/webm")) return ".webm";
  return "";
}

export function filenameFromContentDisposition(
  value: string | null,
): string | null {
  if (!value) return null;

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].trim().replace(/^"|"$/g, "");
    }
  }

  const asciiMatch = value.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1]?.trim() || null;
}

export function appendFilenameSuffix(filename: string, suffix: number): string {
  const ext = extname(filename);
  const stem = ext ? filename.slice(0, -ext.length) : filename;
  return `${stem}-${suffix}${ext}`;
}

function sanitizeFallbackBase(value: string): string {
  return (
    value
      .split("")
      .map((char) => (isControlChar(char) ? " " : char))
      .join("")
      .replace(UNSAFE_FILENAME_CHARS, "-")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[. ]+|[. ]+$/g, "") || "attachment"
  );
}

function sanitizeExtension(value: string): string {
  if (!value) return "";
  const ext = value.startsWith(".") ? value : `.${value}`;
  return ext
    .split("")
    .filter((char) => !isControlChar(char))
    .join("")
    .replace(UNSAFE_FILENAME_CHARS, "");
}

function avoidReservedWindowsName(filename: string): string {
  const ext = extname(filename);
  const stem = ext ? basename(filename, ext) : filename;
  if (!RESERVED_WINDOWS_NAMES.test(stem)) return filename;
  return `${stem}-file${ext}`;
}

function truncateFilename(filename: string): string {
  if (filename.length <= MAX_FILENAME_LENGTH) return filename;

  const ext = extname(filename);
  const stem = ext ? filename.slice(0, -ext.length) : filename;
  const maxStemLength = Math.max(1, MAX_FILENAME_LENGTH - ext.length);
  return `${stem.slice(0, maxStemLength)}${ext}`;
}

function isFileExistsError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "EEXIST"
  );
}

function isControlChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code <= 31 || code === 127;
}
