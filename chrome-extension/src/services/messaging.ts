import type { RuntimeMessage, RuntimeResponse } from '../types/message';

export async function sendRuntimeMessage<T>(message: RuntimeMessage): Promise<T> {
  const response = (await chrome.runtime.sendMessage(message)) as RuntimeResponse<T> | undefined;
  if (!response?.ok) {
    throw new Error(response?.error ?? 'Knovana background service did not respond.');
  }
  return response.data as T;
}
