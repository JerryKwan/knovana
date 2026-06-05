export interface ChatSession {
  id: string;
  user_id: string;
  title: string | null;
  context: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: string | null; // JSON string (tokens, models, etc)
  created_at: string;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

export interface ChatSessionListItem extends ChatSession {
  message_count: number;
}
