import { apiJson, apiStream } from '../services/api';
import { collectPageSnapshot, contextFromMenu, createPendingAction } from '../services/capture';
import {
  clearPendingAction,
  consumePendingAction,
  getPopoutBounds,
  getSettings,
  savePendingAction,
} from '../services/storage';
import type {
  CaptureAction,
  CaptureRequestBody,
  PageSnapshot,
  PendingAction,
} from '../types/capture';
import type {
  ApiStreamEvent,
  ChatRequestBody,
  KnowledgeDetail,
  KnowledgeListResponse,
  SearchResponse,
} from '../types/api';
import type { RuntimeMessage, RuntimeResponse } from '../types/message';
import type { ExtensionSurface } from '../types/settings';

const MENU_ROOT_ID = 'knovana';
const SETTINGS_STORAGE_KEY = 'knovana.settings';
const POPOUT_PAGE = 'popout.html';
const CAPTURE_MENU_IDS = new Set<CaptureAction>([
  'summarize',
  'generate-doc',
  'save-selection',
  'save-image',
  'save-link',
  'save-page',
]);

const activeAbortControllers = new Map<string, AbortController>();
const streamSurfaceTargets = new Map<string, string>();

interface RegisteredSurface {
  surfaceId: string;
  surface: ExtensionSurface;
  windowId?: number;
  registeredAt: number;
}

const registeredSurfaces = new Map<string, RegisteredSurface>();
let activeSurfaceId: string | undefined;
let popoutWindowId: number | undefined;
let lastBrowserWindowId: number | undefined;
let cachedPreferredSurface: ExtensionSurface = 'sidepanel';
let cachedAutoOpenAfterAction = true;
let closePopoutAfterSidepanelRegisters = false;

function abortChat(requestId: string): void {
  const controller = activeAbortControllers.get(requestId);
  if (controller) {
    controller.abort();
    activeAbortControllers.delete(requestId);
  }
}

export default defineBackground(() => {
  void refreshActionOpenBehavior();

  chrome.runtime.onInstalled.addListener(() => {
    void setupExtension();
  });

  chrome.runtime.onStartup.addListener(() => {
    void refreshActionOpenBehavior();
  });

  chrome.action.onClicked.addListener((tab) => {
    if (tab.windowId !== undefined) {
      rememberBrowserWindow(tab.windowId);
      void openSurface(cachedPreferredSurface, tab.windowId);
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && SETTINGS_STORAGE_KEY in changes) {
      void refreshActionOpenBehavior();
    }
  });

  chrome.windows.onRemoved.addListener((windowId) => {
    handleWindowRemoved(windowId);
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    void handleContextMenu(info, tab);
  });

  chrome.commands.onCommand.addListener((command) => {
    void handleCommand(command);
  });

  chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
    void handleRuntimeMessage(message, sender)
      .then((response) => sendResponse(response))
      .catch((error: unknown) => sendResponse(errorResponse(error)));
    return true;
  });
});

async function setupExtension(): Promise<void> {
  await refreshActionOpenBehavior();
  await createContextMenus();
}

async function refreshActionOpenBehavior(): Promise<void> {
  const settings = await getSettings();
  cachedPreferredSurface = settings.preferredOpenSurface;
  cachedAutoOpenAfterAction = settings.autoOpenSidePanel;

  await chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: cachedPreferredSurface === 'sidepanel' })
    .catch((error: unknown) => {
      console.warn('Failed to update Knovana action click behavior', error);
    });
}

async function createContextMenus(): Promise<void> {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: MENU_ROOT_ID,
    title: 'Knovana',
    contexts: ['all'],
  });

  const menus: Array<chrome.contextMenus.CreateProperties & { id: CaptureAction | 'open-chat' }> = [
    { id: 'summarize', title: '生成摘要', contexts: ['selection'] },
    { id: 'generate-doc', title: '生成知识文档', contexts: ['selection'] },
    { id: 'save-selection', title: '保存选区', contexts: ['selection'] },
    { id: 'save-image', title: '保存图片', contexts: ['image'] },
    { id: 'save-link', title: '保存链接', contexts: ['link'] },
    { id: 'save-page', title: '保存当前页面', contexts: ['page'] },
    { id: 'open-chat', title: '打开 Knovana', contexts: ['all'] },
  ];

  for (const menu of menus) {
    chrome.contextMenus.create({
      ...menu,
      parentId: MENU_ROOT_ID,
    });
  }
}

