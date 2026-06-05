<script lang="ts">
  import { BookOpen, ExternalLink, RefreshCw, Trash2, Search } from '@lucide/svelte';
  import { onMount, onDestroy } from 'svelte';
  import { sendRuntimeMessage } from '../../services/messaging';
  import type {
    KnowledgeDetail,
    KnowledgeEntry,
    KnowledgeListResponse,
    SearchResponse,
  } from '../../types/api';
  import Markdown from '../common/Markdown.svelte';
  import StatusPill from '../common/StatusPill.svelte';

  // 1. Core library list states
  let entries: KnowledgeEntry[] = [];
  let selected: KnowledgeDetail | null = null;
  let listLoading = true;
  let listError = '';

  // 2. Search integration states
  let query = '';
  let lastQuery = '';
  let searchAnswer = '';
  let searchResults: KnowledgeEntry[] = [];
  let searchLoading = false;
  let searchError = '';
  let searchTimer: ReturnType<typeof setTimeout>;

  async function loadEntries() {
    listLoading = true;
    listError = '';
    try {
      const response = await sendRuntimeMessage<KnowledgeListResponse>({ type: 'GET_KNOWLEDGE' });
      entries = response.entries ?? [];
    } catch (err) {
      listError = err instanceof Error ? err.message : String(err);
    } finally {
      listLoading = false;
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
      listError = err instanceof Error ? err.message : String(err);
    }
  }

  async function deleteEntry(entry: KnowledgeEntry) {
    if (!confirm('确定要删除此条知识吗？')) return;
    await sendRuntimeMessage({ type: 'DELETE_KNOWLEDGE', payload: { id: entry.id } });
    if (selected?.id === entry.id) selected = null;
    await loadEntries();
  }

  async function runSearch(next = query.trim()) {
    if (!next) {
      searchAnswer = '';
      searchResults = [];
      searchError = '';
      return;
    }

    searchLoading = true;
    searchError = '';
    try {
      const response = await sendRuntimeMessage<SearchResponse>({
        type: 'SEARCH_KNOWLEDGE',
        payload: { query: next },
      });
      searchAnswer = response.answer ?? '';
      searchResults = response.results ?? [];
    } catch (err) {
      searchError = err instanceof Error ? err.message : String(err);
    } finally {
      searchLoading = false;
    }
  }

  $: if (query !== lastQuery) {
    lastQuery = query;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => void runSearch(), 300);
  }

  onMount(() => {
    void loadEntries();
  });

  onDestroy(() => {
    clearTimeout(searchTimer);
  });
</script>

