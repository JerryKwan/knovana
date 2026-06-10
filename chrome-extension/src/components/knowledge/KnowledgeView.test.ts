import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeEntry } from '../../types/api';
import type { RuntimeMessage } from '../../types/message';
import KnowledgeView from './KnowledgeView.svelte';

const sendMessageMock = vi.fn();

function installChromeMock() {
  vi.stubGlobal('chrome', {
    runtime: {
      sendMessage: sendMessageMock,
    },
  });
}

function entry(id: string, title: string): KnowledgeEntry {
  return {
    id,
    title,
    summary: `${title} 摘要`,
    tags: ['demo'],
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T08:30:00Z',
  };
}

describe('KnowledgeView', () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
    installChromeMock();
  });

  it('appends additional knowledge pages without replacing the existing list', async () => {
    sendMessageMock.mockImplementation(async (message: RuntimeMessage) => {
      if (message.type !== 'GET_KNOWLEDGE') {
        return { ok: true, data: null };
      }

      const page = message.payload?.page ?? 1;
      return {
        ok: true,
        data: {
          entries:
            page === 1
              ? [entry('knowledge-first', '第一条知识')]
              : [entry('knowledge-second', '第二条知识')],
          total: 2,
          page,
          per_page: 20,
        },
      };
    });

    render(KnowledgeView);

    expect(await screen.findByText('第一条知识')).toBeTruthy();
    expect(sendMessageMock).toHaveBeenCalledWith({
      type: 'GET_KNOWLEDGE',
      payload: { page: 1 },
    });

    await fireEvent.click(screen.getByRole('button', { name: /加载更多/ }));

    expect(await screen.findByText('第二条知识')).toBeTruthy();
    expect(screen.getByText('第一条知识')).toBeTruthy();
    await waitFor(() =>
      expect(sendMessageMock).toHaveBeenCalledWith({
        type: 'GET_KNOWLEDGE',
        payload: { page: 2 },
      }),
    );
    expect(screen.getByText('已加载全部 2 条')).toBeTruthy();
  });
});
