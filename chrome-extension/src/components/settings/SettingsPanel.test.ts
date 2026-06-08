import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsPanel from './SettingsPanel.svelte';

const localStore: Record<string, unknown> = {};

function installChromeStorageMock() {
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: localStore[key] })),
        set: vi.fn(async (values: Record<string, unknown>) => {
          Object.assign(localStore, values);
        }),
      },
    },
  });
}

describe('SettingsPanel', () => {
  beforeEach(() => {
    for (const key of Object.keys(localStore)) {
      delete localStore[key];
    }
    document.documentElement.removeAttribute('data-theme');
    installChromeStorageMock();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('persists normalized settings and reports the saved value', async () => {
    const onSaved = vi.fn();
    render(SettingsPanel, { props: { onSaved } });

    const backendInput = await screen.findByLabelText('API 地址');
    const tokenInput = screen.getByLabelText('访问凭据');
    await waitFor(() => {
      expect((backendInput as HTMLInputElement).value).toBe('http://localhost:8000/api/v1');
      expect((backendInput as HTMLInputElement).disabled).toBe(false);
    });

    await fireEvent.input(backendInput, { target: { value: 'http://127.0.0.1:8787/' } });
    await fireEvent.input(tokenInput, { target: { value: 'test-token' } });
    await fireEvent.click(screen.getByRole('radio', { name: '深色' }));
    await fireEvent.click(screen.getByRole('radio', { name: '独立窗口' }));
    await fireEvent.click(screen.getByRole('checkbox', { name: '右键动作后自动打开 Knovana' }));
    await fireEvent.click(screen.getByRole('button', { name: '保存设置' }));

    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith({
        backendUrl: 'http://127.0.0.1:8787/api/v1',
        token: 'test-token',
        theme: 'dark',
        autoOpenSidePanel: false,
        preferredOpenSurface: 'popout',
      }),
    );
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByText('已保存')).toBeTruthy();
  });

  it('tests the normalized backend URL with the configured token', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    render(SettingsPanel);

    const backendInput = await screen.findByLabelText('API 地址');
    const tokenInput = screen.getByLabelText('访问凭据');
    await waitFor(() => {
      expect((backendInput as HTMLInputElement).value).toBe('http://localhost:8000/api/v1');
      expect((backendInput as HTMLInputElement).disabled).toBe(false);
    });

    await fireEvent.input(backendInput, { target: { value: 'http://localhost:9000' } });
    await fireEvent.input(tokenInput, { target: { value: 'abc' } });
    await fireEvent.click(screen.getByRole('button', { name: '测试连接' }));

    await waitFor(() => expect(screen.getByText('连接成功')).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:9000/api/v1/knowledge/stats',
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Headers }];
    expect(init.headers.get('Authorization')).toBe('Bearer abc');
  });
});
