<script lang="ts">
  import { FileText, Play, Save, X } from '@lucide/svelte';
  import { actionLabel } from '../../services/capture';
  import type { PendingAction } from '../../types/capture';
  import Markdown from '../common/Markdown.svelte';
  import StatusPill from '../common/StatusPill.svelte';

  export let pending: PendingAction | null = null;
  export let output = '';
  export let path = '';
  export let running = false;
  export let error = '';
  export let onRun: () => void = () => undefined;
  export let onClear: () => void = () => undefined;
</script>

{#if pending}
  <section class="capture-preview">
    <div class="capture-top">
      <div class="capture-copy">
        <div class="capture-meta">
          <StatusPill tone={running ? 'warning' : path ? 'accent' : 'neutral'}>
            {running ? '处理中' : path ? '已保存' : '待处理'}
          </StatusPill>
          <span>{actionLabel(pending.action)}</span>
        </div>
        <p>{pending.context.pageTitle}</p>
      </div>

      <div class="capture-actions">
        <button
          type="button"
          class="capture-action"
          title="执行"
          disabled={running}
          onclick={onRun}
        >
          {#if pending.action === 'save-selection' || pending.action === 'save-page'}
            <Save size={15} />
          {:else}
            <Play size={15} />
          {/if}
        </button>
        <button type="button" class="capture-action danger" title="关闭" onclick={onClear}>
          <X size={15} />
        </button>
      </div>
    </div>

    {#if pending.context.selectedText}
      <div class="selection-preview">
        {pending.context.selectedText}
      </div>
    {/if}

    {#if output || running || error || path}
      <div class="capture-result">
        <div class="result-title">
          <FileText size={14} />
          处理结果
        </div>
        {#if error}
          <p class="text-[12px] leading-5 text-[color:var(--kn-danger)]">{error}</p>
        {:else if output}
          <Markdown content={output} />
        {:else}
          <div class="space-y-2">
            <div
              class="h-3 w-11/12 animate-pulse rounded-full bg-[color:var(--kn-bg-subtle)]"
            ></div>
            <div class="h-3 w-7/12 animate-pulse rounded-full bg-[color:var(--kn-bg-subtle)]"></div>
          </div>
        {/if}
        {#if path}
          <p class="saved-path">{path}</p>
        {/if}
      </div>
    {/if}
  </section>
{/if}

<style>
  .capture-preview {
    border-bottom: 1px solid var(--kn-border);
    background: color-mix(in srgb, var(--kn-bg-raised) 84%, var(--kn-bg));
    padding: 12px;
  }

  .capture-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .capture-copy {
    min-width: 0;
  }

  .capture-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 3px;
  }

  .capture-meta span:last-child {
    color: var(--kn-text);
    font-size: 12px;
    font-weight: 800;
  }

  .capture-copy p {
    margin: 0;
    overflow: hidden;
    color: var(--kn-text-muted);
    font-size: 12px;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .capture-actions {
    display: flex;
    flex: 0 0 auto;
    gap: 4px;
  }

  .capture-action {
    display: grid;
    width: 31px;
    height: 31px;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--kn-text-muted);
    transition:
      background 150ms ease,
      color 150ms ease;
  }

  .capture-action:hover {
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .capture-action.danger:hover {
    background: color-mix(in srgb, var(--kn-danger) 10%, transparent);
    color: var(--kn-danger);
  }

  .capture-action:disabled {
    cursor: not-allowed;
    opacity: 0.46;
  }

  .selection-preview {
    display: -webkit-box;
    max-height: 76px;
    margin-top: 10px;
    overflow: hidden;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-field-bg);
    color: var(--kn-text-muted);
    font-size: 12px;
    line-height: 1.6;
    padding: 9px 10px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .capture-result {
    margin-top: 10px;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-field-bg);
    padding: 10px;
  }

  .result-title {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 8px;
    color: var(--kn-text-muted);
    font-size: 12px;
    font-weight: 800;
  }

  .saved-path {
    margin: 8px 0 0;
    overflow: hidden;
    color: var(--kn-accent);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
