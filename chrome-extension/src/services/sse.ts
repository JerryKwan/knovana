export interface ParsedSseData {
  raw: string;
  json?: unknown;
}

export async function readSseStream(
  response: Response,
  onData: (data: ParsedSseData) => void | Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || `Request failed with ${response.status}`);
  }

  if (!response.body) {
    throw new Error('The response did not include a readable stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    if (signal?.aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError');
    }
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const raw = trimmed.slice(5).trimStart();
      if (!raw || raw === '[DONE]') continue;

      await onData({ raw, json: tryParseJson(raw) });
    }
  }

  const tail = buffer.trim();
  if (tail.startsWith('data:')) {
    const raw = tail.slice(5).trimStart();
    if (raw && raw !== '[DONE]') {
      await onData({ raw, json: tryParseJson(raw) });
    }
  }
}

function tryParseJson(value: string): unknown | undefined {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}
