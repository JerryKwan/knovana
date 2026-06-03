<script lang="ts">
  import { BookOpen, ExternalLink, RefreshCw, Trash2 } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { sendRuntimeMessage } from '../../services/messaging';
  import type { KnowledgeDetail, KnowledgeEntry, KnowledgeListResponse } from '../../types/api';
  import Markdown from '../common/Markdown.svelte';
  import StatusPill from '../common/StatusPill.svelte';

  let entries: KnowledgeEntry[] = [];
  let selected: KnowledgeDetail | null = null;
  let loading = true;
  let error = '';

  async function loadEntries() {
    loading = true;
    error = '';
    try {
      const response = await sendRuntimeMessage<KnowledgeListResponse>({ type: 'GET_KNOWLEDGE' });
      entries = response.entries ?? [];
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  async function openEntry(entry: KnowledgeEntry) {
    selected = null;
    try {
      selected = await sendRuntimeMessage<KnowledgeDetail>({
        type: 'GET_KNOWLEDGE_DETAIL',
        payload: { id: entry.id },
      });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }

  async function deleteEntry(entry: KnowledgeEntry) {
    await sendRuntimeMessage({ type: 'DELETE_KNOWLEDGE', payload: { id: entry.id } });
    if (selected?.id === entry.id) selected = null;
    await loadEntries();
  }

  onMount(() => {
    void loadEntries();
  });
</script>

<section class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <header
    class="flex items-center justify-between border-b border-[color:var(--kn-border)] px-3 py-2"
  >
    <div class="flex items-center gap-2 text-[13px] font-semibold">
      <BookOpen size={15} class="text-[color:var(--kn-primary)]" />
      知识库
    </div>
    <button
      type="button"
      class="grid h-8 w-8 place-items-center rounded-[7px] text-[color:var(--kn-text-muted)] transition hover:bg-[color:var(--kn-bg-subtle)] hover:text-[color:var(--kn-primary)]"
      title="刷新"
      onclick={loadEntries}
    >
      <RefreshCw size={14} />
    </button>
  </header>

  {#if error}
    <p
      class="m-3 rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] p-3 text-[12px] leading-5 text-[color:var(--kn-danger)]"
    >
      {error}
    </p>
  {/if}

  <div class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
    <div class="overflow-y-auto p-3 kn-scrollbar">
      {#if loading}
        <div class="space-y-2">
          <div class="h-20 animate-pulse rounded-[8px] bg-[color:var(--kn-bg-subtle)]"></div>
          <div class="h-20 animate-pulse rounded-[8px] bg-[color:var(--kn-bg-subtle)]"></div>
          <div class="h-20 animate-pulse rounded-[8px] bg-[color:var(--kn-bg-subtle)]"></div>
        </div>
      {:else if entries.length === 0}
        <div
          class="grid h-full place-items-center px-6 text-center text-[13px] text-[color:var(--kn-text-muted)]"
        >
          暂无知识条目
        </div>
      {:else}
        <div class="space-y-2">
          {#each entries as entry (entry.id)}
            <article
              class="rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] p-3 shadow-soft transition hover:border-[color:var(--kn-primary)]"
            >
              <button type="button" class="block w-full text-left" onclick={() => openEntry(entry)}>
                <h3
                  class="line-clamp-2 text-[13px] font-semibold leading-5 text-[color:var(--kn-text)]"
                >
                  {entry.title}
                </h3>
                <p
                  class="mt-1 line-clamp-2 text-[12px] leading-5 text-[color:var(--kn-text-muted)]"
                >
                  {entry.summary}
                </p>
              </button>
              <div class="mt-2 flex items-center justify-between gap-2">
                <div class="flex min-w-0 flex-wrap gap-1">
                  {#each (entry.tags ?? []).slice(0, 3) as tag (tag)}
                    <StatusPill>{tag}</StatusPill>
                  {/each}
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  {#if entry.source_url}
                    <a
                      class="grid h-7 w-7 place-items-center rounded-[7px] text-[color:var(--kn-text-muted)] transition hover:bg-[color:var(--kn-bg-subtle)] hover:text-[color:var(--kn-primary)]"
                      href={entry.source_url}
                      target="_blank"
                      rel="noreferrer"
                      title="打开来源"
                    >
                      <ExternalLink size={13} />
                    </a>
                  {/if}
                  <button
                    type="button"
                    class="grid h-7 w-7 place-items-center rounded-[7px] text-[color:var(--kn-text-muted)] transition hover:bg-[color:var(--kn-bg-subtle)] hover:text-[color:var(--kn-danger)]"
                    title="删除"
                    onclick={() => deleteEntry(entry)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </div>

    {#if selected}
      <aside
        class="max-h-60 overflow-y-auto border-t border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] p-3 kn-scrollbar"
      >
        <h3 class="mb-2 text-[13px] font-semibold">{selected.title}</h3>
        <Markdown content={selected.content} />
      </aside>
    {/if}
  </div>
</section>
