import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { writeUniqueFile } from "../../utils/filename";

export class AttachmentManager {
  constructor(private readonly userKbRoot: string) {}

  /**
   * Saves an uploaded binary file buffer to the user's attachments directory.
   * Keeps the original filename where possible and appends a small numeric
   * suffix only when a same-name file already exists.
   */
  async saveUploadedFile(
    fileBuffer: Buffer,
    originalName: string,
  ): Promise<{ urlPath: string; filename: string; sizeBytes: number }> {
    const attachmentsDir = join(this.userKbRoot, "attachments");
    await mkdir(attachmentsDir, { recursive: true });

    const result = await writeUniqueFile(
      attachmentsDir,
      originalName,
      fileBuffer,
    );

    return {
      filename: result.filename,
      urlPath: result.filename, // Will be combined with userId in the route
      sizeBytes: fileBuffer.length,
    };
  }
}
