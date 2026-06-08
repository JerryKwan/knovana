<script lang="ts">
  import {
    Brain,
    ChevronDown,
    ClipboardList,
    FileText,
    Lightbulb,
    PenLine,
    Plus,
    Save,
    Send,
  } from '@lucide/svelte';
  import { tick } from 'svelte';

  export let disabled = false;
  export let onSubmit: (value: string) => void = () => undefined;
  export let onValueChange: (value: string) => void = () => undefined;
  export let selectedModel = 'auto';
  export let onQuickAction: (actionId: string) => void = () => undefined;
  export let onStop: () => void = () => undefined;
  export let value = '';

  let textarea: HTMLTextAreaElement;
  let actionMenuOpen = false;
  let modelMenuOpen = false;
  let measuredValue = value;

  $: if (value !== measuredValue) {
    measuredValue = value;
    void resizeAfterValueChange();
  }

  const actionIcons: Record<string, typeof Plus> = {
    summarize: Lightbulb,
    actions: PenLine,
    note: FileText,
    'save-page': Save,
    'save-selection': ClipboardList,
  };

  const quickActions = [
    { id: 'summarize', label: '总结页面' },
    { id: 'actions', label: '提炼行动项' },
    { id: 'note', label: '生成知识笔记' },
    { type: 'divider' },
    { id: 'save-page', label: '保存页面' },
    { id: 'save-selection', label: '保存选区' },
  ];

  const models = [
    { id: 'flash', label: 'Flash' },
    { id: 'pro', label: 'Pro' },
  ];

  function toggleActionMenu() {
    actionMenuOpen = !actionMenuOpen;
    if (actionMenuOpen) modelMenuOpen = false;
  }

  function toggleModelMenu() {
    modelMenuOpen = !modelMenuOpen;
    if (modelMenuOpen) actionMenuOpen = false;
  }

  function handleQuickActionClick(actionId: string) {
    actionMenuOpen = false;
    onQuickAction(actionId);
  }

  function selectModel(modelId: string) {
    selectedModel = modelId;
    modelMenuOpen = false;
  }

  function updateValue(nextValue: string) {
    value = nextValue;
    onValueChange(value);
  }

  function submit() {
    const next = value.trim();
    if (!next || disabled) return;
    updateValue('');
    onSubmit(next);
    if (textarea) textarea.style.height = 'auto';
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function handleInput(event: Event) {
    updateValue((event.currentTarget as HTMLTextAreaElement).value);
    autoResize();
  }

  function autoResize() {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  async function resizeAfterValueChange() {
    await tick();
    autoResize();
  }
</script>

<div class="composer-container">
  <div class="composer-card" class:disabled>
    <textarea
      bind:this={textarea}
      {value}
      {disabled}
      rows="1"
      class="field"
      placeholder="向 Knovana 提问…"
      onkeydown={handleKeydown}
      oninput={handleInput}
    ></textarea>

    <div class="composer-toolbar">
      <div class="toolbar-left">
        <div class="dropdown-wrapper">
          <button
            type="button"
            class="toolbar-btn plus-btn"
            class:open={actionMenuOpen}
            onclick={toggleActionMenu}
            {disabled}
            title="快捷操作"
          >
            <Plus size={14} />
          </button>

          {#if actionMenuOpen}
            <div class="dropdown-menu quick-menu">
              {#each quickActions as item, i (i)}
                {#if item.type === 'divider'}
                  <div class="divider"></div>
                {:else}
                  <button
                    type="button"
                    class="menu-item"
                    onclick={() => handleQuickActionClick(item.id!)}
                  >
                    <svelte:component this={actionIcons[item.id!]} size={13} />
                    <span>{item.label}</span>
                  </button>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="toolbar-right">
        <div class="dropdown-wrapper">
          <button
            type="button"
            class="toolbar-btn model-btn"
            class:open={modelMenuOpen}
            onclick={toggleModelMenu}
            {disabled}
            title="选择模型"
          >
            <Brain size={11} />
            <span>{models.find((m) => m.id === selectedModel)?.label ?? '模型'}</span>
            <ChevronDown size={11} />
          </button>

          {#if modelMenuOpen}
            <div class="dropdown-menu model-menu">
              {#each models as m (m.id)}
                <button
                  type="button"
                  class="menu-item"
                  class:active={selectedModel === m.id}
                  onclick={() => selectModel(m.id)}
                >
                  <span>{m.label}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        {#if disabled}
          <button type="button" class="stop-btn" title="停止生成" onclick={onStop}>
            <span class="stop-icon"></span>
          </button>
        {:else}
          <button
            type="button"
            class="send-btn"
            disabled={!value.trim()}
            title="发送"
            onclick={submit}
          >
            <Send size={13} />
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .composer-container {
    padding: 12px 14px 14px;
    background: transparent;
    flex-shrink: 0;
  }

  .composer-card {
    background: var(--kn-bg-raised);
    border: 1px solid var(--kn-border);
    border-radius: 16px;
    padding: 12px 12px 8px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: var(--kn-shadow-soft);
    transition:
      border-color 200ms ease,
      box-shadow 200ms ease;
  }

  .composer-card:focus-within {
    border-color: color-mix(in srgb, var(--kn-primary) 50%, var(--kn-border));
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.04),
      0 0 0 3px color-mix(in srgb, var(--kn-primary) 10%, transparent);
  }

  .field {
    border: 0;
    outline: none;
    resize: none;
    background: transparent;
    padding: 4px 0;
    font-size: 13.5px;
    line-height: 1.5;
    color: var(--kn-text);
    min-height: 24px;
    max-height: 140px;
    width: 100%;
    scrollbar-width: thin;
  }

  .field::placeholder {
    color: var(--kn-text-muted);
  }

  .composer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dropdown-wrapper {
    position: relative;
  }

  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 28px;
    padding: 0 8px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--kn-text-muted);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition:
      background 150ms ease,
      color 150ms ease;
  }

  .plus-btn {
    width: 28px;
    padding: 0;
  }

  .toolbar-btn:hover:not(:disabled) {
    background: var(--kn-bg-subtle);
    color: var(--kn-text);
  }

  .toolbar-btn.open {
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .send-btn {
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: var(--kn-primary);
    color: var(--kn-primary-ink);
    cursor: pointer;
    transition:
      background 150ms ease,
      transform 150ms ease,
      opacity 150ms ease;
  }

  .send-btn:hover:not(:disabled) {
    background: color-mix(in srgb, var(--kn-primary) 85%, #000);
    transform: scale(1.05);
  }

  .send-btn:disabled,
  .toolbar-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dropdown-menu {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    min-width: 185px;
    background: var(--kn-bg-raised);
    border: 1px solid var(--kn-border);
    border-radius: 12px;
    padding: 6px;
    box-shadow: var(--kn-shadow-panel);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .model-menu {
    left: auto;
    right: 0;
    min-width: 140px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 32px;
    padding: 0 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--kn-text);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    transition: background 120ms ease;
  }

  .menu-item :global(svg) {
    color: var(--kn-text-muted);
    opacity: 0.8;
  }

  .menu-item:hover {
    background: var(--kn-bg-subtle);
  }

  .menu-item.active {
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
    font-weight: 600;
  }

  .divider {
    height: 1px;
    background: var(--kn-border);
    margin: 4px 6px;
  }

  .stop-btn {
    display: grid;
    width: 28px;
    height: 28px;
    place-items: center;
    border: 1px solid var(--kn-border);
    border-radius: 50%;
    background: var(--kn-bg-raised);
    color: var(--kn-text);
    cursor: pointer;
    transition:
      background 150ms ease,
      transform 150ms ease,
      border-color 150ms ease;
  }

  .stop-btn:hover {
    background: var(--kn-bg-subtle);
    border-color: var(--kn-text-muted);
    transform: scale(1.05);
  }

  .stop-icon {
    width: 8px;
    height: 8px;
    background: currentColor;
    border-radius: 1px;
  }
</style>
