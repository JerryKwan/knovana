import { render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '../../types/chat';
import ChatView from './ChatView.svelte';

const scrollToMock = vi.fn();

let scrollToDescriptor: PropertyDescriptor | undefined;
let scrollHeightDescriptor: PropertyDescriptor | undefined;
let clientHeightDescriptor: PropertyDescriptor | undefined;

function assistantMessage(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: 'assistant-1',
    role: 'assistant',
    content: '',
    createdAt: 1,
    ...overrides,
  };
}

function userMessage(content: string): ChatMessage {
  return {
    id: 'user-1',
    role: 'user',
    content,
    createdAt: 1,
  };
}

beforeEach(() => {
  scrollToMock.mockReset();
  scrollToDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');
  scrollHeightDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
  clientHeightDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');

  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: scrollToMock,
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => 640,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 240,
  });

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  if (scrollToDescriptor) {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', scrollToDescriptor);
  } else {
    delete (HTMLElement.prototype as unknown as { scrollTo?: unknown }).scrollTo;
  }
  if (scrollHeightDescriptor) {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollHeightDescriptor);
  } else {
    delete (HTMLElement.prototype as unknown as { scrollHeight?: unknown }).scrollHeight;
  }
  if (clientHeightDescriptor) {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeightDescriptor);
  } else {
    delete (HTMLElement.prototype as unknown as { clientHeight?: unknown }).clientHeight;
  }
});

describe('ChatView', () => {
  it('shows a lightweight placeholder while a streaming assistant message is empty', () => {
    const { container } = render(ChatView, {
      props: {
        messages: [
          assistantMessage({
            isStreaming: true,
            blocks: [],
            statusRail: { text: '准备中...', indicator: 'loading' },
          }),
        ],
      },
    });

    expect(screen.getByLabelText('准备中')).toBeTruthy();
    expect(container.querySelectorAll('.assistant-placeholder span')).toHaveLength(3);
  });

  it('hides the placeholder once assistant content is visible', () => {
    const { container } = render(ChatView, {
      props: {
        messages: [
          assistantMessage({
            isStreaming: true,
            blocks: [{ type: 'text', text: '已经开始回复。' }],
          }),
        ],
      },
    });

    expect(container.querySelector('.assistant-placeholder')).toBeNull();
    expect(screen.getByText('已经开始回复。')).toBeTruthy();
  });

  it('does not show the placeholder for errored assistant messages', () => {
    const { container } = render(ChatView, {
      props: {
        messages: [
          assistantMessage({
            isStreaming: true,
            error: '请求失败',
            blocks: [],
          }),
        ],
      },
    });

    expect(container.querySelector('.assistant-placeholder')).toBeNull();
  });

  it('renders completed thinking as a discoverable collapsed detail block', () => {
    const { container } = render(ChatView, {
      props: {
        messages: [
          assistantMessage({
            blocks: [{ type: 'thinking', text: '先分析用户问题，再检查上下文。' }],
          }),
        ],
      },
    });

    const details = container.querySelector('.block-thinking') as HTMLDetailsElement;
    expect(screen.getByText('思考过程')).toBeTruthy();
    expect(screen.getByText('详情')).toBeTruthy();
    expect(details.open).toBe(false);
  });

  it('keeps streaming thinking open with an active hint', () => {
    const { container } = render(ChatView, {
      props: {
        messages: [
          assistantMessage({
            isStreaming: true,
            blocks: [{ type: 'thinking', text: '正在拆解任务。' }],
          }),
        ],
      },
    });

    const details = container.querySelector('.block-thinking') as HTMLDetailsElement;
    expect(screen.getByText('生成中')).toBeTruthy();
    expect(details.open).toBe(true);
  });

  it('renders tool results as normalized raw output', () => {
    const { container } = render(ChatView, {
      props: {
        messages: [
          assistantMessage({
            blocks: [
              {
                type: 'tool_result',
                tool_call_id: 'tool-1',
                status: 'success',
                content: '/tmp/work\r\nfile-one\rfile-two',
              },
            ],
          }),
        ],
      },
    });

    const output = container.querySelector('.tool-result-output code');
    expect(output?.textContent).toBe('/tmp/work\nfile-one\nfile-two');
    expect(container.querySelector('.tool-result-markdown')).toBeNull();
  });

  it('formats object tool results as indented JSON', () => {
    const { container } = render(ChatView, {
      props: {
        messages: [
          assistantMessage({
            blocks: [
              {
                type: 'tool_result',
                tool_call_id: 'tool-1',
                status: 'success',
                content: { ok: true, files: ['a.ts', 'b.ts'] },
              },
            ],
          }),
        ],
      },
    });

    const output = container.querySelector('.tool-result-output code');
    expect(output?.textContent).toContain('"ok": true');
    expect(output?.textContent).toContain('"files": [\n    "a.ts",\n    "b.ts"\n  ]');
  });

  it('scrolls to the bottom when a new message batch appears', async () => {
    const { rerender } = render(ChatView, {
      props: {
        messages: [],
      },
    });

    await rerender({
      messages: [
        userMessage('列出当前目录'),
        assistantMessage({
          id: 'assistant-2',
          isStreaming: true,
          blocks: [{ type: 'text', text: '正在处理...' }],
        }),
      ],
    });

    await waitFor(() =>
      expect(scrollToMock).toHaveBeenCalledWith({
        top: 640,
        behavior: 'smooth',
      }),
    );
  });
});
