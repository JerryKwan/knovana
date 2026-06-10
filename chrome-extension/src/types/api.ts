import type { CapturedImage } from './capture';

export interface ApiStreamEvent {
  requestId: string;
  stream: 'chat' | 'capture';
  status: 'start' | 'chunk' | 'action' | 'done' | 'error';
  content?: string;
  action?: string;
  path?: string;
  error?: string;
  sessionId?: string;
  pspEvent?: Record<string, unknown>;
}

export interface ChatContext {
  page_url?: string;
  page_title?: string;
  selected_text?: string;
  selected_images?: CapturedImage[];
}

export interface ChatRequestBody {
  message: string;
  session_id?: string;
  intent?: 'chat' | 'knowledge_entry';
  attachment?: {
    name: string;
    size?: number;
    path: string;
  };
  attachments?: Array<{
    name: string;
    size?: number;
    path: string;
  }>;
}

export interface AttachmentUploadResponse {
  filename: string;
  path: string;
  url: string;
  size?: number;
  mime_type?: string;
}

export interface RegenerateRequestBody {
  session_id: string;
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  source_url?: string;
  has_attachments?: boolean;
  attachment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeListResponse {
  entries: KnowledgeEntry[];
  total: number;
  page: number;
  per_page: number;
}

export interface KnowledgeDetail extends KnowledgeEntry {
  content: string;
  attachments?: Array<{
    name: string;
    description?: string;
    path: string;
    size_bytes?: number;
  }>;
}

export interface SearchResponse {
  query: string;
  results: KnowledgeEntry[];
  answer?: string;
}
