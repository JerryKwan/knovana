<script lang="ts">
  import {
    BookOpen,
    ChevronLeft,
    MessageCircle,
    Settings,
    SquarePen,
    History,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import CapturePreview from '../../components/capture/CapturePreview.svelte';
  import ChatView from '../../components/chat/ChatView.svelte';
  import InputBar from '../../components/chat/InputBar.svelte';
  import KnowledgeView from '../../components/knowledge/KnowledgeView.svelte';
  import HistoryView from '../../components/knowledge/HistoryView.svelte';
  import SettingsPanel from '../../components/settings/SettingsPanel.svelte';
  import { buildCaptureRequest } from '../../services/capture';
  import { sendRuntimeMessage } from '../../services/messaging';
  import { getSettings } from '../../services/storage';
  import { applyThemePreference } from '../../services/theme';
  import type { ApiStreamEvent } from '../../types/api';
  import type { ChatMessage } from '../../types/chat';
  import type { ActionContext, PageSnapshot, PendingAction } from '../../types/capture';
  import type { RuntimeMessage } from '../../types/message';
  import type { ExtensionSettings } from '../../types/settings';

  type Tab = 'chat' | 'knowledge' | 'history';

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
  let hasToken = false;
  let settingsOpen = false;
  let selectedModel = 'flash';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tabs: Array<{ id: Tab; label: string; icon: any }> = [
    { id: 'chat', label: '对话', icon: MessageCircle },
    { id: 'knowledge', label: '知识库', icon: BookOpen },
    { id: 'history', label: '历史', icon: History },
  ];

  onMount(() => {
    void loadInitialState();
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    return () => chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
  });

  async function loadInitialState() {
    await Promise.all([loadContext(), loadSettings()]);
    const pending = await sendRuntimeMessage<PendingAction | null>({
      type: 'CONSUME_PENDING_ACTION',
    });
    if (pending) {
      receivePendingAction(pending);
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

  function handleRuntimeMessage(message: RuntimeMessage) {
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
    };
    messages = [...messages, userMessage, assistantMessage];
    activeAssistantId = assistantMessage.id;
    chatRequestId = crypto.randomUUID();
    chatRunning = true;

    // We let the Claude Code agent create the session, so we do not pre-generate currentSessionId here.

    const messagesHistory = messages.slice(0, -1).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const contextSource = pendingAction?.context ?? currentContext;
    await sendRuntimeMessage({
      type: 'START_CHAT',
      requestId: chatRequestId,
      payload: {
        messages: messagesHistory,
        session_id: currentSessionId,
        context: contextSource
          ? {
              page_url: contextSource.pageUrl,
              page_title: contextSource.pageTitle,
              selected_text: contextSource.selectedText,
              selected_images: contextSource.selectedImages,
            }
          : undefined,
      },
    });
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
    if (event.sessionId) {
      currentSessionId = event.sessionId;
    }
    if (event.status === 'chunk') {
      appendAssistantContent(event.content ?? '');
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
      message.id === activeAssistantId ? { ...message, isStreaming: false } : message,
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

    // Remove this user message and all subsequent messages
    messages = messages.slice(0, index);

    // Call sendChat to trigger regeneration
    await sendChat(userMsg.content);
  }

  function startNewSession() {
    if (chatRunning) return;
    messages = [];
    currentSessionId = undefined;
    pendingAction = null;
    activeTab = 'chat';
    clearCapture();
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

  async function loadSessionDetail(sessionId: string) {
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
        }));
        currentSessionId = sessionId;
        activeTab = 'chat';
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  function handleSelectSession(event: CustomEvent<{ sessionId: string }>) {
    void loadSessionDetail(event.detail.sessionId);
  }

  function handleDeleteSession(event: CustomEvent<{ sessionId: string }>) {
    if (currentSessionId === event.detail.sessionId) {
      startNewSession();
    }
  }
</script>

<main class="shell">
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
          <ChatView {messages} isStreaming={chatRunning} onRegenerate={handleRegenerate} />
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
          disabled={chatRunning}
          onSubmit={sendChat}
          bind:selectedModel
          onQuickAction={handleQuickAction}
        />
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
