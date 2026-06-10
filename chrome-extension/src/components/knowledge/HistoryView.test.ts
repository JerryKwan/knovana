import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatSessionSummary } from '../../types/api';
import type { RuntimeMessage } from '../../types/message';
import HistoryView from './HistoryView.svelte';

const sendMessageMock = vi.fn();

function installChromeMock() {
  vi.stubGlobal('chrome', {
    runtime: {
      sendMessage: sendMessageMock,
    },
  });
}

function session(id: string, title: string): ChatSessionSummary {
  return {
    id,
    title,
    message_count: 2,
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T08:30:00Z',
  };
}

describe('HistoryView', () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
    installChromeMock();
  });

  it('appends additional session pages without replacing the existing list', async () => {
    sendMessageMock.mockImplementation(async (message: RuntimeMessage) => {
      if (message.type !== 'GET_SESSIONS') {
        return { ok: true, data: null };
      }

      const page = message.payload?.page ?? 1;
      return {
        ok: true,
        data: {
          sessions:
            page === 1
              ? [session('session-first', '第一页会话')]
              : [session('session-second', '第二页会话')],
          total: 2,
          page,
        },
      };
    });

    render(HistoryView);

    expect(await screen.findByText('第一页会话')).toBeTruthy();
    expect(sendMessageMock).toHaveBeenCalledWith({
      type: 'GET_SESSIONS',
      payload: { page: 1, per_page: 20 },
    });

    await fireEvent.click(screen.getByRole('button', { name: /加载更多/ }));

    expect(await screen.findByText('第二页会话')).toBeTruthy();
    expect(screen.getByText('第一页会话')).toBeTruthy();
    await waitFor(() =>
      expect(sendMessageMock).toHaveBeenCalledWith({
        type: 'GET_SESSIONS',
        payload: { page: 2, per_page: 20 },
      }),
    );
    expect(screen.getByText('已加载全部 2 条')).toBeTruthy();
  });
});
