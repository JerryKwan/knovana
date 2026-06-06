import { apiJson, apiStream } from '../services/api';
import { collectPageSnapshot, contextFromMenu, createPendingAction } from '../services/capture';
import { consumePendingAction, getSettings, savePendingAction } from '../services/storage';
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

const MENU_ROOT_ID = 'knovana';
const CAPTURE_MENU_IDS = new Set<CaptureAction>([
  'summarize',
  'generate-doc',
  'save-selection',
  'save-image',
  'save-link',
  'save-page',
]);

const activeAbortControllers = new Map<string, AbortController>();

function abortChat(requestId: string): void {
  const controller = activeAbortControllers.get(requestId);
  if (controller) {
    controller.abort();
    activeAbortControllers.delete(requestId);
  }
}

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    void setupExtension();
  });

  chrome.runtime.onStartup.addListener(() => {
    void setupSidePanelBehavior();
  });

  chrome.action.onClicked.addListener((tab) => {
    if (tab.windowId !== undefined) {
      void openSidePanel(tab.windowId);
    }
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    void handleContextMenu(info, tab);
  });

  chrome.commands.onCommand.addListener((command) => {
    void handleCommand(command);
  });

  chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
    void handleRuntimeMessage(message)
      .then((response) => sendResponse(response))
      .catch((error: unknown) => sendResponse(errorResponse(error)));
    return true;
  });
});

async function setupExtension(): Promise<void> {
  await setupSidePanelBehavior();
  await createContextMenus();
}

async function setupSidePanelBehavior(): Promise<void> {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
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

  if (info.menuItemId === 'open-chat') {
    await openSidePanel(tab.windowId);
    return;
  }

  if (!CAPTURE_MENU_IDS.has(info.menuItemId as CaptureAction)) return;

  const action = info.menuItemId as CaptureAction;
  const snapshot = await getTabSnapshot(tab);
  const pending = createPendingAction(action, contextFromMenu(action, info, snapshot), true);

  await savePendingAction(pending);
  await maybeOpenSidePanel(tab.windowId);
  await broadcastPendingAction(pending);
}

async function handleCommand(command: string): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || tab.windowId === undefined) return;

  if (command === 'toggle-sidepanel') {
    await openSidePanel(tab.windowId);
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
    await maybeOpenSidePanel(tab.windowId);
    await broadcastPendingAction(pending);
  }
}

async function handleRuntimeMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
  switch (message.type) {
    case 'GET_ACTIVE_CONTEXT':
      return okResponse(await getActiveSnapshot());

    case 'CONSUME_PENDING_ACTION':
      return okResponse(await consumePendingAction());

    case 'START_CHAT':
      void streamChat(message.requestId, message.payload);
      return okResponse({ requestId: message.requestId });

    case 'REGENERATE_CHAT':
      void streamRegenerate(message.requestId, message.payload);
      return okResponse({ requestId: message.requestId });

    case 'ABORT_CHAT':
      abortChat(message.requestId);
      return okResponse(null);

    case 'START_CAPTURE':
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

async function openSidePanel(windowId: number): Promise<void> {
  await chrome.sidePanel.open({ windowId }).catch(() => undefined);
}

async function maybeOpenSidePanel(windowId: number): Promise<void> {
  const settings = await getSettings();
  if (settings.autoOpenSidePanel) {
    await openSidePanel(windowId);
  }
}

async function broadcastPendingAction(pending: PendingAction): Promise<void> {
  await chrome.runtime
    .sendMessage<RuntimeMessage>({
      type: 'PENDING_ACTION',
      payload: pending,
    })
    .catch(() => undefined);
}

async function sendStreamEvent(payload: ApiStreamEvent): Promise<void> {
  await chrome.runtime
    .sendMessage<RuntimeMessage>({
      type: 'STREAM_EVENT',
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
