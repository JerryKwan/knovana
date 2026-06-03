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
  <section
    class="border-b border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] px-3 py-3"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="mb-1 flex items-center gap-2">
          <StatusPill tone={running ? 'warning' : path ? 'accent' : 'neutral'}>
            {running ? '处理中' : path ? '已保存' : '待处理'}
          </StatusPill>
          <span class="text-[12px] font-semibold text-[color:var(--kn-text)]"
            >{actionLabel(pending.action)}</span
          >
        </div>
        <p class="truncate text-[12px] text-[color:var(--kn-text-muted)]">
          {pending.context.pageTitle}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="grid h-8 w-8 place-items-center rounded-[7px] text-[color:var(--kn-text-muted)] transition hover:bg-[color:var(--kn-bg-subtle)] hover:text-[color:var(--kn-primary)] disabled:opacity-45"
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
        <button
          type="button"
          class="grid h-8 w-8 place-items-center rounded-[7px] text-[color:var(--kn-text-muted)] transition hover:bg-[color:var(--kn-bg-subtle)] hover:text-[color:var(--kn-danger)]"
          title="关闭"
          onclick={onClear}
        >
          <X size={15} />
        </button>
      </div>
    </div>

    {#if pending.context.selectedText}
      <div
        class="mt-3 max-h-20 overflow-hidden rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg)] px-3 py-2 text-[12px] leading-5 text-[color:var(--kn-text-muted)]"
      >
        {pending.context.selectedText}
      </div>
    {/if}

    {#if output || running || error || path}
      <div
        class="mt-3 rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg)] p-3"
      >
        <div
          class="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[color:var(--kn-text-muted)]"
        >
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
          <p class="mt-2 truncate text-[11px] text-[color:var(--kn-accent)]">{path}</p>
        {/if}
      </div>
    {/if}
  </section>
{/if}
