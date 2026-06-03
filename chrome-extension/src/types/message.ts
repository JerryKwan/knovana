import type { CaptureRequestBody, PendingAction } from './capture';
import type { ApiStreamEvent, ChatRequestBody } from './api';

export type RuntimeMessage =
  | { type: 'GET_ACTIVE_CONTEXT' }
  | { type: 'CONSUME_PENDING_ACTION' }
  | { type: 'START_CHAT'; requestId: string; payload: ChatRequestBody }
  | { type: 'START_CAPTURE'; requestId: string; payload: CaptureRequestBody }
  | { type: 'GET_KNOWLEDGE'; payload?: { page?: number; tags?: string[]; query?: string } }
  | { type: 'GET_KNOWLEDGE_DETAIL'; payload: { id: string } }
  | { type: 'DELETE_KNOWLEDGE'; payload: { id: string } }
  | { type: 'SEARCH_KNOWLEDGE'; payload: { query: string } }
  | { type: 'OPEN_OPTIONS' }
  | { type: 'PENDING_ACTION'; payload: PendingAction }
  | { type: 'STREAM_EVENT'; payload: ApiStreamEvent };

export interface RuntimeResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
