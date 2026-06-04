<script lang="ts">
  import { BookOpen, MessageCircle, Search, Settings } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import CapturePreview from '../../components/capture/CapturePreview.svelte';
  import ChatView from '../../components/chat/ChatView.svelte';
  import InputBar from '../../components/chat/InputBar.svelte';
  import BrandMark from '../../components/common/BrandMark.svelte';
  import KnowledgeView from '../../components/knowledge/KnowledgeView.svelte';
  import SearchView from '../../components/knowledge/SearchView.svelte';
  import SettingsPanel from '../../components/settings/SettingsPanel.svelte';
  import { buildCaptureRequest } from '../../services/capture';
  import { sendRuntimeMessage } from '../../services/messaging';
  import { getSettings } from '../../services/storage';
  import { applyThemePreference } from '../../services/theme';
  import type { ApiStreamEvent } from '../../types/api';
  import type { ChatMessage } from '../../types/chat';
  import type { PageSnapshot, PendingAction } from '../../types/capture';
  import type { RuntimeMessage } from '../../types/message';
  import type { ExtensionSettings } from '../../types/settings';

  type Tab = 'chat' | 'knowledge' | 'search';

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
  let hasToken = false;
  let settingsOpen = false;

  const tabs: Array<{ id: Tab; label: string; icon: typeof MessageCircle }> = [
    { id: 'chat', label: '对话', icon: MessageCircle },
    { id: 'knowledge', label: '知识库', icon: BookOpen },
    { id: 'search', label: '搜索', icon: Search },
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

    const contextSource = pendingAction?.context ?? currentContext;
    await sendRuntimeMessage({
      type: 'START_CHAT',
      requestId: chatRequestId,
      payload: {
        message,
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

  function applySuggestion(value: string) {
    void sendChat(value);
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
    if (event.status === 'chunk') {
      appendAssistantContent(event.content ?? '');
      return;
    }
    if (event.status === 'error') {
      appendAssistantContent(`\n\n${event.error ?? '请求失败'}`);
      finishAssistant();
      return;
    }
    if (event.status === 'done') {
      finishAssistant();
    }
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

  function handleSettingsSaved(next: ExtensionSettings) {
    hasToken = Boolean(next.token);
    applyThemePreference(next.theme);
  }
</script>

<main
  class="grid h-screen min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[color:var(--kn-bg)] text-[color:var(--kn-text)]"
>
  <header class="panel-header">
    <div class="flex min-w-0 items-center gap-3">
      <BrandMark size={38} />
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="truncate text-[16px] font-extrabold leading-5">Knovana</h1>
          <span class={`connection-dot ${hasToken ? 'ready' : 'setup'}`}></span>
        </div>
        <p class="truncate text-[11px] font-semibold text-[color:var(--kn-text-muted)]">
          {currentContext?.pageTitle || '当前页面'}
        </p>
      </div>
    </div>

    <button
      type="button"
      class:active={settingsOpen}
      class="header-action"
      title="设置"
      onclick={openSettings}
    >
      <Settings size={16} />
    </button>
  </header>

  <div class="flex min-h-0 flex-col overflow-hidden">
    {#if settingsOpen}
      <SettingsPanel variant="panel" onClose={closeSettings} onSaved={handleSettingsSaved} />
    {:else}
      {#if !hasToken}
        <div class="setup-banner">
          <span>尚未配置访问令牌</span>
          <button type="button" onclick={openSettings}>去设置</button>
        </div>
      {/if}

      <nav class="workspace-tabs" aria-label="主视图">
        {#each tabs as tab (tab.id)}
          <button
            type="button"
            class:active={activeTab === tab.id}
            onclick={() => (activeTab = tab.id)}
          >
            <svelte:component this={tab.icon} size={14} />
            {tab.label}
          </button>
        {/each}
      </nav>

      <div class="flex min-h-0 flex-col overflow-hidden">
        <CapturePreview
          pending={pendingAction}
          output={captureOutput}
          path={capturePath}
          running={captureRunning}
          error={captureError}
          onRun={runCapture}
          onClear={clearCapture}
        />

        {#if activeTab === 'chat'}
          <ChatView {messages} isStreaming={chatRunning} />
        {:else if activeTab === 'knowledge'}
          <KnowledgeView />
        {:else}
          <SearchView />
        {/if}
      </div>
    {/if}
  </div>

  {#if activeTab === 'chat' && !settingsOpen}
    <InputBar disabled={chatRunning} onSubmit={sendChat} onSuggestion={applySuggestion} />
  {/if}
</main>

<style>
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--kn-border);
    background:
      linear-gradient(180deg, rgb(255 255 255 / 0.86), rgb(255 255 255 / 0.64)), var(--kn-bg-raised);
    padding: 12px 14px;
  }

  :global(:root[data-theme='dark']) .panel-header {
    background:
      linear-gradient(180deg, rgb(28 39 36 / 0.92), rgb(20 29 27 / 0.76)), var(--kn-bg-raised);
  }

  .header-action {
    display: grid;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-bg-raised);
    color: var(--kn-text-muted);
    transition:
      background 150ms ease,
      border-color 150ms ease,
      color 150ms ease,
      transform 150ms ease;
  }

  .header-action:hover,
  .header-action.active {
    border-color: color-mix(in srgb, var(--kn-primary) 42%, var(--kn-border));
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .header-action:hover {
    transform: translateY(-1px);
  }

  .connection-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border-radius: 999px;
  }

  .connection-dot.ready {
    background: var(--kn-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--kn-accent) 14%, transparent);
  }

  .connection-dot.setup {
    background: var(--kn-warning);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--kn-warning) 16%, transparent);
  }

  .setup-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-bottom: 1px solid color-mix(in srgb, var(--kn-warning) 24%, var(--kn-border));
    background: color-mix(in srgb, var(--kn-warning) 9%, var(--kn-bg-raised));
    padding: 9px 14px;
    color: var(--kn-warning);
    font-size: 12px;
    font-weight: 800;
  }

  .setup-banner button {
    height: 28px;
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--kn-warning) 36%, var(--kn-border));
    border-radius: 8px;
    background: var(--kn-bg-raised);
    color: var(--kn-warning);
    padding: 0 9px;
    font-size: 12px;
    font-weight: 800;
  }

  .workspace-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
    border-bottom: 1px solid var(--kn-border);
    background: var(--kn-bg-raised);
    padding: 8px 10px;
  }

  .workspace-tabs button {
    display: inline-flex;
    min-width: 0;
    height: 36px;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--kn-text-muted);
    font-size: 12px;
    font-weight: 800;
    transition:
      background 150ms ease,
      color 150ms ease,
      box-shadow 150ms ease;
  }

  .workspace-tabs button:hover {
    background: var(--kn-bg-subtle);
    color: var(--kn-text);
  }

  .workspace-tabs button.active {
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--kn-primary) 14%, transparent);
  }
</style>
