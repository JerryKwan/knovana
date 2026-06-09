import type { CaptureAction, ActionContext, CaptureRequestBody, PendingAction } from './capture';
import type { ApiStreamEvent, ChatRequestBody, RegenerateRequestBody } from './api';
import type { ExtensionSurface } from './settings';

export interface SurfaceRegistrationResponse {
  activeSurfaceId: string;
}

export type RuntimeMessage =
  | { type: 'GET_ACTIVE_CONTEXT'; payload?: { action?: CaptureAction } }
  | { type: 'GET_TARGET_WINDOW_ID' }
  | { type: 'REGISTER_SURFACE'; payload: { surface: ExtensionSurface; surfaceId: string } }
  | { type: 'UNREGISTER_SURFACE'; payload: { surfaceId: string } }
  | {
      type: 'SWITCH_SURFACE';
      payload: { target: ExtensionSurface; sourceSurfaceId: string };
    }
  | { type: 'ACK_PENDING_ACTION'; payload: { actionId: string; surfaceId: string } }
  | { type: 'CONSUME_PENDING_ACTION'; payload?: { surfaceId?: string } }
  | { type: 'START_CHAT'; requestId: string; surfaceId?: string; payload: ChatRequestBody }
  | {
      type: 'REGENERATE_CHAT';
      requestId: string;
      surfaceId?: string;
      payload: RegenerateRequestBody;
    }
  | { type: 'ABORT_CHAT'; requestId: string }
  | { type: 'START_CAPTURE'; requestId: string; surfaceId?: string; payload: CaptureRequestBody }
  | { type: 'GET_KNOWLEDGE'; payload?: { page?: number; tags?: string[]; query?: string } }
  | { type: 'GET_KNOWLEDGE_DETAIL'; payload: { id: string } }
  | { type: 'DELETE_KNOWLEDGE'; payload: { id: string } }
  | { type: 'SEARCH_KNOWLEDGE'; payload: { query: string } }
  | { type: 'GET_SESSIONS'; payload?: { page?: number; per_page?: number } }
  | { type: 'GET_SESSION_DETAIL'; payload: { id: string } }
  | { type: 'DELETE_SESSION'; payload: { id: string } }
  | { type: 'DELETE_MESSAGE'; payload: { sessionId: string; messageId: string } }
  | { type: 'OPEN_OPTIONS' }
  | {
      type: 'CAPTURE_SUBMIT';
      payload: { prompt: string; action: CaptureAction; context: ActionContext };
    }
  | { type: 'CAPTURE_CANCEL' }
  | { type: 'PENDING_ACTION'; targetSurfaceId?: string; payload: PendingAction }
  | { type: 'STREAM_EVENT'; targetSurfaceId?: string; payload: ApiStreamEvent };

export interface RuntimeResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
