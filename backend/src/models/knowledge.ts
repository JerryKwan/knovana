export interface KnowledgeAttachment {
  name: string;
  description?: string;
  size?: number;
  mime_type?: string;
  ai_description?: string;
}

export interface KnowledgeEntry {
  id: string; // Relative path, e.g., 'inbox/2024-12-01-react-patterns.md'
  title: string;
  source?: string;
  captured_at: string;
  updated_at?: string;
  tags?: string[];
  type: "excerpt" | "note" | "page" | "image" | "link" | "chat";
  language?: string;
  attachments?: KnowledgeAttachment[];
  ai_generated?: boolean;
  content: string; // Markdown body, excluding frontmatter
}

export interface KnowledgeListItem {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  source_url?: string;
  has_attachments: boolean;
  attachment_count: number;
  created_at: string;
  updated_at: string;
  type: string;
}
