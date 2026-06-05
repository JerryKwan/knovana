import matter from "gray-matter";
import type { KnowledgeEntry } from "../../models/knowledge";

/**
 * Parses frontmatter and content from a raw Markdown string.
 */
export function parseFrontmatter(text: string): {
  data: Record<string, any>;
  content: string;
} {
  const { data, content } = matter(text);
  return { data, content: content.trim() };
}

/**
 * Generates the YAML frontmatter block for a KnowledgeEntry.
 */
export function generateFrontmatter(
  entry: Omit<KnowledgeEntry, "content">,
): string {
  const meta: Record<string, any> = {
    title: entry.title,
  };

  if (entry.source) meta.source = entry.source;
  meta.captured_at = entry.captured_at;
  if (entry.updated_at) meta.updated_at = entry.updated_at;
  if (entry.tags) meta.tags = entry.tags;
  meta.type = entry.type;
  if (entry.language) meta.language = entry.language;
  if (entry.attachments && entry.attachments.length > 0)
    meta.attachments = entry.attachments;
  if (entry.ai_generated !== undefined) meta.ai_generated = entry.ai_generated;

  // matter.stringify('', meta) returns '---\nkey: val\n---\n'
  const output = matter.stringify("", meta);
  return output.trim();
}
