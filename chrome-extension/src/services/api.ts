import { getSettings } from './storage';
import { readSseStream, type ParsedSseData } from './sse';
import type { AttachmentUploadResponse } from '../types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiJson<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(endpoint, init);
  if (!response.ok) {
    throw await toApiError(response);
  }
  return (await response.json()) as T;
}

export async function apiStream(
  endpoint: string,
  body: unknown,
  onData: (data: ParsedSseData) => void | Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  const response = await apiFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  await readSseStream(response, onData, signal);
}

async function apiFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  const settings = await getSettings();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (settings.token) {
    headers.set('Authorization', `Bearer ${settings.token}`);
  }

  return fetch(`${settings.backendUrl}${endpoint}`, {
    ...init,
    headers,
  });
}

async function toApiError(response: Response): Promise<ApiError> {
  const text = await response.text().catch(() => '');
  return new ApiError(text || `Request failed with ${response.status}`, response.status);
}

export async function uploadAttachment(file: File): Promise<AttachmentUploadResponse> {
  const settings = await getSettings();
  const formData = new FormData();
  formData.append('file', file);

  const headers = new Headers();
  if (settings.token) {
    headers.set('Authorization', `Bearer ${settings.token}`);
  }

  const res = await fetch(`${settings.backendUrl}/attachments`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }
  const result = (await res.json()) as AttachmentUploadResponse;
  if (!result.path) {
    throw new Error('Upload failed: backend did not return an attachment path');
  }
  return result;
}
