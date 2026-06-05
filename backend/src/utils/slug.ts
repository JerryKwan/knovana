/**
 * Generates an Obsidian-compatible slug from a title.
 * Converts characters to lowercase, replaces spaces with hyphens,
 * and strips common punctuation/special characters while preserving alphanumeric
 * and Chinese/international characters.
 */
export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, "-")
      // Strip common punctuation and special characters, preserving word characters, numbers, and international (e.g. Chinese) chars
      .replace(/[/?!:;.,\\()[\]{}'"“”‘’+*=&%#@^~`<>|\u00a7\u00b6]/g, "")
      // Replace multiple consecutive hyphens with a single one
      .replace(/-+/g, "-")
      // Strip leading and trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
}
