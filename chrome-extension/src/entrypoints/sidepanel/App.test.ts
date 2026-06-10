import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.svelte';

const CURRENT_CHAT_SESSION_KEY = 'knovana.currentChatSessionId';
const CHAT_INPUT_DRAFT_KEY = 'knovana.chatInputDraft';
const localStore: Record<string, unknown> = {};
const sendMessageMock = vi.fn();
const fetchMock = vi.fn();

function installChromeMock() {
  vi.stubGlobal('chrome', {
    runtime: {
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      sendMessage: sendMessageMock,
    },
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: localStore[key] })),
        set: vi.fn(async (values: Record<string, unknown>) => {
          Object.assign(localStore, values);
        }),
        remove: vi.fn(async (key: string) => {
          delete localStore[key];
        }),
      },
    },
  });
}

function installRuntimeResponses() {
  sendMessageMock.mockImplementation(
    async (message: { type: string; payload?: Record<string, unknown> }) => {
      if (message.type === 'GET_ACTIVE_CONTEXT') {
        return {
          ok: true,
          data: {
            pageUrl: 'https://example.com',
            pageTitle: 'Example',
            selectedImages: [],
          },
        };
      }

      if (message.type === 'CONSUME_PENDING_ACTION') {
        return { ok: true, data: null };
      }

      if (message.type === 'GET_SESSION_DETAIL') {
        return {
          ok: true,
          data: {
            id: message.payload?.id as string,
            title: 'Restored chat',
            messages: [
              {
                id: 'msg-user',
                role: 'user',
                content: '关闭前的问题',
                created_at: '2026-06-08T08:00:00Z',
              },
              {
                id: 'msg-assistant',
                role: 'assistant',
                content: '关闭前的回答',
                created_at: '2026-06-08T08:00:01Z',
              },
            ],
          },
        };
      }

      return { ok: true, data: null };
    },
  );
}

