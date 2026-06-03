<script lang="ts">
  import { Search } from '@lucide/svelte';
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
</script>

<section class="flex min-h-0 flex-1 flex-col">
  <div class="border-b border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] p-3">
    <label
      class="flex h-10 items-center gap-2 rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg)] px-3"
    >
      <Search size={15} class="shrink-0 text-[color:var(--kn-text-muted)]" />
      <input
        bind:value={query}
        class="min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none placeholder:text-[color:var(--kn-text-muted)]"
        placeholder="搜索知识库..."
      />
    </label>
  </div>

  <div class="flex-1 overflow-y-auto p-3 kn-scrollbar">
    {#if error}
      <p
        class="rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] p-3 text-[12px] leading-5 text-[color:var(--kn-danger)]"
      >
        {error}
      </p>
    {:else if loading}
      <div class="space-y-2">
        <div class="h-16 animate-pulse rounded-[8px] bg-[color:var(--kn-bg-subtle)]"></div>
        <div class="h-16 animate-pulse rounded-[8px] bg-[color:var(--kn-bg-subtle)]"></div>
      </div>
    {:else if answer}
      <div
        class="mb-3 rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] p-3 shadow-soft"
      >
        <Markdown content={answer} />
      </div>
    {/if}

    {#if results.length > 0}
      <div class="space-y-2">
        {#each results as result (result.id)}
          <article
            class="rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] p-3"
          >
            <h3 class="text-[13px] font-semibold leading-5">{result.title}</h3>
            <p class="mt-1 line-clamp-3 text-[12px] leading-5 text-[color:var(--kn-text-muted)]">
              {result.summary}
            </p>
            <div class="mt-2 flex flex-wrap gap-1">
              {#each (result.tags ?? []).slice(0, 4) as tag (tag)}
                <StatusPill>{tag}</StatusPill>
              {/each}
            </div>
          </article>
        {/each}
      </div>
    {:else if query && !loading && !answer && !error}
      <div
        class="grid h-full place-items-center px-6 text-center text-[13px] text-[color:var(--kn-text-muted)]"
      >
        没有找到匹配内容
      </div>
    {/if}
  </div>
</section>