async function handleContextMenu(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
): Promise<void> {
  if (!tab?.id || tab.windowId === undefined) return;
  rememberBrowserWindow(tab.windowId);

  if (info.menuItemId === 'open-chat') {
    await openPreferredSurface(tab.windowId);
    return;
  }

  if (!CAPTURE_MENU_IDS.has(info.menuItemId as CaptureAction)) return;

  const action = info.menuItemId as CaptureAction;
  const snapshot = await getTabSnapshot(tab);
  const pending = createPendingAction(action, contextFromMenu(action, info, snapshot), true);

  await savePendingAction(pending);
  const openedSurfaceId = await maybeOpenPreferredSurface(tab.windowId);
  await broadcastPendingAction(pending, openedSurfaceId ?? getActiveSurface()?.surfaceId);
}

async function handleCommand(command: string): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || tab.windowId === undefined) return;
  rememberBrowserWindow(tab.windowId);

  if (command === 'toggle-sidepanel') {
    await openPreferredSurface(tab.windowId);
    return;
  }

  if (command === 'quick-capture') {
    const snapshot = await getTabSnapshot(tab);
    const pending = createPendingAction(
      'save-selection',
      {
        ...snapshot,
        action: 'save-selection',
      },
      true,
    );
    await savePendingAction(pending);
    const openedSurfaceId = await maybeOpenPreferredSurface(tab.windowId);
    await broadcastPendingAction(pending, openedSurfaceId ?? getActiveSurface()?.surfaceId);
  }
}

async function handleRuntimeMessage(
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender,
): Promise<RuntimeResponse> {
  switch (message.type) {
    case 'GET_ACTIVE_CONTEXT':
      return okResponse(await getActiveSnapshot());

    case 'GET_TARGET_WINDOW_ID':
      return okResponse(await getBrowserWindowId(sender.tab?.windowId));

    case 'REGISTER_SURFACE':
      return okResponse(registerSurface(message.payload, sender));

    case 'UNREGISTER_SURFACE':
      unregisterSurface(message.payload.surfaceId);
      return okResponse(null);

    case 'SWITCH_SURFACE':
      await switchSurface(message.payload.target, sender, message.payload.sourceSurfaceId);
      return okResponse(null);

    case 'ACK_PENDING_ACTION':
      if (shouldSurfaceHandle(message.payload.surfaceId)) {
        await clearPendingAction(message.payload.actionId);
      }
      return okResponse(null);

    case 'CONSUME_PENDING_ACTION':
      if (!message.payload?.surfaceId || shouldSurfaceHandle(message.payload.surfaceId)) {
        return okResponse(await consumePendingAction());
      }
      return okResponse(null);

    case 'START_CHAT':
      streamSurfaceTargets.set(message.requestId, resolveMessageSurfaceId(message.surfaceId));
      void streamChat(message.requestId, message.payload);
      return okResponse({ requestId: message.requestId });

    case 'REGENERATE_CHAT':
      streamSurfaceTargets.set(message.requestId, resolveMessageSurfaceId(message.surfaceId));
      void streamRegenerate(message.requestId, message.payload);
      return okResponse({ requestId: message.requestId });

    case 'ABORT_CHAT':
      abortChat(message.requestId);
      return okResponse(null);

    case 'START_CAPTURE':
      streamSurfaceTargets.set(message.requestId, resolveMessageSurfaceId(message.surfaceId));
      void streamCapture(message.requestId, message.payload);
      return okResponse({ requestId: message.requestId });

    case 'GET_KNOWLEDGE':
      return okResponse(
        await apiJson<KnowledgeListResponse>(
          buildKnowledgeListPath(message.payload?.page, message.payload?.tags),
        ),
      );

    case 'GET_KNOWLEDGE_DETAIL':
      return okResponse(
        await apiJson<KnowledgeDetail>(`/knowledge/${encodeURIComponent(message.payload.id)}`),
      );

    case 'DELETE_KNOWLEDGE':
      return okResponse(
        await apiJson<{ status: string }>(`/knowledge/${encodeURIComponent(message.payload.id)}`, {
          method: 'DELETE',
        }),
      );

    case 'SEARCH_KNOWLEDGE':
      return okResponse(
        await apiJson<SearchResponse>(`/search?q=${encodeURIComponent(message.payload.query)}`),
      );

    case 'GET_SESSIONS': {
      const page = message.payload?.page ?? 1;
      const perPage = message.payload?.per_page ?? 20;
      return okResponse(await apiJson(`/chat/sessions?page=${page}&per_page=${perPage}`));
    }

    case 'GET_SESSION_DETAIL':
      return okResponse(await apiJson(`/chat/sessions/${encodeURIComponent(message.payload.id)}`));

    case 'DELETE_SESSION':
      return okResponse(
        await apiJson(`/chat/sessions/${encodeURIComponent(message.payload.id)}`, {
          method: 'DELETE',
        }),
      );

    case 'DELETE_MESSAGE':
      return okResponse(
        await apiJson(
          `/chat/sessions/${encodeURIComponent(message.payload.sessionId)}/messages/${encodeURIComponent(message.payload.messageId)}`,
          { method: 'DELETE' },
        ),
      );

    case 'OPEN_OPTIONS':
      await chrome.runtime.openOptionsPage();
      return okResponse(null);

    default:
      return errorResponse(
        `Unsupported message: ${(message as { type?: string }).type ?? 'unknown'}`,
      );
  }
}