describe('Sidepanel App current chat session restore', () => {
  beforeEach(() => {
    for (const key of Object.keys(localStore)) {
      delete localStore[key];
    }
    sendMessageMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ filename: 'uploaded.md', url: '/attachments/uploaded.md' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    installChromeMock();
    installRuntimeResponses();
    vi.stubGlobal('fetch', fetchMock);
    let uuidCounter = 0;
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => `test-id-${++uuidCounter}`),
    });
  });

  it('restores the saved current chat session when the sidepanel opens', async () => {
    localStore[CURRENT_CHAT_SESSION_KEY] = 'session-1';

    render(App);

    await waitFor(() =>
      expect(sendMessageMock).toHaveBeenCalledWith({
        type: 'GET_SESSION_DETAIL',
        payload: { id: 'session-1' },
      }),
    );
    expect(await screen.findByText('关闭前的问题')).toBeTruthy();
    expect(screen.getByText('关闭前的回答')).toBeTruthy();
    expect(localStore[CURRENT_CHAT_SESSION_KEY]).toBe('session-1');
  });

  it('restores the saved chat input draft when the sidepanel opens', async () => {
    localStore[CHAT_INPUT_DRAFT_KEY] = '未发送的问题';

    render(App);

    expect(await screen.findByDisplayValue('未发送的问题')).toBeTruthy();
  });

  it('restores the saved current session and chat input draft together', async () => {
    localStore[CURRENT_CHAT_SESSION_KEY] = 'session-1';
    localStore[CHAT_INPUT_DRAFT_KEY] = '未发送的问题';

    render(App);

    expect(await screen.findByText('关闭前的问题')).toBeTruthy();
    expect(screen.getByText('关闭前的回答')).toBeTruthy();
    expect(screen.getByDisplayValue('未发送的问题')).toBeTruthy();
  });

  it('persists chat input draft changes', async () => {
    render(App);

    const input = (await screen.findByPlaceholderText('向 Knovana 提问…')) as HTMLTextAreaElement;
    await fireEvent.input(input, { target: { value: '新的草稿' } });

    await waitFor(() => expect(localStore[CHAT_INPUT_DRAFT_KEY]).toBe('新的草稿'));
  });

  it('opens quick actions as a directly editable knowledge-entry prompt', async () => {
    render(App);

    await fireEvent.click(await screen.findByTitle('快捷操作'));
    await fireEvent.click(screen.getByText('生成知识笔记'));

    const prompt = (await screen.findByLabelText('提示词')) as HTMLTextAreaElement;
    expect(prompt.value).toContain('请基于我上传、粘贴或补充的资料');
    expect(prompt.value).toContain('save_to_kb');
    expect(screen.queryByText(/来源:/)).toBeNull();
    expect(screen.queryByText('附加整理引导词 (可选)')).toBeNull();
    expect(screen.queryByText('批注与备注 (可选)')).toBeNull();
    expect(screen.queryByText('提示词预览')).toBeNull();

    await fireEvent.input(prompt, { target: { value: '整理这份资料并保存。' } });
    await fireEvent.click(screen.getByText('确认发送并整理'));

    await waitFor(() =>
      expect(sendMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'START_CHAT',
          payload: expect.objectContaining({
            message: '整理这份资料并保存。',
            intent: 'knowledge_entry',
          }),
        }),
      ),
    );
  });

  it('runs pending capture prompts from the context-menu overlay in chat', async () => {
    sendMessageMock.mockImplementation(
      async (message: { type: string; payload?: Record<string, unknown> }) => {
        if (message.type === 'CONSUME_PENDING_ACTION') {
          return {
            ok: true,
            data: {
              id: 'pending-capture-1',
              action: 'generate-doc',
              context: {
                action: 'generate-doc',
                pageUrl: 'https://example.com/article',
                pageTitle: 'Example Article',
                selectedImages: [],
              },
              autoRun: true,
              customPrompt: '把右键菜单预览内容整理为知识条目。',
              createdAt: Date.now(),
            },
          };
        }

        return { ok: true, data: null };
      },
    );

    render(App);

    await waitFor(() =>
      expect(sendMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'START_CHAT',
          payload: expect.objectContaining({
            message: '把右键菜单预览内容整理为知识条目。',
            intent: 'knowledge_entry',
          }),
        }),
      ),
    );
  });

  it('keeps uploaded attachments when switching from composer to quick prompt', async () => {
    const { container } = render(App);

    const fileInput = await waitFor(() => {
      const input = container.querySelector('input[type="file"]');
      expect(input).not.toBeNull();
      return input as HTMLInputElement;
    });
    const file = new File(['# Notes'], 'notes.md', { type: 'text/markdown' });
    await fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText('notes.md')).toBeTruthy();
    await fireEvent.click(screen.getByTitle('快捷操作'));
    await fireEvent.click(screen.getByText('生成知识笔记'));

    expect(screen.getByText('notes.md')).toBeTruthy();
    const prompt = (await screen.findByLabelText('提示词')) as HTMLTextAreaElement;
    await fireEvent.input(prompt, { target: { value: '读取附件并整理为知识条目。' } });
    await fireEvent.click(screen.getByText('确认发送并整理'));

    await waitFor(() =>
      expect(sendMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'START_CHAT',
          payload: expect.objectContaining({
            message: '读取附件并整理为知识条目。',
            intent: 'knowledge_entry',
            attachment: {
              name: 'notes.md',
              size: 7,
              path: 'attachments/uploaded.md',
            },
          }),
        }),
      ),
    );
  });

  it('clears the saved session id when starting a new chat', async () => {
    localStore[CURRENT_CHAT_SESSION_KEY] = 'session-1';
    localStore[CHAT_INPUT_DRAFT_KEY] = '未发送的问题';

    render(App);

    await screen.findByText('关闭前的问题');
    await fireEvent.click(screen.getByTitle('新对话'));

    await waitFor(() => expect(localStore[CURRENT_CHAT_SESSION_KEY]).toBeUndefined());
    expect(localStore[CHAT_INPUT_DRAFT_KEY]).toBeUndefined();
    expect((screen.getByPlaceholderText('向 Knovana 提问…') as HTMLTextAreaElement).value).toBe('');
    expect(screen.getByText('让每一次阅读在此沉淀')).toBeTruthy();
  });
});
