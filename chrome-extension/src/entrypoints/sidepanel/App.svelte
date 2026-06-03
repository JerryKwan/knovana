<script lang="ts">
  import { BookOpen, Brain, MessageCircle, Search, Settings } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import CapturePreview from '../../components/capture/CapturePreview.svelte';
  import ChatView from '../../components/chat/ChatView.svelte';
  import InputBar from '../../components/chat/InputBar.svelte';
  import KnowledgeView from '../../components/knowledge/KnowledgeView.svelte';
  import SearchView from '../../components/knowledge/SearchView.svelte';
  import { buildCaptureRequest } from '../../services/capture';
  import { sendRuntimeMessage } from '../../services/messaging';
  import { getSettings } from '../../services/storage';
  import { applyThemePreference } from '../../services/theme';
  import type { ApiStreamEvent } from '../../types/api';
  import type { ChatMessage } from '../../types/chat';
  import type { PageSnapshot, PendingAction } from '../../types/capture';
  import type { RuntimeMessage } from '../../types/message';

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

  function openOptions() {
    void sendRuntimeMessage({ type: 'OPEN_OPTIONS' });
  }
</script>

<main
  class="grid h-screen min-h-0 grid-rows-[auto_auto_1fr_auto] overflow-hidden bg-[color:var(--kn-bg)] text-[color:var(--kn-text)]"
>
  <header class="border-b border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] px-3 py-3">
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <div
          class="grid h-9 w-9 place-items-center rounded-[8px] bg-[color:var(--kn-primary)] text-[color:var(--kn-primary-ink)] shadow-soft"
        >
          <Brain size={19} />
        </div>
        <div class="min-w-0">
          <h1 class="truncate text-[16px] font-bold tracking-normal">Knovana</h1>
          <p class="truncate text-[11px] font-medium text-[color:var(--kn-text-muted)]">
            {currentContext?.pageTitle || '当前页面'}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border border-[color:var(--kn-border)] text-[color:var(--kn-text-muted)] transition hover:border-[color:var(--kn-primary)] hover:text-[color:var(--kn-primary)]"
        title="设置"
        onclick={openOptions}
      >
        <Settings size={16} />
      </button>
    </div>

    {#if !hasToken}
      <div
        class="mt-3 rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg)] px-3 py-2 text-[12px] leading-5 text-[color:var(--kn-warning)]"
      >
        尚未配置访问令牌。可先连接本地后端，或在设置中填入 Token。
      </div>
    {/if}
  </header>

  <nav
    class="grid grid-cols-3 border-b border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] px-2 py-2"
  >
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        class={`mx-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] text-[12px] font-bold transition ${
          activeTab === tab.id
            ? 'bg-[color:var(--kn-primary-soft)] text-[color:var(--kn-primary)]'
            : 'text-[color:var(--kn-text-muted)] hover:bg-[color:var(--kn-bg-subtle)] hover:text-[color:var(--kn-text)]'
        }`}
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

  {#if activeTab === 'chat'}
    <InputBar disabled={chatRunning} onSubmit={sendChat} onSuggestion={applySuggestion} />
  {/if}
</main>