async function streamChat(requestId: string, payload: ChatRequestBody): Promise<void> {
  await sendStreamEvent({ requestId, stream: 'chat', status: 'start' });

  const controller = new AbortController();
  activeAbortControllers.set(requestId, controller);

  try {
    await apiStream(
      '/chat',
      payload,
      async ({ raw, json }) => {
        let sessionId: string | undefined;
        if (typeof json === 'object' && json !== null) {
          const obj = json as Record<string, unknown>;
          if ('error' in obj) {
            const errObj = obj.error as Record<string, unknown> | undefined;
            throw new Error(errObj?.message ? String(errObj.message) : 'Server streaming failed');
          }

          const sessionVal = obj.sessionId || obj.session_id;
          if (sessionVal) {
            sessionId = String(sessionVal);
          }

          await sendStreamEvent({
            requestId,
            stream: 'chat',
            status: 'chunk',
            sessionId,
            pspEvent: obj,
          });
        } else {
          await sendStreamEvent({
            requestId,
            stream: 'chat',
            status: 'chunk',
            content: raw,
          });
        }
      },
      controller.signal,
    );
    await sendStreamEvent({ requestId, stream: 'chat', status: 'done' });
  } catch (error) {
    const isAbort =
      (error instanceof Error && error.name === 'AbortError') ||
      String(error).includes('AbortError') ||
      String(error).includes('aborted') ||
      String(error).includes('Abort');

    if (isAbort) {
      await sendStreamEvent({ requestId, stream: 'chat', status: 'done' });
    } else {
      await sendStreamEvent({
        requestId,
        stream: 'chat',
        status: 'error',
        error: getErrorMessage(error),
      });
    }
  } finally {
    activeAbortControllers.delete(requestId);
    streamSurfaceTargets.delete(requestId);
  }
}

async function streamRegenerate(requestId: string, payload: { session_id: string }): Promise<void> {
  await sendStreamEvent({ requestId, stream: 'chat', status: 'start' });

  const controller = new AbortController();
  activeAbortControllers.set(requestId, controller);

  try {
    await apiStream(
      '/chat/regenerate',
      payload,
      async ({ raw, json }) => {
        let sessionId: string | undefined;
        if (typeof json === 'object' && json !== null) {
          const obj = json as Record<string, unknown>;
          if ('error' in obj) {
            const errObj = obj.error as Record<string, unknown> | undefined;
            throw new Error(errObj?.message ? String(errObj.message) : 'Server streaming failed');
          }

          const sessionVal = obj.sessionId || obj.session_id;
          if (sessionVal) {
            sessionId = String(sessionVal);
          }

          await sendStreamEvent({
            requestId,
            stream: 'chat',
            status: 'chunk',
            sessionId,
            pspEvent: obj,
          });
        } else {
          await sendStreamEvent({
            requestId,
            stream: 'chat',
            status: 'chunk',
            content: raw,
          });
        }
      },
      controller.signal,
    );
    await sendStreamEvent({ requestId, stream: 'chat', status: 'done' });
  } catch (error) {
    const isAbort =
      (error instanceof Error && error.name === 'AbortError') ||
      String(error).includes('AbortError') ||
      String(error).includes('aborted') ||
      String(error).includes('Abort');

    if (isAbort) {
      await sendStreamEvent({ requestId, stream: 'chat', status: 'done' });
    } else {
      await sendStreamEvent({
        requestId,
        stream: 'chat',
        status: 'error',
        error: getErrorMessage(error),
      });
    }
  } finally {
    activeAbortControllers.delete(requestId);
    streamSurfaceTargets.delete(requestId);
  }
}

