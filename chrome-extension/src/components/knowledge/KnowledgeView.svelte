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
  <header class="view-toolbar">
    <div class="toolbar-title">
      <BookOpen size={15} class="text-[color:var(--kn-primary)]" />
      知识库
    </div>
    <button type="button" class="toolbar-button" title="刷新" onclick={loadEntries}>
      <RefreshCw size={14} />
    </button>
  </header>

  {#if error}
    <p class="view-error">
      {error}
    </p>
  {/if}

  <div class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
    <div class="overflow-y-auto p-3 kn-scrollbar">
      {#if loading}
        <div class="skeleton-list">
          <div></div>
          <div></div>
          <div></div>
        </div>
      {:else if entries.length === 0}
        <div class="empty-state">暂无知识条目</div>
      {:else}
        <div class="entry-list">
          {#each entries as entry (entry.id)}
            <article class="knowledge-card">
              <button type="button" class="entry-button" onclick={() => openEntry(entry)}>
                <h3>
                  {entry.title}
                </h3>
                <p>
                  {entry.summary}
                </p>
              </button>
              <div class="entry-footer">
                <div class="flex min-w-0 flex-wrap gap-1">
                  {#each (entry.tags ?? []).slice(0, 3) as tag (tag)}
                    <StatusPill>{tag}</StatusPill>
                  {/each}
                </div>
                <div class="entry-actions">
                  {#if entry.source_url}
                    <a
                      class="entry-action"
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
                    class="entry-action danger"
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
      <aside class="detail-preview kn-scrollbar">
        <h3>{selected.title}</h3>
        <Markdown content={selected.content} />
      </aside>
    {/if}
  </div>
</section>

<style>
  .view-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-bottom: 1px solid var(--kn-border);
    background: color-mix(in srgb, var(--kn-bg-raised) 88%, var(--kn-bg));
    padding: 9px 12px;
  }

  .toolbar-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 850;
  }

  .toolbar-button,
  .entry-action {
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--kn-text-muted);
    transition:
      background 150ms ease,
      color 150ms ease;
  }

  .toolbar-button {
    width: 31px;
    height: 31px;
  }

  .entry-action {
    width: 28px;
    height: 28px;
  }

  .toolbar-button:hover,
  .entry-action:hover {
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .entry-action.danger:hover {
    background: color-mix(in srgb, var(--kn-danger) 10%, transparent);
    color: var(--kn-danger);
  }

  .view-error {
    margin: 12px;
    border: 1px solid color-mix(in srgb, var(--kn-danger) 24%, var(--kn-border));
    border-radius: 8px;
    background: color-mix(in srgb, var(--kn-danger) 7%, var(--kn-bg-raised));
    color: var(--kn-danger);
    font-size: 12px;
    line-height: 1.55;
    padding: 10px;
  }

  .skeleton-list {
    display: grid;
    gap: 9px;
  }

  .skeleton-list div {
    height: 82px;
    border-radius: 8px;
    background: linear-gradient(
      90deg,
      var(--kn-bg-subtle),
      var(--kn-field-bg),
      var(--kn-bg-subtle)
    );
    background-size: 220% 100%;
    animation: shimmer 1.35s ease-in-out infinite;
  }

  .empty-state {
    display: grid;
    height: 100%;
    place-items: center;
    color: var(--kn-text-muted);
    font-size: 13px;
    text-align: center;
  }

  .entry-list {
    display: grid;
    gap: 9px;
  }

  .knowledge-card {
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-bg-raised);
    padding: 11px;
    box-shadow: 0 6px 18px rgb(21 39 37 / 0.05);
    transition:
      border-color 150ms ease,
      transform 150ms ease,
      box-shadow 150ms ease;
  }

  .knowledge-card:hover {
    border-color: color-mix(in srgb, var(--kn-primary) 34%, var(--kn-border));
    box-shadow: var(--kn-shadow-soft);
    transform: translateY(-1px);
  }

  .entry-button {
    display: block;
    width: 100%;
    border: 0;
    background: transparent;
    padding: 0;
    text-align: left;
  }

  .entry-button h3 {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: var(--kn-text);
    font-size: 13px;
    font-weight: 850;
    line-height: 1.5;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .entry-button p {
    display: -webkit-box;
    margin: 4px 0 0;
    overflow: hidden;
    color: var(--kn-text-muted);
    font-size: 12px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .entry-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 9px;
  }

  .entry-actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 2px;
  }

  .detail-preview {
    max-height: 248px;
    overflow-y: auto;
    border-top: 1px solid var(--kn-border);
    background: var(--kn-bg-raised);
    padding: 12px;
  }

  .detail-preview h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 850;
    line-height: 1.45;
  }

  @keyframes shimmer {
    to {
      background-position: -220% 0;
    }
  }
</style>
