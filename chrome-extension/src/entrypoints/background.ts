import { apiJson, apiStream } from '../services/api';
import {
  actionLabel,
  contextFromMenu,
  createPendingAction,
  prepareCaptureUploads,
} from '../services/capture';
import { generateCapturePrompt } from '../services/capture-prompt';
import {
  clearPendingAction,
  consumePendingAction,
  getPopoutBounds,
  getSettings,
  savePendingAction,
} from '../services/storage';
import type { CaptureAction, ActionContext, PageSnapshot, PendingAction } from '../types/capture';
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
  'generate-doc',
  'save-selection',
  'save-media',
  'extract-page',
]);

const activeAbortControllers = new Map<string, AbortController>();
const streamSurfaceTargets = new Map<string, string>();
let pendingActionConsumeInFlight = false;

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
    { id: 'extract-page', title: '整理整页正文为知识条目', contexts: ['page', 'frame'] },
    { id: 'generate-doc', title: '整理成知识条目', contexts: ['selection'] },
    { id: 'save-selection', title: '原样保存并标注', contexts: ['selection'] },
    { id: 'save-media', title: '保存媒体文件', contexts: ['image', 'video', 'audio'] },
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
  const openedSurfacePromise = maybeOpenPreferredSurface(tab.windowId);

  const snapshot = await getTabSnapshot(tab, action);
  const context = contextFromMenu(action, info, snapshot);

  let prepared: Awaited<ReturnType<typeof prepareCaptureUploads>>;
  try {
    prepared = await prepareCaptureUploads(action, context);
  } catch (error) {
    await openedSurfacePromise;
    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        func: notifyCapturePreparationFailed,
        args: [error instanceof Error ? error.stack || error.message : String(error)],
      })
      .catch(() => undefined);
    return;
  }
  const updatedContext = prepared.context;

  const initialPrompt = generateCapturePrompt(
    action,
    updatedContext,
    prepared.mediaLocalPath,
    prepared.imagesSection,
  );

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: injectCaptureOverlay,
    args: [initialPrompt, actionLabel(action), snapshot.pageTitle, action, updatedContext],
  });
  await openedSurfacePromise;
}

function notifyCapturePreparationFailed(message: string) {
  window.alert(`Knovana 捕获失败：${message}`);
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
    await notifyPendingActionAvailable(openedSurfaceId ?? getActiveSurface()?.surfaceId);
  }
}

async function handleRuntimeMessage(
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender,
): Promise<RuntimeResponse> {
  switch (message.type) {
    case 'GET_ACTIVE_CONTEXT': {
      const action = message.payload?.action as CaptureAction | undefined;
      return okResponse(await getActiveSnapshot(action));
    }

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
      if (canSurfaceConsumePendingAction(message.payload.surfaceId)) {
        await clearPendingAction(message.payload.actionId);
      }
      return okResponse(null);

    case 'CONSUME_PENDING_ACTION':
      if (canSurfaceConsumePendingAction(message.payload?.surfaceId)) {
        return okResponse(await consumePendingActionOnce());
      }
      return okResponse(null);

    case 'PENDING_ACTION_AVAILABLE':
      return okResponse(null);

    case 'CAPTURE_SUBMIT': {
      const { prompt, action, context } = message.payload;
      const pending: PendingAction = {
        id: crypto.randomUUID(),
        action,
        context,
        autoRun: true,
        customPrompt: prompt,
        createdAt: Date.now(),
      };

      await savePendingAction(pending);
      const sourceWindowId = sender.tab?.windowId;
      if (sourceWindowId !== undefined) {
        rememberBrowserWindow(sourceWindowId);
      }
      const targetWindowId = await getBrowserWindowId(sourceWindowId);
      const openedSurfaceId = await openPreferredSurface(targetWindowId);
      await notifyPendingActionAvailable(openedSurfaceId ?? getActiveSurface()?.surfaceId);
      return okResponse({ queued: true });
    }

    case 'CAPTURE_CANCEL':
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

async function getActiveSnapshot(action?: CaptureAction): Promise<PageSnapshot> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return emptySnapshot(tab);
  }
  return getTabSnapshot(tab, action);
}

async function getTabSnapshot(tab: chrome.tabs.Tab, action?: CaptureAction): Promise<PageSnapshot> {
  if (!tab.id || !isScriptableUrl(tab.url)) {
    return emptySnapshot(tab);
  }

  const sendCollectMessage = () => {
    return chrome.tabs.sendMessage(tab.id!, {
      type: 'COLLECT_PAGE_SNAPSHOT',
      payload: { action },
    });
  };

  try {
    const response = await sendCollectMessage();
    return response || emptySnapshot(tab);
  } catch {
    // If the message fails, the content script might not be injected yet
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-scripts/capture.js'],
      });
      // Try sending message again
      const response = await sendCollectMessage();
      return response || emptySnapshot(tab);
    } catch (injectError) {
      console.error('Failed to inject or communicate with content script:', injectError);
      return emptySnapshot(tab);
    }
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