<section class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <!-- 1. Search Bar Header -->
  <div class="search-toolbar">
    <label class="search-field">
      <Search size={15} class="shrink-0 text-[color:var(--kn-text-muted)]" />
      <input bind:value={query} class="search-input" placeholder="输入提问或搜索知识库..." />
    </label>
  </div>

  <div class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
    <div class="overflow-y-auto p-3 kn-scrollbar">
      {#if query.trim()}
        <!-- 2A. Search Mode View -->
        {#if searchError}
          <p class="view-error">{searchError}</p>
        {:else if searchLoading}
          <div class="skeleton-list">
            <div class="shimmer-card search-bar-shimmer"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
          </div>
        {:else}
          {#if searchAnswer}
            <div class="answer-card">
              <Markdown content={searchAnswer} />
            </div>
          {/if}

          {#if searchResults.length > 0}
            <div class="entry-list">
              {#each searchResults as result (result.id)}
                <article class="knowledge-card">
                  <button type="button" class="entry-button" onclick={() => openEntry(result)}>
                    <h3>{result.title}</h3>
                    <p>{result.summary}</p>
                  </button>
                  <div class="entry-footer">
                    <div class="flex min-w-0 flex-wrap gap-1">
                      {#each (result.tags ?? []).slice(0, 3) as tag (tag)}
                        <StatusPill>{tag}</StatusPill>
                      {/each}
                    </div>
                  </div>
                </article>
              {/each}
            </div>
          {:else if !searchAnswer}
            <div class="empty-state">没有找到匹配内容</div>
          {/if}
        {/if}
      {:else}
        <!-- 2B. Library Listing View (Standard Mode) -->
        <header class="list-toolbar">
          <div class="toolbar-title">
            <BookOpen size={14} class="text-[color:var(--kn-primary)]" />
            <span>全部存档</span>
          </div>
          <button type="button" class="toolbar-button" title="刷新列表" onclick={loadEntries}>
            <RefreshCw size={13} class={listLoading ? 'animate-spin' : ''} />
          </button>
        </header>

        {#if listError}
          <p class="view-error">{listError}</p>
        {/if}

        {#if listLoading}
          <div class="skeleton-list">
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
          </div>
        {:else if entries.length === 0}
          <div class="empty-state">暂无知识条目</div>
        {:else}
          <div class="entry-list">
            {#each entries as entry (entry.id)}
              <article class="knowledge-card">
                <button type="button" class="entry-button" onclick={() => openEntry(entry)}>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
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
      {/if}
    </div>

    <!-- Details Sidebar Drawer (Shows at the bottom of standard / search lists) -->
    {#if selected}
      <aside class="detail-preview kn-scrollbar">
        <div class="detail-header">
          <h3>{selected.title}</h3>
          <button type="button" class="close-detail" onclick={() => (selected = null)}>关闭</button>
        </div>
        <div class="detail-markdown">
          <Markdown content={selected.content} />
        </div>
      </aside>
    {/if}
  </div>
</section>

<style>
  .search-toolbar {
    border-bottom: 1px solid var(--kn-border);
    background: color-mix(in srgb, var(--kn-bg-raised) 88%, var(--kn-bg));
    padding: 11px 12px;
  }

  .search-field {
    display: flex;
    height: 38px;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-field-bg);
    padding: 0 11px;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .search-field:focus-within {
    border-color: color-mix(in srgb, var(--kn-primary) 48%, var(--kn-border));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--kn-primary) 12%, transparent);
  }

  .search-input {
    min-width: 0;
    flex: 1;
    border: 0;
    background: transparent;
    color: var(--kn-text);
    font-size: 13px;
    outline: none;
  }

  .search-input::placeholder {
    color: var(--kn-text-muted);
  }

  .list-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid color-mix(in srgb, var(--kn-border) 40%, transparent);
  }

  .toolbar-title {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--kn-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .toolbar-button {
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--kn-text-muted);
    width: 24px;
    height: 24px;
    cursor: pointer;
    transition:
      background 150ms ease,
      color 150ms ease;
  }

  .toolbar-button:hover {
    background: var(--kn-bg-subtle);
    color: var(--kn-primary);
  }

  .entry-action {
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--kn-text-muted);
    width: 26px;
    height: 26px;
    transition:
      background 150ms ease,
      color 150ms ease;
    cursor: pointer;
  }

  .entry-action:hover {
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .entry-action.danger:hover {
    background: color-mix(in srgb, var(--kn-danger) 10%, transparent);
    color: var(--kn-danger);
  }

  .view-error {
    margin: 0 0 10px;
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

  .shimmer-card {
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

  .shimmer-card.search-bar-shimmer {
    height: 120px;
  }

  .empty-state {
    display: grid;
    height: 100%;
    min-height: 150px;
    place-items: center;
    color: var(--kn-text-muted);
    font-size: 12.5px;
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
    padding: 12px;
    box-shadow: 0 4px 12px rgb(21 39 37 / 0.03);
    transition:
      border-color 150ms ease,
      transform 150ms ease,
      box-shadow 150ms ease;
  }

  .knowledge-card:hover {
    border-color: color-mix(in srgb, var(--kn-primary) 34%, var(--kn-border));
    box-shadow: var(--kn-shadow-soft);
    transform: translateY(-0.5px);
  }

  .entry-button {
    display: block;
    width: 100%;
    border: 0;
    background: transparent;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }

  .entry-button h3 {
    margin: 0;
    color: var(--kn-text);
    font-size: 13px;
    font-weight: 850;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  .answer-card {
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-bg-raised);
    padding: 12px;
    margin-bottom: 12px;
    box-shadow: var(--kn-shadow-soft);
  }

  .detail-preview {
    max-height: 280px;
    overflow-y: auto;
    border-top: 1px solid var(--kn-border);
    background: var(--kn-bg-raised);
    display: flex;
    flex-direction: column;
  }

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 6px;
    border-bottom: 1px solid color-mix(in srgb, var(--kn-border) 40%, transparent);
  }

  .detail-header h3 {
    margin: 0;
    font-size: 13.5px;
    font-weight: 850;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 80%;
  }

  .close-detail {
    border: 0;
    background: transparent;
    color: var(--kn-primary);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .detail-markdown {
    padding: 12px 14px;
    overflow-y: auto;
  }

  @keyframes shimmer {
    to {
      background-position: -220% 0;
    }
  }

  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
