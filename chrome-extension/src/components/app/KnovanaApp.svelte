<script lang="ts">
  import {
    BookOpen,
    ChevronLeft,
    ExternalLink,
    MessageCircle,
    Settings,
    SquarePen,
    History,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import CapturePreview from '../capture/CapturePreview.svelte';
  import ChatView from '../chat/ChatView.svelte';
  import InputBar from '../chat/InputBar.svelte';
  import KnowledgeView from '../knowledge/KnowledgeView.svelte';
  import HistoryView from '../knowledge/HistoryView.svelte';
  import SettingsPanel from '../settings/SettingsPanel.svelte';
  import { buildCaptureRequest } from '../../services/capture';
  import { sendRuntimeMessage } from '../../services/messaging';
  import {
    clearAppRuntimeState,
    clearChatInputDraft,
    clearCurrentChatSessionId,
    getAppRuntimeState,
    getChatInputDraft,
    getCurrentChatSessionId,
    getSettings,
    saveAppRuntimeState,
    saveChatInputDraft,
    saveCurrentChatSessionId,
    savePopoutBounds,
  } from '../../services/storage';
  import { applyThemePreference } from '../../services/theme';
  import type { AppRuntimeState, PopoutBounds } from '../../services/storage';
  import type { ApiStreamEvent } from '../../types/api';
  import type { ChatMessage } from '../../types/chat';
  import type { ActionContext, PageSnapshot, PendingAction } from '../../types/capture';
  import type { RuntimeMessage, SurfaceRegistrationResponse } from '../../types/message';
  import type { ExtensionSettings, ExtensionSurface } from '../../types/settings';

  type Tab = 'chat' | 'knowledge' | 'history';

  export let surface: ExtensionSurface = 'sidepanel';

  const surfaceId = crypto.randomUUID();
  const RUNTIME_STATE_MAX_AGE_MS = 30 * 60 * 1000;

  let activeTab: Tab = 'chat';
  let currentContext: PageSnapshot | null = null;
  let pendingAction: PendingAction | null = null;
  let captureOutput = '';
  let capturePath = '';
  let captureError = '';
  let captureRunning = false;
  let captureRequestId = '';
  let messages: ChatMessage[] = [];
  let chatRunning = false;
  let chatRequestId = '';
  let activeAssistantId = '';
  let currentSessionId: string | undefined = undefined;
  let restoringSession = false;
  let chatInputDraft = '';
  let chatInputDraftTouched = false;
  let hasToken = false;
  let settingsOpen = false;
  let selectedModel = 'flash';
  let runtimeHydrated = false;
  let persistQueued = false;
  let runtimePersistSnapshot: unknown[] | null = null;
  let targetBrowserWindowId = getTargetWindowIdFromUrl();
  let popoutBoundsTimer: ReturnType<typeof setTimeout> | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabs: Array<{ id: Tab; label: string; icon: any }> = [
    { id: 'chat', label: '对话', icon: MessageCircle },
    { id: 'knowledge', label: '知识库', icon: BookOpen },
    { id: 'history', label: '历史', icon: History },
  ];

  $: {
    runtimePersistSnapshot = runtimeHydrated
      ? [
          activeTab,
          pendingAction,
          captureOutput,
          capturePath,
          captureError,
          captureRunning,
          captureRequestId,
          messages,
          chatRunning,
          chatRequestId,
          activeAssistantId,
          currentSessionId,
          selectedModel,
        ]
      : null;
  }

  $: {
    if (runtimePersistSnapshot) {
      scheduleRuntimePersist();
    }
  }

  onMount(() => {
    void loadInitialState();
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    if (surface === 'popout') {
      void loadTargetBrowserWindowId();
      window.addEventListener('resize', handlePopoutBoundsChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      if (surface === 'popout') {
        window.removeEventListener('resize', handlePopoutBoundsChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (popoutBoundsTimer) clearTimeout(popoutBoundsTimer);
        void saveCurrentPopoutBounds();
      }
      void sendRuntimeMessage({
        type: 'UNREGISTER_SURFACE',
        payload: { surfaceId },
      }).catch(() => undefined);
    };
  });

  async function loadInitialState() {
    await sendRuntimeMessage<SurfaceRegistrationResponse>({
      type: 'REGISTER_SURFACE',
      payload: { surface, surfaceId },
    }).catch(() => undefined);

    await Promise.all([loadContext(), loadSettings(), restoreChatInputDraft()]);
    const restoredRuntime = await restoreRuntimeState();
    if (!restoredRuntime) {
      await restoreCurrentSession();
    }

    const pending = await sendRuntimeMessage<PendingAction | null>({
      type: 'CONSUME_PENDING_ACTION',
      payload: { surfaceId },
    }).catch(() => null);
    if (pending) {
      receivePendingAction(pending);
    }
    runtimeHydrated = true;
  }

  async function loadTargetBrowserWindowId() {
    if (targetBrowserWindowId !== undefined) return;
    const windowId = await sendRuntimeMessage<number | undefined>({
      type: 'GET_TARGET_WINDOW_ID',
    }).catch(() => undefined);
    if (typeof windowId === 'number') {
      targetBrowserWindowId = windowId;
    }
  }

  async function loadSettings() {
    const settings = await getSettings();
    hasToken = Boolean(settings.token);
    applyThemePreference(settings.theme);
  }

  async function loadContext() {
    currentContext = await sendRuntimeMessage<PageSnapshot>({ type: 'GET_ACTIVE_CONTEXT' });
  }

  async function restoreChatInputDraft() {
    const draft = await getChatInputDraft();
    if (!chatInputDraftTouched) {
      chatInputDraft = draft;
    }
  }

  async function restoreCurrentSession() {
    const sessionId = await getCurrentChatSessionId();
    if (!sessionId) return;

    restoringSession = true;
    try {
      await loadSessionDetail(sessionId, { silent: true });
    } finally {
      restoringSession = false;
    }
  }

  async function restoreRuntimeState(): Promise<boolean> {
    const state = await getAppRuntimeState();
    if (!state || Date.now() - state.updatedAt > RUNTIME_STATE_MAX_AGE_MS) {
      if (state) {
        await clearAppRuntimeState();
      }
      return false;
    }

    if (!hasRestorableRuntimeState(state)) {
      return false;
    }

    activeTab = state.activeTab;
    pendingAction = state.pendingAction;
    captureOutput = state.captureOutput;
    capturePath = state.capturePath;
    captureError = state.captureError;
    captureRunning = state.captureRunning;
    captureRequestId = state.captureRequestId;
    messages = state.messages;
    chatRunning = state.chatRunning;
    chatRequestId = state.chatRequestId;
    activeAssistantId = state.activeAssistantId;
    currentSessionId = state.currentSessionId;
    selectedModel = state.selectedModel || selectedModel;
    return true;
  }

  function hasRestorableRuntimeState(state: AppRuntimeState): boolean {
    return Boolean(
      state.messages.length > 0 ||
      state.chatRunning ||
      state.captureRunning ||
      state.pendingAction ||
      state.captureOutput,
    );
  }

  function scheduleRuntimePersist() {
    if (persistQueued) return;
    persistQueued = true;
    queueMicrotask(() => {
      persistQueued = false;
      void saveRuntimeState();
    });
  }

  async function saveRuntimeState() {
    await saveAppRuntimeState({
      activeTab,
      pendingAction,
      captureOutput,
      capturePath,
      captureError,
      captureRunning,
      captureRequestId,
      messages,
      chatRunning,
      chatRequestId,
      activeAssistantId,
      currentSessionId,
      selectedModel,
      updatedAt: Date.now(),
    });
  }

  function handlePopoutBoundsChange() {
    if (popoutBoundsTimer) clearTimeout(popoutBoundsTimer);
    popoutBoundsTimer = setTimeout(() => {
      void saveCurrentPopoutBounds();
    }, 300);
  }

  function handleBeforeUnload() {
    void saveRuntimeState();
    void saveCurrentPopoutBounds();
  }

  function getTargetWindowIdFromUrl(): number | undefined {
    const value = new URLSearchParams(window.location.search).get('windowId');
    if (!value) return undefined;

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
  }

  async function saveCurrentPopoutBounds() {
    if (surface !== 'popout') return;

    const bounds: PopoutBounds = {
      width: window.outerWidth,
      height: window.outerHeight,
      left: window.screenX,
      top: window.screenY,
    };
    await savePopoutBounds(bounds);
  }

  function handleChatInputDraftChange(nextDraft: string) {
    chatInputDraftTouched = true;
    chatInputDraft = nextDraft;
    void saveChatInputDraft(nextDraft);
  }

  function handleRuntimeMessage(message: RuntimeMessage) {
    if (
      'targetSurfaceId' in message &&
      message.targetSurfaceId &&
      message.targetSurfaceId !== surfaceId
    ) {
      return;
    }

    if (message.type === 'PENDING_ACTION') {
      receivePendingAction(message.payload);
      return;
    }
    if (message.type !== 'STREAM_EVENT') return;
    handleStreamEvent(message.payload);
  }

  function receivePendingAction(action: PendingAction) {
    pendingAction = action;
    activeTab = 'chat';
    captureOutput = '';
    capturePath = '';
    captureError = '';
    if (action.autoRun) {
      runCapture();
    }
    void sendRuntimeMessage({
      type: 'ACK_PENDING_ACTION',
      payload: { actionId: action.id, surfaceId },
    }).catch(() => undefined);
  }

  async function runCapture() {
    if (!pendingAction || captureRunning) return;
    captureRunning = true;
    captureOutput = '';
    capturePath = '';
    captureError = '';
    captureRequestId = crypto.randomUUID();
    await sendRuntimeMessage({
      type: 'START_CAPTURE',
      requestId: captureRequestId,
      surfaceId,
      payload: buildCaptureRequest(pendingAction.action, pendingAction.context),
    });
  }

  async function sendChat(message: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      createdAt: Date.now(),
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      isStreaming: true,
      blocks: [],
      statusRail: { text: '准备中...', indicator: 'loading' },
    };
    messages = [...messages, userMessage, assistantMessage];
    activeAssistantId = assistantMessage.id;
    chatRequestId = crypto.randomUUID();
    chatRunning = true;

    await sendRuntimeMessage({
      type: 'START_CHAT',
      requestId: chatRequestId,
      surfaceId,
      payload: {
        message: message,
        session_id: currentSessionId,
      },
    });
  }

  async function stopChat() {
    if (!chatRunning) return;
    await sendRuntimeMessage({
      type: 'ABORT_CHAT',
      requestId: chatRequestId,
    });
    finishAssistant();
  }

  function handleStreamEvent(event: ApiStreamEvent) {
    if (event.stream === 'capture' && event.requestId === captureRequestId) {
      handleCaptureStream(event);
      return;
    }
    if (event.stream === 'chat' && event.requestId === chatRequestId) {
      handleChatStream(event);
    }
  }

  function handleCaptureStream(event: ApiStreamEvent) {
    if (event.status === 'chunk') {
      captureOutput += event.content ?? '';
      return;
    }
    if (event.status === 'action') {
      capturePath = event.path ?? capturePath;
      return;
    }
    if (event.status === 'error') {
      captureError = event.error ?? '处理失败';
      captureRunning = false;
      return;
    }
    if (event.status === 'done') {
      captureRunning = false;
    }
  }

  function handleChatStream(event: ApiStreamEvent) {
    if (event.sessionId && event.sessionId !== currentSessionId) {
      currentSessionId = event.sessionId;
      void saveCurrentChatSessionId(event.sessionId);
    }
    if (event.status === 'chunk') {
      if (event.pspEvent) {
        updateAssistantPspEvent(event.pspEvent);
      } else {
        appendAssistantContent(event.content ?? '');
      }
      return;
    }
    if (event.status === 'error') {
      setAssistantError(event.error ?? '请求失败');
      finishAssistant();
      return;
    }
    if (event.status === 'done') {
      finishAssistant();
    }
  }

  function updateAssistantPspEvent(pspEvent: Record<string, unknown>) {
    messages = messages.map((message) => {
      if (message.id !== activeAssistantId) return message;

      const blocks = message.blocks ? [...message.blocks] : [];
      let statusRail: ChatMessage['statusRail'] = message.statusRail
        ? { ...message.statusRail }
        : { text: '思考中...', indicator: 'thinking' as const };
      let content = message.content;

      const type = pspEvent.type as string;

      if (type === 'message_start') {
        statusRail = { text: '思考中...', indicator: 'thinking' };
      } else if (type === 'status') {
        statusRail = {
          text: (pspEvent.text as string) || '',
          indicator: (pspEvent.indicator as 'thinking' | 'tool' | 'loading') || 'thinking',
        };
      } else if (type === 'content_block_start') {
        const idx = pspEvent.index as number;
        const cb = pspEvent.content_block as Record<string, unknown>;
        const cbType = cb.type as string;
        if (cbType === 'tool_call') {
          blocks[idx] = {
            type: 'tool_call',
            id: cb.id as string,
            name: cb.name as string,
            input: (cb.input as Record<string, unknown>) || {},
            partialJson: '',
          };
          statusRail = { text: `正在执行工具 ${cb.name as string}...`, indicator: 'tool' };
        } else if (cbType === 'tool_result') {
          blocks[idx] = {
            type: 'tool_result',
            tool_call_id: cb.tool_call_id as string,
            status: (cb.status as 'success' | 'error') || 'success',
            content: cb.content,
          };
        } else if (cbType === 'text') {
          blocks[idx] = {
            type: 'text',
            text: '',
          };
        } else if (cbType === 'thinking') {
          blocks[idx] = {
            type: 'thinking',
            text: '',
          };
        } else if (cbType === 'widget') {
          blocks[idx] = {
            type: 'widget',
            widget_type: cb.widget_type as string,
            data: cb.data,
          };
        }
      } else if (type === 'content_block_delta') {
        const idx = pspEvent.index as number;
        const delta = pspEvent.delta as Record<string, unknown>;
        const deltaType = delta.type as string;
        let block = blocks[idx];
        if (!block) {
          if (deltaType === 'text_delta') {
            block = { type: 'text', text: '' };
          } else if (deltaType === 'thinking_delta') {
            block = { type: 'thinking', text: '' };
          } else if (deltaType === 'input_json_delta') {
            block = { type: 'tool_call', id: '', name: '', input: {}, partialJson: '' };
          }
        }

        if (block) {
          if (block.type === 'text' && deltaType === 'text_delta') {
            block.text = (block.text || '') + (delta.text as string);
          } else if (block.type === 'thinking' && deltaType === 'thinking_delta') {
            block.text = (block.text || '') + (delta.text as string);
          } else if (block.type === 'tool_call' && deltaType === 'input_json_delta') {
            block.partialJson = (block.partialJson || '') + (delta.partial_json as string);
            try {
              block.input = JSON.parse(block.partialJson);
            } catch {
              // incomplete JSON
            }
          }
          blocks[idx] = block;
        }
      } else if (type === 'content_block_stop') {
        const idx = pspEvent.index as number;
        const cb = pspEvent.content_block as Record<string, unknown>;
        const cbType = cb.type as string;
        if (cbType === 'tool_call') {
          blocks[idx] = {
            type: 'tool_call',
            id: cb.id as string,
            name: cb.name as string,
            input: (cb.input as Record<string, unknown>) || {},
          };
          statusRail = { text: '思考中...', indicator: 'thinking' };
        } else if (cbType === 'tool_result') {
          blocks[idx] = {
            type: 'tool_result',
            tool_call_id: cb.tool_call_id as string,
            status: (cb.status as 'success' | 'error') || 'success',
            content: cb.content,
          };
        } else if (cbType === 'text') {
          blocks[idx] = {
            type: 'text',
            text: (cb.text as string) || '',
          };
        } else if (cbType === 'thinking') {
          blocks[idx] = {
            type: 'thinking',
            text: (cb.text as string) || '',
          };
        } else if (cbType === 'widget') {
          blocks[idx] = {
            type: 'widget',
            widget_type: cb.widget_type as string,
            data: cb.data,
          };
        }
      } else if (type === 'message_end') {
        statusRail = null;
      }

      content = blocks
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');

      return {
        ...message,
        blocks,
        statusRail,
        content,
      };
    });
  }

  function setAssistantError(error: string) {
    messages = messages.map((message) =>
      message.id === activeAssistantId ? { ...message, error } : message,
    );
  }

  function appendAssistantContent(content: string) {
    messages = messages.map((message) =>
      message.id === activeAssistantId
        ? { ...message, content: `${message.content}${content}` }
        : message,
    );
  }

  function finishAssistant() {
    chatRunning = false;
    messages = messages.map((message) =>
      message.id === activeAssistantId
        ? { ...message, isStreaming: false, statusRail: null }
        : message,
    );
  }

  function clearCapture() {
    pendingAction = null;
    captureOutput = '';
    capturePath = '';
    captureError = '';
    captureRunning = false;
  }

  function openSettings() {
    settingsOpen = true;
  }

  function closeSettings() {
    settingsOpen = false;
  }

  function toggleSettings() {
    settingsOpen = !settingsOpen;
  }

  async function switchSurface() {
    openSidePanelFromPopoutClick();
    await saveRuntimeState();
    await saveCurrentPopoutBounds();
    await sendRuntimeMessage({
      type: 'SWITCH_SURFACE',
      payload: {
        target: surface === 'sidepanel' ? 'popout' : 'sidepanel',
        sourceSurfaceId: surfaceId,
      },
    });
  }

  function openSidePanelFromPopoutClick() {
    if (surface !== 'popout' || targetBrowserWindowId === undefined) return;

    void chrome.sidePanel.open({ windowId: targetBrowserWindowId }).catch((error: unknown) => {
      console.warn('Failed to open Knovana side panel from popout', error);
    });
  }

  function handleSettingsSaved(next: ExtensionSettings) {
    hasToken = Boolean(next.token);
    applyThemePreference(next.theme);
  }

  function handleQuickAction(actionId: string) {
    if (actionId === 'save-page' || actionId === 'save-selection') {
      const contextAction = actionId as 'save-page' | 'save-selection';
      const pageCtx = currentContext ?? {
        pageUrl: '',
        pageTitle: '',
        selectedImages: [],
      };
      const context: ActionContext = {
        ...pageCtx,
        action: contextAction,
        selectedImages: pageCtx.selectedImages ?? [],
      };
      receivePendingAction({
        id: crypto.randomUUID(),
        action: contextAction,
        context,
        autoRun: true,
        createdAt: Date.now(),
      });
      return;
    }
    // Map to sendChat with preset prompts
    const prompts: Record<string, string> = {
      summarize: '请总结当前页面的主要内容',
      actions: '请从当前页面中提炼关键行动项',
      note: '请将当前页面的关键内容整理为知识笔记',
    };
    const prompt = prompts[actionId];
    if (prompt) {
      void sendChat(prompt);
    }
  }

  async function handleRegenerate(index: number) {
    if (chatRunning) return;
    const userMsg = messages[index];
    if (!userMsg || userMsg.role !== 'user') return;

    // We only support regenerating the last user message
    if (index !== messages.length - 2) {
      console.warn('Only regenerating the last user message is supported.');
      return;
    }

    // Retain up to the user message
    messages = messages.slice(0, index + 1);

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      isStreaming: true,
      blocks: [],
      statusRail: { text: '准备中...', indicator: 'loading' },
    };
    messages = [...messages, assistantMessage];
    activeAssistantId = assistantMessage.id;
    chatRequestId = crypto.randomUUID();
    chatRunning = true;

    await sendRuntimeMessage({
      type: 'REGENERATE_CHAT',
      requestId: chatRequestId,
      surfaceId,
      payload: {
        session_id: currentSessionId!,
      },
    });
  }

  async function startNewSession() {
    if (chatRunning) return;
    messages = [];
    currentSessionId = undefined;
    pendingAction = null;
    activeTab = 'chat';
    chatInputDraft = '';
    chatInputDraftTouched = true;
    clearCapture();
    await Promise.all([clearCurrentChatSessionId(), clearChatInputDraft(), clearAppRuntimeState()]);
  }

  interface SessionDetailResponse {
    id: string;
    title: string;
    messages: Array<{
      id?: string;
      role: 'user' | 'assistant';
      content: string;
      created_at?: string;
    }>;
  }

  async function loadSessionDetail(sessionId: string, options: { silent?: boolean } = {}) {
    try {
      const detail = await sendRuntimeMessage<SessionDetailResponse>({
        type: 'GET_SESSION_DETAIL',
        payload: { id: sessionId },
      });
      if (detail) {
        messages = (detail.messages ?? []).map((m) => ({
          id: m.id || crypto.randomUUID(),
          role: m.role,
          content: m.content,
          createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
          isStreaming: false,
          blocks: m.role === 'assistant' ? [{ type: 'text', text: m.content }] : undefined,
        }));
        currentSessionId = sessionId;
        activeTab = 'chat';
        await saveCurrentChatSessionId(sessionId);
      }
    } catch (err) {
      if (currentSessionId === sessionId) {
        currentSessionId = undefined;
      }
      if (!options.silent) {
        alert(err instanceof Error ? err.message : String(err));
      }
    }
  }

  function handleSelectSession(event: CustomEvent<{ sessionId: string }>) {
    void loadSessionDetail(event.detail.sessionId);
  }

  function handleDeleteSession(event: CustomEvent<{ sessionId: string }>) {
    if (currentSessionId === event.detail.sessionId) {
      void startNewSession();
    }
  }
</script>

<main class="shell" class:popout={surface === 'popout'} data-surface={surface}>
  <!-- ═══ Header ═══════════════════════════════════════════════ -->
  <header class="top-bar">
    <div class="top-bar__brand">
      <span class="top-bar__slogan">积累有了归处，思想才能远行</span>
    </div>

    <div class="flex items-center gap-1">
      {#if activeTab === 'chat' && messages.length > 0}
        <button
          type="button"
          class="top-bar__btn"
          disabled={chatRunning}
          title="新对话"
          onclick={startNewSession}
        >
          <SquarePen size={15} />
        </button>
      {/if}

      <button
        type="button"
        class="top-bar__btn surface-switch"
        title={surface === 'sidepanel' ? '弹出为独立窗口' : '停靠到侧边栏'}
        onclick={switchSurface}
      >
        <ExternalLink size={15} />
      </button>

      <button
        type="button"
        class="top-bar__btn"
        class:active={settingsOpen}
        title="设置"
        onclick={toggleSettings}
      >
        <Settings size={15} />
      </button>
    </div>
  </header>

  <!-- ═══ Tabs ══════════════════════════════════════════════════ -->
  <nav class="tabs" aria-label="主视图">
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        class="tab"
        class:active={!settingsOpen && activeTab === tab.id}
        onclick={() => {
          activeTab = tab.id;
          settingsOpen = false;
        }}
      >
        <svelte:component this={tab.icon} size={14} />
        <span>{tab.label}</span>
      </button>
    {/each}
  </nav>

  <!-- ═══ Content ═══════════════════════════════════════════════ -->
  {#if settingsOpen}
    <div class="settings-sheet">
      <div class="settings-sheet__handle">
        <button type="button" class="settings-sheet__back" onclick={closeSettings} title="返回">
          <ChevronLeft size={18} />
        </button>
        <h2>扩展设置</h2>
      </div>
      <div class="settings-sheet__body">
        <SettingsPanel variant="panel" onClose={closeSettings} onSaved={handleSettingsSaved} />
      </div>
    </div>
  {:else}
    <div class="stage">
      {#if !runtimeHydrated}
        <section class="view">
          <div class="restore-state" role="status">正在恢复当前状态...</div>
        </section>
      {:else}
        {#if !hasToken}
          <div class="notice">
            <span>尚未配置访问令牌</span>
            <button type="button" onclick={openSettings} class="notice__link">去设置 →</button>
          </div>
        {/if}

        <CapturePreview
          pending={pendingAction}
          output={captureOutput}
          path={capturePath}
          running={captureRunning}
          error={captureError}
          onRun={runCapture}
          onClear={clearCapture}
        />

        <section class="view">
          {#if activeTab === 'chat'}
            {#if restoringSession}
              <div class="restore-state" role="status">正在恢复当前对话...</div>
            {:else}
              <ChatView {messages} isStreaming={chatRunning} onRegenerate={handleRegenerate} />
            {/if}
          {:else if activeTab === 'knowledge'}
            <KnowledgeView />
          {:else}
            <HistoryView
              on:select={handleSelectSession}
              on:newSession={startNewSession}
              on:delete={handleDeleteSession}
            />
          {/if}
        </section>

        {#if activeTab === 'chat'}
          <InputBar
            disabled={chatRunning || restoringSession}
            onSubmit={sendChat}
            onStop={stopChat}
            value={chatInputDraft}
            onValueChange={handleChatInputDraftChange}
            bind:selectedModel
            onQuickAction={handleQuickAction}
          />
        {/if}
      {/if}
    </div>
  {/if}
</main>

<style>
  /* ═══════════════════════════════════════════════════════════════
     Shell
     ═══════════════════════════════════════════════════════════════ */

  :global(body) {
    font-family: 'Aptos', 'Inter', 'Segoe UI', ui-sans-serif, system-ui, sans-serif;
    font-size: 13px;
    line-height: 1.55;
    letter-spacing: -0.005em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .shell {
    display: grid;
    height: 100%;
    min-height: 0;
    grid-template-rows: auto auto 1fr;
    overflow: hidden;
    color: var(--kn-text);
    background: var(--kn-bg);
  }

  .shell.popout {
    min-width: 360px;
    border: 1px solid color-mix(in srgb, var(--kn-border) 72%, transparent);
  }

  /* ═══════════════════════════════════════════════════════════════
     Top Bar
     ═══════════════════════════════════════════════════════════════ */

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 8px;
    flex-shrink: 0;
  }

  .top-bar__brand {
    display: flex;
    align-items: center;
  }

  .top-bar__slogan {
    font-size: 12px;
    font-weight: 500;
    color: var(--kn-text-muted);
    letter-spacing: -0.01em;
  }

  .top-bar__btn {
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--kn-text-muted);
    cursor: pointer;
    transition:
      background 150ms ease,
      color 150ms ease;
  }

  .top-bar__btn :global(svg) {
    transition: transform 300ms ease;
  }

  .top-bar__btn:hover :global(svg) {
    transform: rotate(30deg);
  }

  .top-bar__btn.surface-switch:hover :global(svg) {
    transform: translate(1px, -1px);
  }

  .top-bar__btn:hover,
  .top-bar__btn.active {
    background: var(--kn-bg-subtle);
    color: var(--kn-text);
  }

  .top-bar__btn.active {
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  /* ═══════════════════════════════════════════════════════════════
     Tabs
     ═══════════════════════════════════════════════════════════════ */

  .tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    margin: 0 14px 12px;
    background: var(--kn-field-bg);
    border: 1px solid var(--kn-border);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .tab {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 28px;
    padding: 0;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--kn-text-muted);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 180ms ease,
      color 180ms ease,
      box-shadow 180ms ease;
  }

  .tab:hover {
    color: var(--kn-text);
  }

  .tab.active {
    background: var(--kn-bg-raised);
    color: var(--kn-primary);
    box-shadow: var(--kn-shadow-soft);
  }

  /* ═══════════════════════════════════════════════════════════════
     Stage (content area)
     ═══════════════════════════════════════════════════════════════ */

  .stage {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }

  /* ═══════════════════════════════════════════════════════════════
     Notice Banner
     ═══════════════════════════════════════════════════════════════ */

  .notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 14px;
    margin: 0 14px 10px;
    border: 1px solid color-mix(in srgb, var(--kn-warning) 24%, var(--kn-border));
    border-radius: 8px;
    background: color-mix(in srgb, var(--kn-warning) 6%, var(--kn-bg-raised));
    color: var(--kn-warning);
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .notice__link {
    border: 0;
    background: transparent;
    color: var(--kn-warning);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    opacity: 0.9;
    transition: opacity 150ms ease;
  }

  .notice__link:hover {
    opacity: 1;
  }

  /* ═══════════════════════════════════════════════════════════════
     View
     ═══════════════════════════════════════════════════════════════ */

  .view {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .restore-state {
    display: grid;
    min-height: 0;
    flex: 1;
    place-items: center;
    color: var(--kn-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  /* ═══════════════════════════════════════════════════════════════
     Settings Sheet
     ═══════════════════════════════════════════════════════════════ */

  .settings-sheet {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
    background: var(--kn-bg);
  }

  .settings-sheet__handle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 14px 8px;
    flex-shrink: 0;
  }

  .settings-sheet__back {
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--kn-text-muted);
    cursor: pointer;
    transition:
      background 150ms ease,
      color 150ms ease;
  }

  .settings-sheet__back:hover {
    background: var(--kn-bg-subtle);
    color: var(--kn-text);
  }

  .settings-sheet__handle h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.005em;
  }

  .settings-sheet__body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0;
  }
</style>