async function consumePendingActionOnce(): Promise<PendingAction | null> {
  if (pendingActionConsumeInFlight) {
    return null;
  }

  pendingActionConsumeInFlight = true;
  try {
    return await consumePendingAction();
  } finally {
    pendingActionConsumeInFlight = false;
  }
}

function getNewestSurface(surface?: ExtensionSurface): RegisteredSurface | undefined {
  return Array.from(registeredSurfaces.values())
    .filter((item) => !surface || item.surface === surface)
    .sort((a, b) => b.registeredAt - a.registeredAt)[0];
}

function shouldSurfaceHandle(surfaceId: string): boolean {
  return !activeSurfaceId || activeSurfaceId === surfaceId;
}

function canSurfaceConsumePendingAction(surfaceId?: string): boolean {
  if (!surfaceId) {
    return true;
  }

  if (!registeredSurfaces.has(surfaceId)) {
    return shouldSurfaceHandle(surfaceId);
  }

  setActiveSurface(surfaceId);
  return true;
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

async function notifyPendingActionAvailable(targetSurfaceId?: string): Promise<void> {
  const message: RuntimeMessage = targetSurfaceId
    ? {
        type: 'PENDING_ACTION_AVAILABLE',
        targetSurfaceId,
      }
    : {
        type: 'PENDING_ACTION_AVAILABLE',
      };

  await chrome.runtime.sendMessage<RuntimeMessage>(message).catch(() => undefined);
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

function injectCaptureOverlay(
  initialPrompt: string,
  actionName: string,
  pageTitle: string,
  action: CaptureAction,
  context: ActionContext,
): void {
  const existing = document.getElementById('knovana-capture-overlay-host');
  if (existing) {
    existing.remove();
  }

  const host = document.createElement('div');
  host.id = 'knovana-capture-overlay-host';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '100vw';
  host.style.height = '100vh';
  host.style.pointerEvents = 'none';

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    .backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    }
    .backdrop.visible {
      opacity: 1;
    }
    .card {
      background: #FDFBF7;
      border: 1px solid rgba(138, 126, 109, 0.25);
      border-radius: 16px;
      width: 640px;
      max-width: 90%;
      max-height: 85vh;
      box-shadow: 0 24px 48px -12px rgba(45, 41, 35, 0.15), 0 8px 16px -8px rgba(45, 41, 35, 0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #3D3A35;
      transform: scale(0.95) translateY(10px);
      transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: auto;
    }
    .backdrop.visible .card {
      transform: scale(1) translateY(0);
    }
    
    .header {
      padding: 18px 24px;
      border-bottom: 1px solid rgba(138, 126, 109, 0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #FAF7F2;
      cursor: grab;
      user-select: none;
    }
    .header:active {
      cursor: grabbing;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%);
      border-radius: 6px;
      color: #FFFFFF;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }
    .logo-text {
      font-weight: 700;
      font-size: 16px;
      letter-spacing: -0.01em;
      color: #2D2B28;
    }
    .close-btn {
      background: transparent;
      border: 0;
      cursor: pointer;
      color: #8A7E6D;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border-radius: 50%;
      transition: background 200ms ease, color 200ms ease;
    }
    .close-btn:hover {
      background: rgba(138, 126, 109, 0.1);
      color: #3D3A35;
    }

    .content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
      flex: 1;
    }
    .meta-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .action-badge {
      background: #EFEBE4;
      color: #72634E;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid rgba(138, 126, 109, 0.15);
      font-size: 12px;
    }
    .source-title {
      color: #8A7E6D;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      flex: 1;
    }

    .prompt-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      font-weight: 600;
      color: #8A7E6D;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .prompt-textarea {
      width: 100%;
      height: 280px;
      padding: 16px;
      border: 1px solid rgba(138, 126, 109, 0.3);
      border-radius: 10px;
      background: #FFFFFF;
      color: #3D3A35;
      font-family: ui-monospace, SFMono-Regular, SF Pro Mono, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      line-height: 1.6;
      resize: vertical;
      outline: none;
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }
    .prompt-textarea:focus {
      border-color: #C5A880;
      box-shadow: 0 0 0 3px rgba(197, 168, 128, 0.15);
    }

    .footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(138, 126, 109, 0.15);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #FAF7F2;
    }
    .btn {
      font-size: 14px;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      border: 0;
      transition: all 200ms ease;
    }
    .btn-cancel {
      background: transparent;
      color: #8A7E6D;
      border: 1px solid rgba(138, 126, 109, 0.3);
    }
    .btn-cancel:hover {
      background: rgba(138, 126, 109, 0.08);
      color: #3D3A35;
    }
    .btn-send {
      background: #2D2B28;
      color: #FAF7F2;
      box-shadow: 0 4px 12px rgba(45, 43, 40, 0.15);
    }
    .btn-send:hover {
      background: #1C1B19;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(45, 43, 40, 0.2);
    }
    .btn-send:active {
      transform: translateY(0);
    }
  `;

  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'header';

  const brand = document.createElement('div');
  brand.className = 'brand-section';
  const logo = document.createElement('div');
  logo.className = 'logo';
  logo.textContent = 'K';
  const logoText = document.createElement('div');
  logoText.className = 'logo-text';
  logoText.textContent = 'Knovana';
  brand.appendChild(logo);
  brand.appendChild(logoText);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  header.appendChild(brand);
  header.appendChild(closeBtn);

  const content = document.createElement('div');
  content.className = 'content';

  const metaBar = document.createElement('div');
  metaBar.className = 'meta-bar';
  const badge = document.createElement('span');
  badge.className = 'action-badge';
  badge.textContent = actionName;
  const source = document.createElement('span');
  source.className = 'source-title';
  source.textContent = `来源: ${pageTitle}`;
  metaBar.appendChild(badge);
  metaBar.appendChild(source);

  const promptSection = document.createElement('div');
  promptSection.className = 'prompt-section';
  const labelRow = document.createElement('div');
  labelRow.className = 'label-row';
  labelRow.innerHTML = '<span>提示词预览 (可以直接编辑修改)</span>';
  const textarea = document.createElement('textarea');
  textarea.className = 'prompt-textarea';
  textarea.value = initialPrompt;
  textarea.spellcheck = false;

  promptSection.appendChild(labelRow);
  promptSection.appendChild(textarea);

  content.appendChild(metaBar);
  content.appendChild(promptSection);

  const footer = document.createElement('div');
  footer.className = 'footer';

  const btnCancel = document.createElement('button');
  btnCancel.type = 'button';
  btnCancel.className = 'btn btn-cancel';
  btnCancel.textContent = '取消';

  const btnSend = document.createElement('button');
  btnSend.type = 'button';
  btnSend.className = 'btn btn-send';
  btnSend.textContent = '发送并整理';

  footer.appendChild(btnCancel);
  footer.appendChild(btnSend);

  card.appendChild(header);
  card.appendChild(content);
  card.appendChild(footer);
  backdrop.appendChild(card);

  shadow.appendChild(style);
  shadow.appendChild(backdrop);
  document.body.appendChild(host);

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  header.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a'))
      return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = card.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    card.style.position = 'fixed';
    card.style.margin = '0';
    card.style.left = `${startLeft}px`;
    card.style.top = `${startTop}px`;
    card.style.transform = 'none';
    card.style.transition = 'none';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    e.preventDefault();
  });

  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newLeft = startLeft + dx;
    let newTop = startTop + dy;

    const cardWidth = card.offsetWidth;
    const cardHeight = card.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (newLeft < 0) newLeft = 0;
    if (newLeft + cardWidth > windowWidth) newLeft = windowWidth - cardWidth;
    if (newTop < 0) newTop = 0;
    if (newTop + cardHeight > windowHeight) newTop = windowHeight - cardHeight;

    card.style.left = `${newLeft}px`;
    card.style.top = `${newTop}px`;
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      card.style.transition = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  }

  requestAnimationFrame(() => {
    backdrop.classList.add('visible');
  });

  function removeOverlay() {
    backdrop.classList.remove('visible');
    card.style.transform = 'scale(0.95) translateY(10px)';

    setTimeout(() => {
      host.remove();
    }, 250);
  }

  function closeOverlay() {
    chrome.runtime.sendMessage({
      type: 'CAPTURE_CANCEL',
    });
    removeOverlay();
  }

  async function submitOverlay(finalPrompt: string) {
    const originalText = btnSend.textContent || '发送并整理';
    btnSend.disabled = true;
    btnSend.textContent = '发送中...';

    try {
      await sendOverlayMessage({
        type: 'CAPTURE_SUBMIT',
        payload: { prompt: finalPrompt, action, context },
      });
      removeOverlay();
    } catch (error) {
      btnSend.disabled = false;
      btnSend.textContent = originalText;
      window.alert(`发送失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function sendOverlayMessage(message: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          const lastError = chrome.runtime.lastError;
          if (lastError) {
            reject(new Error(lastError.message));
            return;
          }

          if (!response?.ok) {
            reject(new Error(response?.error ?? 'Knovana background service did not respond.'));
            return;
          }

          resolve(response.data);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  closeBtn.addEventListener('click', () => closeOverlay());
  btnCancel.addEventListener('click', () => closeOverlay());
  btnSend.addEventListener('click', () => {
    void submitOverlay(textarea.value);
  });

  let isMouseDownOnBackdrop = false;
  backdrop.addEventListener('mousedown', (e) => {
    isMouseDownOnBackdrop = e.target === backdrop;
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop && isMouseDownOnBackdrop) {
      closeOverlay();
    }
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeOverlay();
      window.removeEventListener('keydown', handleKeyDown);
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, 100);
}
