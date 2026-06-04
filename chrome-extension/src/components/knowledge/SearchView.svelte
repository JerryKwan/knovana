<script lang="ts">
  import { Search } from '@lucide/svelte';
  import { onDestroy } from 'svelte';
  import { sendRuntimeMessage } from '../../services/messaging';
  import type { KnowledgeEntry, SearchResponse } from '../../types/api';
  import Markdown from '../common/Markdown.svelte';
  import StatusPill from '../common/StatusPill.svelte';

  let query = '';
  let lastQuery = '';
  let answer = '';
  let results: KnowledgeEntry[] = [];
  let loading = false;
  let error = '';
  let timer: ReturnType<typeof setTimeout>;

  async function runSearch(next = query.trim()) {
    if (!next) {
      answer = '';
      results = [];
      error = '';
      return;
    }

    loading = true;
    error = '';
    try {
      const response = await sendRuntimeMessage<SearchResponse>({
        type: 'SEARCH_KNOWLEDGE',
        payload: { query: next },
      });
      answer = response.answer ?? '';
      results = response.results ?? [];
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  $: if (query !== lastQuery) {
    lastQuery = query;
    clearTimeout(timer);
    timer = setTimeout(() => void runSearch(), 300);
  }

  onDestroy(() => {
    clearTimeout(timer);
  });
</script>

<section class="flex min-h-0 flex-1 flex-col">
  <div class="search-toolbar">
    <label class="search-field">
      <Search size={15} class="shrink-0 text-[color:var(--kn-text-muted)]" />
      <input bind:value={query} class="search-input" placeholder="搜索知识库..." />
    </label>
  </div>

  <div class="flex-1 overflow-y-auto p-3 kn-scrollbar">
    {#if error}
      <p class="search-error">
        {error}
      </p>
    {:else if loading}
      <div class="search-skeleton">
        <div></div>
        <div></div>
      </div>
    {:else if answer}
      <div class="answer-card">
        <Markdown content={answer} />
      </div>
    {/if}

    {#if results.length > 0}
      <div class="result-list">
        {#each results as result (result.id)}
          <article class="result-card">
            <h3>{result.title}</h3>
            <p>
              {result.summary}
            </p>
            <div class="tag-row">
              {#each (result.tags ?? []).slice(0, 4) as tag (tag)}
                <StatusPill>{tag}</StatusPill>
              {/each}
            </div>
          </article>
        {/each}
      </div>
    {:else if query && !loading && !answer && !error}
      <div class="empty-search">没有找到匹配内容</div>
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
    height: 40px;
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

  .search-error {
    margin: 0;
    border: 1px solid color-mix(in srgb, var(--kn-danger) 24%, var(--kn-border));
    border-radius: 8px;
    background: color-mix(in srgb, var(--kn-danger) 7%, var(--kn-bg-raised));
    color: var(--kn-danger);
    font-size: 12px;
    line-height: 1.55;
    padding: 10px;
  }

  .search-skeleton,
  .result-list {
    display: grid;
    gap: 9px;
  }

  .search-skeleton div {
    height: 66px;
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

  .answer-card,
  .result-card {
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-bg-raised);
    padding: 11px;
  }

  .answer-card {
    margin-bottom: 10px;
    box-shadow: var(--kn-shadow-soft);
  }

  .result-card h3,
  .result-card p {
    margin: 0;
  }

  .result-card h3 {
    color: var(--kn-text);
    font-size: 13px;
    font-weight: 850;
    line-height: 1.5;
  }

  .result-card p {
    display: -webkit-box;
    margin-top: 4px;
    overflow: hidden;
    color: var(--kn-text-muted);
    font-size: 12px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 9px;
  }

  .empty-search {
    display: grid;
    height: 100%;
    place-items: center;
    color: var(--kn-text-muted);
    font-size: 13px;
    text-align: center;
  }

  @keyframes shimmer {
    to {
      background-position: -220% 0;
    }
  }
</style>
