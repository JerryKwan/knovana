import type { PendingAction } from '../types/capture';
import type { ChatMessage } from '../types/chat';
import type { ExtensionSettings, ExtensionSurface } from '../types/settings';

const SETTINGS_KEY = 'knovana.settings';
const PENDING_ACTION_KEY = 'knovana.pendingAction';
const CURRENT_CHAT_SESSION_KEY = 'knovana.currentChatSessionId';
const CHAT_INPUT_DRAFT_KEY = 'knovana.chatInputDraft';
const POPOUT_BOUNDS_KEY = 'knovana.popoutBounds';
const APP_RUNTIME_STATE_KEY = 'knovana.appRuntimeState';

export interface PopoutBounds {
  width: number;
  height: number;
  left?: number;
  top?: number;
}

export interface AppRuntimeState {
  activeTab: 'chat' | 'knowledge' | 'history';
  pendingAction: PendingAction | null;
  captureOutput?: string;
  capturePath?: string;
  captureError?: string;
  captureRunning: boolean;
  captureRequestId?: string;
  messages: ChatMessage[];
  chatRunning: boolean;
  chatRequestId: string;
  activeAssistantId: string;
  currentSessionId?: string;
  selectedModel: string;
  updatedAt: number;
}

export const DEFAULT_POPOUT_BOUNDS: PopoutBounds = {
  width: 440,
  height: 720,
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  backendUrl: 'http://localhost:8000/api/v1',
  token: '',
  theme: 'system',
  autoOpenSidePanel: true,
  preferredOpenSurface: 'sidepanel',
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

function getSessionStorageArea(): chrome.storage.StorageArea {
  return (
    (chrome.storage as unknown as { session?: chrome.storage.StorageArea }).session ??
    chrome.storage.local
  );
}

async function getSession<T>(key: string): Promise<T | undefined> {
  const area = getSessionStorageArea();
  const result = await area.get(key);
  return result[key] as T | undefined;
}

async function setSession<T>(key: string, value: T): Promise<void> {
  await getSessionStorageArea().set({ [key]: value });
}

async function removeSession(key: string): Promise<void> {
  await getSessionStorageArea().remove(key);
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

export async function clearPendingAction(actionId?: string): Promise<void> {
  if (!actionId) {
    await removeLocal(PENDING_ACTION_KEY);
    return;
  }

  const action = await getLocal<PendingAction>(PENDING_ACTION_KEY);
  if (!action || action.id === actionId) {
    await removeLocal(PENDING_ACTION_KEY);
  }
}

export async function consumePendingAction(): Promise<PendingAction | null> {
  const action = await getLocal<PendingAction>(PENDING_ACTION_KEY);
  await removeLocal(PENDING_ACTION_KEY);
  return action ?? null;
}

export async function getCurrentChatSessionId(): Promise<string | undefined> {
  const sessionId = await getLocal<unknown>(CURRENT_CHAT_SESSION_KEY);
  return typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : undefined;
}

export async function saveCurrentChatSessionId(sessionId: string): Promise<void> {
  const nextSessionId = sessionId.trim();
  if (!nextSessionId) {
    await clearCurrentChatSessionId();
    return;
  }
  await setLocal<string>(CURRENT_CHAT_SESSION_KEY, nextSessionId);
}

export async function clearCurrentChatSessionId(): Promise<void> {
  await removeLocal(CURRENT_CHAT_SESSION_KEY);
}

export async function getChatInputDraft(): Promise<string> {
  const draft = await getLocal<unknown>(CHAT_INPUT_DRAFT_KEY);
  return typeof draft === 'string' ? draft : '';
}

export async function saveChatInputDraft(draft: string): Promise<void> {
  if (!draft) {
    await clearChatInputDraft();
    return;
  }
  await setLocal<string>(CHAT_INPUT_DRAFT_KEY, draft);
}

export async function clearChatInputDraft(): Promise<void> {
  await removeLocal(CHAT_INPUT_DRAFT_KEY);
}

export async function getPopoutBounds(): Promise<PopoutBounds> {
  const bounds = await getLocal<Partial<PopoutBounds>>(POPOUT_BOUNDS_KEY);
  return sanitizePopoutBounds(bounds);
}

export async function savePopoutBounds(bounds: PopoutBounds): Promise<void> {
  await setLocal<PopoutBounds>(POPOUT_BOUNDS_KEY, sanitizePopoutBounds(bounds));
}

export async function getAppRuntimeState(): Promise<AppRuntimeState | null> {
  return (await getSession<AppRuntimeState>(APP_RUNTIME_STATE_KEY)) ?? null;
}

export async function saveAppRuntimeState(state: AppRuntimeState): Promise<void> {
  await setSession<AppRuntimeState>(APP_RUNTIME_STATE_KEY, state);
}

export async function clearAppRuntimeState(): Promise<void> {
  await removeSession(APP_RUNTIME_STATE_KEY);
}

export function isExtensionSurface(value: unknown): value is ExtensionSurface {
  return value === 'sidepanel' || value === 'popout';
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

function sanitizePopoutBounds(bounds?: Partial<PopoutBounds>): PopoutBounds {
  const width = clampNumber(bounds?.width, 360, 900, DEFAULT_POPOUT_BOUNDS.width);
  const height = clampNumber(bounds?.height, 520, 1000, DEFAULT_POPOUT_BOUNDS.height);
  const left =
    typeof bounds?.left === 'number' && Number.isFinite(bounds.left) ? bounds.left : undefined;
  const top =
    typeof bounds?.top === 'number' && Number.isFinite(bounds.top) ? bounds.top : undefined;

  return {
    width,
    height,
    ...(left !== undefined ? { left } : {}),
    ...(top !== undefined ? { top } : {}),
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}
