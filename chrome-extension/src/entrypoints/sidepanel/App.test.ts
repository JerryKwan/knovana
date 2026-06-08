import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.svelte';

const CURRENT_CHAT_SESSION_KEY = 'knovana.currentChatSessionId';
const localStore: Record<string, unknown> = {};
const sendMessageMock = vi.fn();

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
    async (message: { type: string; payload?: { id: string } }) => {
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
            id: message.payload?.id,
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
    installChromeMock();
    installRuntimeResponses();
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'test-id'),
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

  it('clears the saved session id when starting a new chat', async () => {
    localStore[CURRENT_CHAT_SESSION_KEY] = 'session-1';

    render(App);

    await screen.findByText('关闭前的问题');
    await fireEvent.click(screen.getByTitle('新对话'));

    await waitFor(() => expect(localStore[CURRENT_CHAT_SESSION_KEY]).toBeUndefined());
    expect(screen.getByText('让每一次阅读在此沉淀')).toBeTruthy();
  });
});
