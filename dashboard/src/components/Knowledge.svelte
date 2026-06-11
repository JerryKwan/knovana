<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { request, getApiUrl, getToken } from "../lib/api";
  import { marked } from "marked";
  import DOMPurify from "dompurify";

  interface KnowledgeListItem {
    id: string;
    title: string;
    tags: string[];
    type: string;
    has_attachments: boolean;
    created_at: string;
  }

  interface KnowledgeEntry {
    id: string;
    title: string;
    content: string;
    tags: string[];
    source_url?: string;
    attachments: Array<{
      name: string;
      description?: string;
      size?: number;
      mime_type?: string;
    }>;
    created_at: string;
    updated_at: string;
  }

  let { isBlocked = false } = $props<{ isBlocked?: boolean }>();

  let entries = $state<KnowledgeListItem[]>([]);
  let tags = $state<Array<{ name: string; count: number }>>([]);
  let loadingList = $state(false);
  
  // Filters
  let searchVal = $state("");
  let selectedCategory = $state<string>("all");
  let selectedTag = $state<string | null>(null);
  let isListHidden = $state(false);

  // Tag Popover States
  let showTagPopover = $state(false);
  let tagSearchVal = $state("");
  let tagInput = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (showTagPopover && tagInput) {
      tagInput.focus();
    }
  });

  // Selected note detail
  let selectedId = $state<string | null>(null);
  let selectedEntry = $state<KnowledgeEntry | null>(null);
  let loadingDetail = $state(false);
  let errorMsg = $state("");

  // Load knowledge list
  async function loadList() {
    if (isBlocked) return;
    loadingList = true;
    errorMsg = "";
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("per_page", "200"); // load up to 200 for client search and browse
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (selectedTag) {
        params.append("tags", selectedTag);
      }

      const res = await request<{ entries: KnowledgeListItem[]; total: number }>(
        `/api/v1/knowledge?${params.toString()}`
      );
      
      if (res.error) {
        errorMsg = res.error.message;
      } else {
        entries = res.data?.entries || [];
      }
    } finally {
      loadingList = false;
    }
  }

  // Load tag list
  async function loadTags() {
    if (isBlocked) return;
    const res = await request<{ tags: Array<{ name: string; count: number }> }>(
      "/api/v1/knowledge/tags"
    );
    if (!res.error && res.data) {
      tags = res.data.tags || [];
    }
  }

  // Fetch detailed entry content
  async function selectEntry(id: string) {
    selectedId = id;
    selectedEntry = null;
    loadingDetail = true;
    errorMsg = "";

    try {
      const res = await request<KnowledgeEntry>(
        `/api/v1/knowledge/${encodeURIComponent(id)}`
      );

      if (res.error) {
        errorMsg = res.error.message;
      } else {
        selectedEntry = res.data;
      }
    } finally {
      loadingDetail = false;
    }
  }

  // Delete note
  async function handleDelete(id: string) {
    if (!confirm("确定要永久删除这篇知识笔记吗？相关附件也将被物理删除。")) {
      return;
    }

    errorMsg = "";
    const res = await request(`/api/v1/knowledge/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (res.error) {
      errorMsg = res.error.message;
    } else {
      selectedId = null;
      selectedEntry = null;
      await loadList();
      await loadTags();
    }
  }

  // Handle category change
  function handleCategory(category: string) {
    selectedCategory = category;
    selectedTag = null; // clear tag filter when changing category
    loadList();
  }

  // Handle tag click
  function handleTag(tagName: string | null) {
    selectedTag = selectedTag === tagName ? null : tagName;
    showTagPopover = false; // close popover after selection
    loadList();
  }

  // Filter list locally based on search
  const filteredEntries = $derived(() => {
    if (!searchVal) return entries;
    const query = searchVal.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  // Filter and sort tags for Popover
  const filteredTags = $derived(() => {
    const sorted = [...tags].sort((a, b) => b.count - a.count);
    if (!tagSearchVal) return sorted;
    const query = tagSearchVal.toLowerCase();
    return sorted.filter((t) => t.name.toLowerCase().includes(query));
  });

  // Calculate dir path to fetch relative assets correctly
  function getNoteDir(id: string): string {
    const parts = id.split("/");
    parts.pop(); // remove file name (e.g. index.md)
    return parts.join("/");
  }

  // Compile markdown and rewrite relative assets path to absolute backend URL
  const compiledContent = $derived(() => {
    if (!selectedEntry) return "";
    const rawMarkdown = selectedEntry.content;
    const noteDir = getNoteDir(selectedEntry.id);
    
    // Parse markdown to HTML
    let html = marked.parse(rawMarkdown) as string;

    // Sanitize HTML
    html = DOMPurify.sanitize(html);

    // Rewrite relative assets path: src="assets/image.png" -> src="http://localhost:8000/api/v1/attachments/notes/noteDir/assets/image.png"
    const token = getToken();
    const regex = /src=["']assets\/([^"']+)["']/g;
    const resolvedHtml = html.replace(regex, (match, filename) => {
      let serveUrl = getApiUrl(`/api/v1/attachments/notes/${noteDir}/assets/${filename}`);
      if (token) {
        serveUrl += `?token=${encodeURIComponent(token)}`;
      }
      return `src="${serveUrl}"`;
    });

    return resolvedHtml;
  });

  // Format bytes helper
  function formatBytes(bytes?: number): string {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Format date helper
  function formatDate(isoStr?: string): string {
    if (!isoStr) return "";
    try {
      const date = new Date(isoStr);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  }

  // Handle global click to dismiss popover
  function handleGlobalClick(event: MouseEvent) {
    if (showTagPopover) {
      const trigger = document.querySelector(".tag-trigger-btn");
      const popover = document.querySelector(".tag-popover");
      if (
        trigger &&
        popover &&
        !trigger.contains(event.target as Node) &&
        !popover.contains(event.target as Node)
      ) {
        showTagPopover = false;
      }
    }
  }

  onMount(() => {
    if (!isBlocked) {
      loadList();
      loadTags();
    }
    window.addEventListener("click", handleGlobalClick);
  });

  onDestroy(() => {
    window.removeEventListener("click", handleGlobalClick);
  });
</script>

<div class="knowledge-container {isListHidden ? 'list-hidden' : ''}">
  {#if isBlocked}
    <div class="blocked-card paper-card" style="grid-column: span 2; text-align: center; padding: 40px; margin: 40px auto; max-width: 600px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 4px; height: fit-content; box-shadow: var(--shadow-paper);">
      <h3 style="color: #c53030; margin-bottom: 20px; font-family: var(--font-sans); font-size: 16px; border-bottom: 1px dashed #fed7d7; padding-bottom: 10px;">🔒 知识库已锁定</h3>
      <p style="color: #9b2c2c; font-size: 14px;">您的账户目前处于待激活状态，暂时无法浏览或阅读知识库。请联系系统管理员进行激活。</p>
    </div>
  {:else}
    <!-- Column 1: Note List & Filters -->
    <div class="list-pane">
      <div class="list-header">
        <!-- Search Row -->
        <div class="search-input-wrapper">
          <svg class="search-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            class="paper-input"
            placeholder="搜索笔记标题或标签..."
            bind:value={searchVal}
          />
        </div>

        <!-- Segmented Control for Categories -->
        <div class="segmented-control">
          <button
            class="segment-btn {selectedCategory === 'all' ? 'active' : ''}"
            onclick={() => handleCategory("all")}
          >
            全部
          </button>
          <button
            class="segment-btn {selectedCategory === 'inbox' ? 'active' : ''}"
            onclick={() => handleCategory("inbox")}
          >
            待整理
          </button>
          <button
            class="segment-btn {selectedCategory === 'topics' ? 'active' : ''}"
            onclick={() => handleCategory("topics")}
          >
            专题
          </button>
          <button
            class="segment-btn {selectedCategory === 'daily' ? 'active' : ''}"
            onclick={() => handleCategory("daily")}
          >
            随笔
          </button>
        </div>

        <!-- Tag Selection Trigger Bar -->
        <div class="tag-filter-bar">
          <button 
            class="tag-trigger-btn {selectedTag ? 'active' : ''}" 
            onclick={() => showTagPopover = !showTagPopover}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.39.39 1.02.39 1.41 0l7.59-7.59c.39-.39.39-1.02 0-1.41L12 2z"/><path d="m7 7-.01.01"/></svg>
            {#if selectedTag}
              标签: #{selectedTag}
            {:else}
              按标签筛选
            {/if}
          </button>

          {#if selectedTag}
            <button class="clear-tag-btn" onclick={() => handleTag(null)} title="清除标签筛选">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          {/if}

          <!-- Tag Popover Dropdown -->
          {#if showTagPopover}
            <div class="tag-popover">
              <div class="tag-popover-search">
                <input
                  bind:this={tagInput}
                  type="text"
                  class="paper-input tag-search"
                  placeholder="搜索标签..."
                  bind:value={tagSearchVal}
                />
              </div>
              <div class="tag-popover-list">
                {#if filteredTags().length === 0}
                  <div class="no-tags-found">无匹配标签</div>
                {:else}
                  {#each filteredTags() as tag}
                    <button
                      class="tag-option {selectedTag === tag.name ? 'active' : ''}"
                      onclick={() => handleTag(tag.name)}
                    >
                      <span class="tag-name">#{tag.name}</span>
                      <span class="tag-count">{tag.count}</span>
                    </button>
                  {/each}
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Scrollable Note List Container -->
      <div class="notes-scroll-container">
        {#if loadingList}
          <div class="loading-state">载入中...</div>
        {:else if filteredEntries().length === 0}
          <div class="empty-state">没有符合条件的知识条目</div>
        {:else}
          <div class="notes-list">
            {#each filteredEntries() as entry}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="note-item {selectedId === entry.id ? 'selected' : ''}"
                onclick={() => selectEntry(entry.id)}
              >
                <div class="note-item-title">{entry.title}</div>
                <div class="note-item-meta">
                  <span class="note-type">{entry.type === 'excerpt' ? '摘录' : entry.type === 'note' ? '笔记' : entry.type}</span>
                  <span class="note-date">{formatDate(entry.created_at)}</span>
                </div>
                {#if entry.tags && entry.tags.length > 0}
                  <div class="note-item-tags">
                    {#each entry.tags.slice(0, 3) as tag}
                      <span class="note-tag-pill">#{tag}</span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Column 2: Note Details Reader -->
    <div class="reader-pane">
      <div class="reader-header-bar">
        <button 
          class="toggle-list-btn" 
          onclick={() => isListHidden = !isListHidden} 
          title={isListHidden ? "展开笔记列表" : "隐藏笔记列表"}
          aria-label={isListHidden ? "展开笔记列表" : "隐藏笔记列表"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
      </div>
      {#if errorMsg}
        <div class="error-msg" style="margin: 20px;">⚠️ {errorMsg}</div>
      {/if}

      {#if loadingDetail}
        <div class="detail-loading">
          <div class="spinner">✍️</div>
          <p>正在翻阅笔记...</p>
        </div>
      {:else if selectedEntry}
        <div class="reader-content-wrapper">
          <div class="note-paper">
            <div class="note-header">
              <div class="note-header-top">
                <h1>{selectedEntry.title}</h1>
                <button
                  class="paper-button danger delete-btn"
                  onclick={() => handleDelete(selectedEntry!.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  删除笔记
                </button>
              </div>

              <div class="metadata-block">
                <div class="meta-row">
                  <span class="meta-label">标识 (ID):</span>
                  <span class="meta-value font-mono">{selectedEntry.id}</span>
                </div>
                {#if selectedEntry.source_url}
                  <div class="meta-row">
                    <span class="meta-label">原始来源:</span>
                    <span class="meta-value">
                      <a href={selectedEntry.source_url} target="_blank" rel="noopener noreferrer">
                        {selectedEntry.source_url} 🔗
                      </a>
                    </span>
                  </div>
                {/if}
                <div class="meta-row">
                  <span class="meta-label">创建时间:</span>
                  <span class="meta-value">{formatDate(selectedEntry.created_at)}</span>
                </div>
                {#if selectedEntry.tags && selectedEntry.tags.length > 0}
                  <div class="meta-row align-center">
                    <span class="meta-label">标签归属:</span>
                    <div class="meta-tags-list">
                      {#each selectedEntry.tags as tag}
                        <span class="note-tag-pill">#{tag}</span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Rendered Markdown content -->
            <div class="markdown-body text-layout">
              {@html compiledContent()}
            </div>

            <!-- Attachments shelf -->
            {#if selectedEntry.attachments && selectedEntry.attachments.length > 0}
              <div class="attachments-shelf">
                <h3>📎 笔记附件 ({selectedEntry.attachments.length})</h3>
                <div class="attachments-grid">
                  {#each selectedEntry.attachments as att}
                    <div class="attachment-item">
                      <div class="att-info">
                        <span class="att-name" title={att.name}>{att.name}</span>
                        <span class="att-size">{formatBytes(att.size)}</span>
                      </div>
                      {#if att.description}
                        <p class="att-desc">{att.description}</p>
                      {/if}
                      <a
                        class="paper-button download-btn"
                        href={getApiUrl(`/api/v1/attachments/notes/${getNoteDir(selectedEntry.id)}/assets/${encodeURIComponent(att.name)}`)}
                        target="_blank"
                        download={att.name}
                      >
                        下载附件
                      </a>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <div class="no-selection">
          <span class="book-icon">📖</span>
          <h3>开启您的知识翻阅</h3>
          <p>请从左侧列表中点击一篇知识笔记开始阅读，或键入关键字快速检索</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .knowledge-container {
    display: grid;
    grid-template-columns: 320px 1fr;
    height: 100%;
    overflow: hidden;
    transition: grid-template-columns 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .knowledge-container.list-hidden {
    grid-template-columns: 0px 1fr;
  }

  /* List Pane (Column 1) */
  .list-pane {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border-fine);
    height: 100%;
    background-color: var(--bg-paper);
    overflow: hidden;
    transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-right 0.25s ease;
  }

  .knowledge-container.list-hidden .list-pane {
    opacity: 0;
    border-right: none;
    pointer-events: none;
  }

  .list-header {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-bottom: 1px solid var(--border-fine);
    background: var(--bg-paper);
    z-index: 10;
    position: relative;
  }

  .search-input-wrapper {
    position: relative;
    width: 100%;
  }

  .search-input-wrapper input {
    padding-left: 36px;
  }

  .search-icon-svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }

  /* Segmented Control */
  .segmented-control {
    display: flex;
    background: var(--bg-card);
    border: 1px solid var(--border-fine);
    border-radius: 8px;
    padding: 3px;
    gap: 4px;
  }

  .segment-btn {
    flex: 1;
    text-align: center;
    padding: 6px 2px;
    font-size: 12px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: var(--font-sans);
    color: var(--text-muted);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    outline: none;
  }

  .segment-btn:hover {
    color: var(--text-ink);
    background: var(--bg-card-hover);
  }

  .segment-btn.active {
    background: var(--bg-paper);
    color: var(--accent-ochre);
    box-shadow: var(--shadow-paper);
    font-weight: 600;
  }

  /* Tag Filter Bar & Trigger */
  .tag-filter-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    background: var(--bg-paper);
    gap: 8px;
  }

  .tag-trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--bg-card);
    border: 1px solid var(--border-fine);
    padding: 5px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    flex-grow: 1;
    text-align: left;
  }

  .tag-trigger-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
  }

  .tag-trigger-btn.active {
    border-color: var(--accent-sage);
    color: var(--accent-sage);
    background: rgba(74, 107, 93, 0.05);
  }

  .clear-tag-btn {
    background: transparent;
    border: 1px solid var(--border-fine);
    color: var(--text-muted);
    border-radius: 6px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    flex-shrink: 0;
  }

  .clear-tag-btn:hover {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #dc2626;
  }

  /* Tag Popover Dropdown */
  .tag-popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 100%;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 8px;
    box-shadow: var(--shadow-paper-lift);
    z-index: 100;
    display: flex;
    flex-direction: column;
    max-height: 280px;
    animation: popoverFadeIn 0.15s ease-out;
  }

  @keyframes popoverFadeIn {
    from { transform: translateY(5px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .tag-popover-search {
    padding: 8px;
    border-bottom: 1px solid var(--border-fine);
  }

  .tag-search {
    height: 32px;
    padding: 6px 10px;
    font-size: 12.5px;
  }

  .tag-popover-list {
    overflow-y: auto;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tag-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    font-size: 12.5px;
    color: var(--text-muted);
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--font-sans);
    text-align: left;
    transition: all 0.15s ease;
    outline: none;
  }

  .tag-option:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
  }

  .tag-option.active {
    background: var(--accent-sage);
    color: #ffffff;
  }

  .tag-option.active .tag-count {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }

  .tag-count {
    font-size: 10px;
    background: var(--bg-card);
    color: var(--text-muted);
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 600;
  }

  .no-tags-found {
    padding: 20px;
    color: var(--text-muted);
    font-size: 12px;
    text-align: center;
  }

  /* Notes Scroll Area */
  .notes-scroll-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .notes-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .note-item {
    position: relative;
    padding: 16px 16px 16px 22px;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-paper);
  }

  .note-item:hover {
    background: var(--bg-card-hover);
    border-color: var(--text-muted);
    transform: translateY(-1px);
    box-shadow: var(--shadow-paper-lift);
  }

  .note-item.selected {
    background: var(--bg-card);
    border-color: var(--accent-ochre);
    border-width: 1px;
    box-shadow: var(--shadow-paper-lift);
  }

  .note-item.selected::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 15%;
    width: 3.5px;
    height: 70%;
    background-color: var(--accent-ochre);
    border-radius: 2px;
  }

  .note-item-title {
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: 14.5px;
    margin-bottom: 8px;
    color: var(--text-ink);
    line-height: 1.35;
  }

  .note-item-meta {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .note-item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .note-tag-pill {
    font-size: 10px;
    padding: 1px 6px;
    background: var(--bg-card);
    border: 1px solid var(--border-fine);
    border-radius: 10px;
    color: var(--accent-sage);
    font-family: var(--font-sans);
    font-weight: 500;
  }

  .note-item.selected .note-tag-pill {
    background: var(--bg-paper);
  }

  /* Reader Pane (Column 2) */
  .reader-pane {
    flex: 1;
    height: 100%;
    overflow-y: auto;
    background-color: var(--bg-paper);
    position: relative;
    border-left: none;
    display: flex;
    flex-direction: column;
  }

  .reader-header-bar {
    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
    height: 48px;
    display: flex;
    align-items: center;
    padding: 0 24px;
    background: transparent;
    z-index: 40;
    flex-shrink: 0;
    pointer-events: none;
  }

  .toggle-list-btn {
    pointer-events: auto;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.2s ease;
    box-shadow: var(--shadow-paper);
    outline: none;
    margin-top: 16px;
  }

  .toggle-list-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
    box-shadow: var(--shadow-paper-lift);
  }

  .reader-content-wrapper {
    max-width: 860px;
    width: 100%;
    margin: 0 auto;
    padding: 40px 24px;
  }

  .note-paper {
    background: #ffffff; /* Crisp white paper */
    border: 1px solid var(--border-fine);
    border-radius: 8px;
    padding: 48px;
    box-shadow: var(--shadow-paper-lift);
    min-height: 100%;
    text-align: left;
  }

  .note-header {
    border-bottom: 1px dashed var(--border-fine);
    padding-bottom: 24px;
    margin-bottom: 30px;
  }

  .note-header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 18px;
  }

  .note-header-top h1 {
    font-size: 26px;
    line-height: 1.3;
    font-family: var(--font-serif);
    font-weight: 700;
  }

  .metadata-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
  }

  .meta-row {
    display: flex;
    gap: 12px;
    line-height: 1.4;
  }

  .meta-row.align-center {
    align-items: center;
  }

  .meta-label {
    color: var(--text-muted);
    font-weight: 500;
    width: 80px;
    flex-shrink: 0;
  }

  .meta-value {
    color: var(--text-ink);
    word-break: break-all;
  }

  .meta-tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .font-mono {
    font-family: monospace;
  }

  .text-layout {
    margin-bottom: 40px;
  }

  /* Attachments Section */
  .attachments-shelf {
    border-top: 1px dashed var(--border-fine);
    padding-top: 30px;
    margin-top: 30px;
  }

  .attachments-shelf h3 {
    font-family: var(--font-sans);
    font-size: 15px;
    margin-bottom: 16px;
    color: var(--text-ink);
    font-weight: 600;
  }

  .attachments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .attachment-item {
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    box-shadow: var(--shadow-paper);
    transition: all 0.2s ease;
  }

  .attachment-item:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-paper-lift);
  }

  .att-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .att-name {
    font-weight: 600;
    font-size: 13px;
    color: var(--text-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .att-size {
    font-size: 11px;
    color: var(--text-muted);
  }

  .att-desc {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .download-btn {
    padding: 8px 12px;
    font-size: 12px;
    width: 100%;
    margin-top: 4px;
  }

  /* Empty / No Selection State */
  .no-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    padding: 40px;
    text-align: center;
  }

  .book-icon {
    font-size: 64px;
    margin-bottom: 18px;
    opacity: 0.75;
    animation: bookPulse 2s infinite ease-in-out;
  }

  @keyframes bookPulse {
    0% { transform: scale(1); opacity: 0.75; }
    50% { transform: scale(1.05); opacity: 0.9; }
    100% { transform: scale(1); opacity: 0.75; }
  }

  .no-selection h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-ink);
  }

  .no-selection p {
    font-size: 13.5px;
    color: var(--text-muted);
    max-width: 380px;
    line-height: 1.5;
  }

  /* Loading State & Spinner */
  .detail-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
  }

  .detail-loading .spinner {
    font-size: 40px;
    animation: bounce 1s infinite alternate;
    margin-bottom: 12px;
  }

  @keyframes bounce {
    from { transform: translateY(0); }
    to { transform: translateY(-10px); }
  }

  .loading-state, .empty-state {
    padding: 40px;
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
  }

  .error-msg {
    background: #fff5f5;
    border: 1px solid #feb2b2;
    color: #c53030;
    padding: 10px 14px;
    border-radius: 4px;
    font-size: 13px;
    text-align: left;
  }
</style>
