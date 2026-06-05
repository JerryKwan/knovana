import type { CaptureRequestBody, PendingAction } from './capture';
import type { ApiStreamEvent, ChatRequestBody, RegenerateRequestBody } from './api';

export type RuntimeMessage =
  | { type: 'GET_ACTIVE_CONTEXT' }
  | { type: 'CONSUME_PENDING_ACTION' }
  | { type: 'START_CHAT'; requestId: string; payload: ChatRequestBody }
  | { type: 'REGENERATE_CHAT'; requestId: string; payload: RegenerateRequestBody }
  | { type: 'START_CAPTURE'; requestId: string; payload: CaptureRequestBody }
  | { type: 'GET_KNOWLEDGE'; payload?: { page?: number; tags?: string[]; query?: string } }
  | { type: 'GET_KNOWLEDGE_DETAIL'; payload: { id: string } }
  | { type: 'DELETE_KNOWLEDGE'; payload: { id: string } }
  | { type: 'SEARCH_KNOWLEDGE'; payload: { query: string } }
  | { type: 'GET_SESSIONS'; payload?: { page?: number; per_page?: number } }
  | { type: 'GET_SESSION_DETAIL'; payload: { id: string } }
  | { type: 'DELETE_SESSION'; payload: { id: string } }
  | { type: 'DELETE_MESSAGE'; payload: { sessionId: string; messageId: string } }
  | { type: 'OPEN_OPTIONS' }
  | { type: 'PENDING_ACTION'; payload: PendingAction }
  | { type: 'STREAM_EVENT'; payload: ApiStreamEvent };

export interface RuntimeResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
