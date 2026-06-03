import { describe, expect, it, vi } from 'vitest';
import { readSseStream, type ParsedSseData } from './sse';

function streamResponse(chunks: string[], init: ResponseInit = { status: 200 }) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
    init,
  );
}

describe('readSseStream', () => {
  it('parses data lines across chunks', async () => {
    const events: ParsedSseData[] = [];

    await readSseStream(
      streamResponse(['data: {"content":"hel', 'lo"}\n', 'event: ping\n', 'data: plain text\n']),
      (data) => {
        events.push(data);
      },
    );

    expect(events).toEqual([
      { raw: '{"content":"hello"}', json: { content: 'hello' } },
      { raw: 'plain text', json: undefined },
    ]);
  });

  it('ignores empty payloads and done sentinels', async () => {
    const onData = vi.fn();

    await readSseStream(streamResponse(['data:\n', 'data: [DONE]\n']), onData);

    expect(onData).not.toHaveBeenCalled();
  });

  it('flushes a final line without a newline', async () => {
    const events: ParsedSseData[] = [];

    await readSseStream(streamResponse(['data: final']), (data) => {
      events.push(data);
    });

    expect(events).toEqual([{ raw: 'final', json: undefined }]);
  });

  it('throws response bodies for failed requests', async () => {
    await expect(
      readSseStream(new Response('No access', { status: 403 }), vi.fn()),
    ).rejects.toThrow('No access');
  });

  it('requires a readable body', async () => {
    await expect(readSseStream(new Response(null), vi.fn())).rejects.toThrow(
      'The response did not include a readable stream.',
    );
  });
});
