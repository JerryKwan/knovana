export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | {
      type: 'tool_call';
      id: string;
      name: string;
      input: Record<string, unknown>;
      partialJson?: string;
    }
  | { type: 'tool_result'; tool_call_id: string; status: 'success' | 'error'; content: unknown }
  | { type: 'widget'; widget_type: string; data: unknown };

export interface ChatAttachment {
  name: string;
  size?: number;
  path: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  error?: string;
  blocks?: ContentBlock[];
  statusRail?: { text: string; indicator?: 'thinking' | 'tool' | 'loading' } | null;
  attachment?: ChatAttachment;
}
