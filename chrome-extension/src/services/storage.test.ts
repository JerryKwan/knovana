import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PendingAction } from '../types/capture';
import {
  DEFAULT_SETTINGS,
  consumePendingAction,
  getSettings,
  normalizeBackendUrl,
  savePendingAction,
  saveSettings,
} from './storage';

const localStore: Record<string, unknown> = {};

function installChromeStorageMock() {
  vi.stubGlobal('chrome', {
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

describe('storage service', () => {
  beforeEach(() => {
    for (const key of Object.keys(localStore)) {
      delete localStore[key];
    }
    installChromeStorageMock();
  });

  it('normalizes backend URLs to the API root', () => {
    expect(normalizeBackendUrl(' http://localhost:8000/ ')).toBe('http://localhost:8000/api');
    expect(normalizeBackendUrl('https://api.knovana.com/api/')).toBe('https://api.knovana.com/api');
  });

  it('returns defaults when settings have not been saved', async () => {
    await expect(getSettings()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it('persists normalized settings', async () => {
    await saveSettings({
      backendUrl: 'http://127.0.0.1:8787/',
      token: 'test-token',
      theme: 'dark',
      autoOpenSidePanel: false,
    });

    await expect(getSettings()).resolves.toEqual({
      backendUrl: 'http://127.0.0.1:8787/api',
      token: 'test-token',
      theme: 'dark',
      autoOpenSidePanel: false,
    });
  });

  it('consumes pending actions once', async () => {
    const pending: PendingAction = {
      id: 'pending-1',
      action: 'save-selection',
      autoRun: true,
      createdAt: 1,
      context: {
        action: 'save-selection',
        pageUrl: 'https://example.com/article',
        pageTitle: 'Example',
        selectedImages: [],
        selectedText: 'Important text',
      },
    };

    await savePendingAction(pending);

    await expect(consumePendingAction()).resolves.toEqual(pending);
    await expect(consumePendingAction()).resolves.toBeNull();
  });
});