async function streamCapture(requestId: string, payload: CaptureRequestBody): Promise<void> {
  await sendStreamEvent({ requestId, stream: 'capture', status: 'start' });

  try {
    await apiStream('/capture', payload, async ({ raw, json }) => {
      if (isRecord(json) && json.type === 'action') {
        await sendStreamEvent({
          requestId,
          stream: 'capture',
          status: 'action',
          action: typeof json.action === 'string' ? json.action : undefined,
          path: typeof json.path === 'string' ? json.path : undefined,
        });
        return;
      }

      if (isRecord(json) && json.type === 'error') {
        await sendStreamEvent({
          requestId,
          stream: 'capture',
          status: 'error',
          error: typeof json.message === 'string' ? json.message : raw,
        });
        return;
      }

      const content = isRecord(json) && typeof json.content === 'string' ? json.content : raw;
      await sendStreamEvent({ requestId, stream: 'capture', status: 'chunk', content });
    });
    await sendStreamEvent({ requestId, stream: 'capture', status: 'done' });
  } catch (error) {
    await sendStreamEvent({
      requestId,
      stream: 'capture',
      status: 'error',
      error: getErrorMessage(error),
    });
  } finally {
    streamSurfaceTargets.delete(requestId);
  }
}

async function getActiveSnapshot(): Promise<PageSnapshot> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return emptySnapshot();
  }
  return getTabSnapshot(tab);
}

async function getTabSnapshot(tab: chrome.tabs.Tab): Promise<PageSnapshot> {
  if (!tab.id || !isScriptableUrl(tab.url)) {
    return emptySnapshot(tab);
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectPageSnapshot,
    });
    return result?.result ?? emptySnapshot(tab);
  } catch {
    return emptySnapshot(tab);
  }
}

function emptySnapshot(tab?: chrome.tabs.Tab): PageSnapshot {
  return {
    pageUrl: tab?.url ?? '',
    pageTitle: tab?.title ?? 'Untitled page',
    selectedImages: [],
  };
}

