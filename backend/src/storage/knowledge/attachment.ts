import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";

export class AttachmentManager {
  constructor(private readonly userKbRoot: string) {}

  /**
   * Saves an uploaded binary file buffer to the user's attachments directory.
   * Generates a unique, timestamp-prefixed filename to avoid collisions.
   */
  async saveUploadedFile(
    fileBuffer: Buffer,
    originalName: string,
  ): Promise<{ urlPath: string; filename: string; sizeBytes: number }> {
    const ext = extname(originalName) || ".png";

    // Generate clean timestamp: YYYYMMDD_HHMMSS
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(
      now.getHours(),
    )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const uniqueFilename = `img_${timestamp}_${randomUUID().slice(0, 6)}${ext}`;

    const attachmentsDir = join(this.userKbRoot, "attachments");
    await mkdir(attachmentsDir, { recursive: true });

    const filePath = join(attachmentsDir, uniqueFilename);
    await writeFile(filePath, fileBuffer);

    return {
      filename: uniqueFilename,
      urlPath: uniqueFilename, // Will be combined with userId in the route
      sizeBytes: fileBuffer.length,
    };
  }
}
