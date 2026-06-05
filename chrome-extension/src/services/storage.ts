import type { PendingAction } from '../types/capture';
import type { ExtensionSettings } from '../types/settings';

const SETTINGS_KEY = 'knovana.settings';
const PENDING_ACTION_KEY = 'knovana.pendingAction';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  backendUrl: 'http://localhost:8000/api/v1',
  token: '',
  theme: 'system',
  autoOpenSidePanel: true,
};

async function getLocal<T>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as T | undefined;
}

async function setLocal<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

async function removeLocal(key: string): Promise<void> {
  await chrome.storage.local.remove(key);
}

export async function getSettings(): Promise<ExtensionSettings> {
  const settings = await getLocal<Partial<ExtensionSettings>>(SETTINGS_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    backendUrl: normalizeBackendUrl(settings?.backendUrl ?? DEFAULT_SETTINGS.backendUrl),
  };
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await setLocal<ExtensionSettings>(SETTINGS_KEY, {
    ...settings,
    backendUrl: normalizeBackendUrl(settings.backendUrl),
  });
}

export async function savePendingAction(action: PendingAction): Promise<void> {
  await setLocal<PendingAction>(PENDING_ACTION_KEY, action);
}

export async function consumePendingAction(): Promise<PendingAction | null> {
  const action = await getLocal<PendingAction>(PENDING_ACTION_KEY);
  await removeLocal(PENDING_ACTION_KEY);
  return action ?? null;
}

export function normalizeBackendUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed;
  }
  if (trimmed.endsWith('/api')) {
    return `${trimmed}/v1`;
  }
  return `${trimmed}/api/v1`;
}