function isScriptableUrl(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

function registerSurface(
  payload: { surface: ExtensionSurface; surfaceId: string },
  sender: chrome.runtime.MessageSender,
): { activeSurfaceId: string } {
  const windowId = sender.tab?.windowId;
  registeredSurfaces.set(payload.surfaceId, {
    ...payload,
    windowId,
    registeredAt: Date.now(),
  });
  setActiveSurface(payload.surfaceId);

  if (payload.surface === 'popout' && windowId !== undefined) {
    popoutWindowId = windowId;
  }

  if (payload.surface === 'sidepanel' && closePopoutAfterSidepanelRegisters) {
    closePopoutAfterSidepanelRegisters = false;
    if (streamSurfaceTargets.size === 0) {
      void closePopoutWindow();
    }
  }

  return { activeSurfaceId: payload.surfaceId };
}

function setActiveSurface(surfaceId: string): void {
  const previousSurfaceId = activeSurfaceId;
  activeSurfaceId = surfaceId;

  if (!previousSurfaceId || previousSurfaceId === surfaceId) {
    return;
  }

  for (const [requestId, targetSurfaceId] of streamSurfaceTargets.entries()) {
    if (targetSurfaceId === previousSurfaceId) {
      streamSurfaceTargets.set(requestId, surfaceId);
    }
  }
}

function unregisterSurface(surfaceId: string): void {
  const surface = registeredSurfaces.get(surfaceId);
  registeredSurfaces.delete(surfaceId);

  if (surface?.surface === 'popout' && surface.windowId === popoutWindowId) {
    popoutWindowId = undefined;
  }

  if (activeSurfaceId === surfaceId) {
    activeSurfaceId = getNewestSurface()?.surfaceId;
  }
}

function getActiveSurface(): RegisteredSurface | undefined {
  return activeSurfaceId ? registeredSurfaces.get(activeSurfaceId) : undefined;
}

function getNewestSurface(surface?: ExtensionSurface): RegisteredSurface | undefined {
  return Array.from(registeredSurfaces.values())
    .filter((item) => !surface || item.surface === surface)
    .sort((a, b) => b.registeredAt - a.registeredAt)[0];
}

function shouldSurfaceHandle(surfaceId: string): boolean {
  return !activeSurfaceId || activeSurfaceId === surfaceId;
}

function resolveMessageSurfaceId(surfaceId?: string): string {
  if (surfaceId) {
    setActiveSurface(surfaceId);
    return surfaceId;
  }
  return getActiveSurface()?.surfaceId ?? '';
}

function rememberBrowserWindow(windowId: number): void {
  lastBrowserWindowId = windowId;
}

function handleWindowRemoved(windowId: number): void {
  if (windowId !== popoutWindowId) return;

  const activeWasPopout = getActiveSurface()?.surface === 'popout';
  popoutWindowId = undefined;
  for (const surface of registeredSurfaces.values()) {
    if (surface.surface === 'popout') {
      registeredSurfaces.delete(surface.surfaceId);
    }
  }
  if (activeWasPopout) {
    activeSurfaceId = getNewestSurface()?.surfaceId;
  }
}

async function openPreferredSurface(windowId?: number): Promise<string | undefined> {
  return openSurface(cachedPreferredSurface, windowId);
}

async function maybeOpenPreferredSurface(windowId?: number): Promise<string | undefined> {
  if (!cachedAutoOpenAfterAction) {
    return getActiveSurface()?.surfaceId;
  }
  return openSurface(cachedPreferredSurface, windowId);
}

async function switchSurface(
  target: ExtensionSurface,
  sender: chrome.runtime.MessageSender,
  sourceSurfaceId: string,
): Promise<void> {
  const source = registeredSurfaces.get(sourceSurfaceId);
  const windowId = await getBrowserWindowId(source?.windowId ?? sender.tab?.windowId);

  await openSurface(target, windowId);

  if (target === 'sidepanel') {
    closePopoutAfterSidepanelRegisters = streamSurfaceTargets.size === 0;
    if (closePopoutAfterSidepanelRegisters && getNewestSurface('sidepanel')) {
      closePopoutAfterSidepanelRegisters = false;
      await closePopoutWindow();
    }
  } else if (windowId !== undefined && streamSurfaceTargets.size === 0) {
    await closeSidePanel(windowId);
  }
}

async function openSurface(
  surface: ExtensionSurface,
  windowId?: number,
): Promise<string | undefined> {
  if (surface === 'popout') {
    return openPopout(windowId);
  }
  return openSidePanel(windowId);
}

async function openSidePanel(windowId?: number): Promise<string | undefined> {
  if (windowId !== undefined && windowId !== popoutWindowId) {
    rememberBrowserWindow(windowId);
    await chrome.sidePanel.open({ windowId }).catch((error: unknown) => {
      console.warn('Failed to open Knovana side panel', error);
    });

    const surface = getNewestSurface('sidepanel');
    if (surface) {
      setActiveSurface(surface.surfaceId);
    }
    return surface?.surfaceId;
  }

  const targetWindowId = await getBrowserWindowId(windowId);
  if (targetWindowId === undefined) {
    return undefined;
  }

  rememberBrowserWindow(targetWindowId);
  await chrome.sidePanel.open({ windowId: targetWindowId }).catch((error: unknown) => {
    console.warn('Failed to open Knovana side panel', error);
  });

  const surface = getNewestSurface('sidepanel');
  if (surface) {
    setActiveSurface(surface.surfaceId);
  }
  return surface?.surfaceId;
}

async function openPopout(windowId?: number): Promise<string | undefined> {
  const currentPopout = popoutWindowId;
  if (currentPopout !== undefined) {
    try {
      await chrome.windows.update(currentPopout, { focused: true });
      const surface = getNewestSurface('popout');
      if (surface) {
        setActiveSurface(surface.surfaceId);
      }
      return surface?.surfaceId;
    } catch {
      popoutWindowId = undefined;
    }
  }

  const targetBrowserWindowId = await getBrowserWindowId(windowId);
  const bounds = await getPopoutCreateBounds(targetBrowserWindowId);
  const popoutUrl = buildPopoutUrl(targetBrowserWindowId);
  const win = await chrome.windows.create({
    type: 'popup',
    url: popoutUrl,
    focused: true,
    ...bounds,
  });
  popoutWindowId = win?.id;

  return undefined;
}

function buildPopoutUrl(targetBrowserWindowId?: number): string {
  const url = chrome.runtime.getURL(POPOUT_PAGE);
  if (targetBrowserWindowId === undefined) {
    return url;
  }
  return `${url}?windowId=${encodeURIComponent(String(targetBrowserWindowId))}`;
}

async function getPopoutCreateBounds(windowId?: number): Promise<chrome.windows.CreateData> {
  const bounds = await getPopoutBounds();
  const browserWindow = await getBrowserWindow(windowId);
  const fallbackLeft =
    browserWindow?.left !== undefined && browserWindow.width !== undefined
      ? browserWindow.left + Math.max(24, browserWindow.width - bounds.width - 32)
      : undefined;
  const fallbackTop = browserWindow?.top !== undefined ? browserWindow.top + 72 : undefined;

  return {
    width: bounds.width,
    height: bounds.height,
    left: bounds.left ?? fallbackLeft,
    top: bounds.top ?? fallbackTop,
  };
}

async function getBrowserWindow(windowId?: number): Promise<chrome.windows.Window | undefined> {
  const targetWindowId = await getBrowserWindowId(windowId);
  if (targetWindowId === undefined) return undefined;

  return chrome.windows.get(targetWindowId).catch(() => undefined);
}

async function getBrowserWindowId(preferredWindowId?: number): Promise<number | undefined> {
  if (preferredWindowId !== undefined && preferredWindowId !== popoutWindowId) {
    rememberBrowserWindow(preferredWindowId);
    return preferredWindowId;
  }
  if (lastBrowserWindowId !== undefined) {
    return lastBrowserWindowId;
  }

  const windows = await chrome.windows.getAll({ windowTypes: ['normal'] }).catch(() => []);
  const windowId = windows[0]?.id;
  if (windowId !== undefined) {
    rememberBrowserWindow(windowId);
  }
  return windowId;
}

async function closePopoutWindow(): Promise<void> {
  const windowId = popoutWindowId;
  if (windowId === undefined) return;

  await chrome.windows.remove(windowId).catch(() => undefined);
  popoutWindowId = undefined;
}

async function closeSidePanel(windowId: number): Promise<void> {
  const sidePanelApi = chrome.sidePanel as unknown as {
    close?: (options?: { windowId?: number }) => Promise<void>;
  };
  if (sidePanelApi.close) {
    await sidePanelApi.close({ windowId }).catch(() => undefined);
  }
}

async function broadcastPendingAction(
  pending: PendingAction,
  targetSurfaceId?: string,
): Promise<void> {
  if (!targetSurfaceId) return;

  await chrome.runtime
    .sendMessage<RuntimeMessage>({
      type: 'PENDING_ACTION',
      targetSurfaceId,
      payload: pending,
    })
    .catch(() => undefined);
}

async function sendStreamEvent(payload: ApiStreamEvent): Promise<void> {
  const targetSurfaceId = streamSurfaceTargets.get(payload.requestId);
  await chrome.runtime
    .sendMessage<RuntimeMessage>({
      type: 'STREAM_EVENT',
      targetSurfaceId,
      payload,
    })
    .catch(() => undefined);
}

function buildKnowledgeListPath(page = 1, tags?: string[]): string {
  const params = new URLSearchParams({ page: String(page), per_page: '20', sort: 'updated_at' });
  if (tags?.length) {
    params.set('tags', tags.join(','));
  }
  return `/knowledge?${params.toString()}`;
}

function okResponse<T>(data: T): RuntimeResponse<T> {
  return { ok: true, data };
}

function errorResponse(error: unknown): RuntimeResponse {
  return { ok: false, error: getErrorMessage(error) };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
