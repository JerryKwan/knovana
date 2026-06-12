<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { request } from "../lib/api";
  import { router } from "../lib/router.svelte";

  interface KnowledgeListItem {
    id: string;
    title: string;
    tags: string[];
    type: string;
    has_attachments: boolean;
    created_at: string;
  }

  let { isBlocked = false } = $props<{ isBlocked?: boolean }>();

  let entries = $state<KnowledgeListItem[]>([]);
  let tags = $state<Array<{ name: string; count: number }>>([]);
  let loadingList = $state(false);

  // View Preference: remember in localStorage
  let viewMode = $state<"grid" | "list">(
    (localStorage.getItem("kn-kb-viewmode") as "grid" | "list") || "grid"
  );

  function toggleViewMode(mode: "grid" | "list") {
    viewMode = mode;
    localStorage.setItem("kn-kb-viewmode", mode);
  }

  // Create modal states
  let showCreateModal = $state(false);
  let newNoteTitle = $state("");
  let newNoteCategory = $state("inbox");
  let newNoteSubCategory = $state("");
  let creatingNote = $state(false);

  // Filters
  let searchVal = $state("");
  let selectedCategory = $state<string>("all");
  let selectedTag = $state<string | null>(null);

  // Tag Popover States
  let showTagPopover = $state(false);
  let tagSearchVal = $state("");
  let tagInput = $state<HTMLInputElement | null>(null);
  let errorMsg = $state("");

  $effect(() => {
    if (showTagPopover && tagInput) {
      tagInput.focus();
    }
  });

  // Global stats state
  let globalStats = $state<{
    total: number;
    inboxCount: number;
    topicsCount: number;
    dailyCount: number;
  }>({
    total: 0,
    inboxCount: 0,
    topicsCount: 0,
    dailyCount: 0,
  });

  const stats = $derived(() => globalStats);

  async function loadStats() {
    if (isBlocked) return;
    const res = await request<{
      total_entries: number;
      categories: {
        inbox: number;
        topics: number;
        daily: number;
      };
    }>("/api/v1/knowledge/stats");

    if (!res.error && res.data) {
      globalStats = {
        total: res.data.total_entries || 0,
        inboxCount: res.data.categories?.inbox || 0,
        topicsCount: res.data.categories?.topics || 0,
        dailyCount: res.data.categories?.daily || 0,
      };
    }
  }

  // Load knowledge list from server
  async function loadList() {
    if (isBlocked) return;
    loadingList = true;
    errorMsg = "";
    try {
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("per_page", "200");
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

  // Load tags
  async function loadTags() {
    if (isBlocked) return;
    const res = await request<{ tags: Array<{ name: string; count: number }> }>(
      "/api/v1/knowledge/tags"
    );
    if (!res.error && res.data) {
      tags = res.data.tags || [];
    }
  }

  function handleCategory(category: string) {
    selectedCategory = category;
    selectedTag = null; // Clear tag filter
    loadList();
  }

  function handleTag(tagName: string | null) {
    selectedTag = selectedTag === tagName ? null : tagName;
    showTagPopover = false;
    loadList();
  }

  // Filter notes locally by search
  const filteredEntries = $derived(() => {
    if (!searchVal) return entries;
    const query = searchVal.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  // Filter and sort tags
  const filteredTags = $derived(() => {
    const sorted = [...tags].sort((a, b) => b.count - a.count);
    if (!tagSearchVal) return sorted;
    const query = tagSearchVal.toLowerCase();
    return sorted.filter((t) => t.name.toLowerCase().includes(query));
  });

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Note creation logic
  async function executeCreateNote() {
    if (!newNoteTitle.trim()) return;
    creatingNote = true;
    try {
      const slug = slugify(newNoteTitle) || "untitled";
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "");

      let folder = newNoteCategory;
      if (newNoteCategory === "topics") {
        folder = `topics/${newNoteSubCategory.trim() || "general"}`;
      }

      const entryId = `${folder}/${dateStr}-${slug}-${timeStr}.md`;

      const res = await request<{ id: string; status: string }>(
        `/api/v1/knowledge/${encodeURIComponent(entryId)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: newNoteTitle,
            content: `# ${newNoteTitle}\n\n开始编写您的条目内容...`,
            tags: [],
          }),
        }
      );

      if (res.error) {
        alert(`创建条目失败: ${res.error.message}`);
      } else {
        showCreateModal = false;
        newNoteTitle = "";
        newNoteSubCategory = "";
        // Redirect directly to the Edit view for the newly created note!
        router.navigate(`/dashboard/knowledge/edit/${encodeURIComponent(entryId)}`);
      }
    } finally {
      creatingNote = false;
    }
  }

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

  function formatDate(isoStr?: string): string {
    if (!isoStr) return "";
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return isoStr || "";
    }
  }

  onMount(() => {
    if (!isBlocked) {
      loadList();
      loadTags();
      loadStats();
    }
    window.addEventListener("click", handleGlobalClick);
  });

  onDestroy(() => {
    window.removeEventListener("click", handleGlobalClick);
  });
</script>

<div class="kb-list-container">
  {#if isBlocked}
    <div class="blocked-card paper-card">
      <h3>🔒 知识库已锁定</h3>
      <p>您的账户目前处于待激活状态，暂时无法浏览或阅读知识库。请联系系统管理员进行激活。</p>
    </div>
  {:else}
    <!-- Academic Stat Cards -->
    <div class="stats-row">
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        class="stats-card {selectedCategory === 'all' ? 'active' : ''}" 
        onclick={() => handleCategory("all")}
      >
        <span class="stats-label">条目总数</span>
        <span class="stats-value">{stats().total}</span>
        <span class="stats-desc">全部记录与收录的知识条目</span>
      </div>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        class="stats-card {selectedCategory === 'inbox' ? 'active' : ''}" 
        onclick={() => handleCategory("inbox")}
      >
        <span class="stats-label">收集箱</span>
        <span class="stats-value">{stats().inboxCount}</span>
        <span class="stats-desc">插件剪藏或未归档的条目</span>
      </div>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        class="stats-card {selectedCategory === 'topics' ? 'active' : ''}" 
        onclick={() => handleCategory("topics")}
      >
        <span class="stats-label">归档专题</span>
        <span class="stats-value">{stats().topicsCount}</span>
        <span class="stats-desc">已分类归档的主题研究条目</span>
      </div>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        class="stats-card {selectedCategory === 'daily' ? 'active' : ''}" 
        onclick={() => handleCategory("daily")}
      >
        <span class="stats-label">日志随笔</span>
        <span class="stats-value">{stats().dailyCount}</span>
        <span class="stats-desc">记录的日常碎片与日志条目</span>
      </div>
    </div>

    <!-- Toolbar, Filter and Toggle View Controls -->
    <div class="toolbar-row">
      <div class="toolbar-left">
        <!-- Search -->
        <div class="search-input-wrapper">
          <svg class="search-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            class="paper-input"
            placeholder="搜索条目标题或标签..."
            bind:value={searchVal}
          />
        </div>

        <!-- Tag Trigger Dropdown -->
        <div class="tag-filter-bar">
          <button class="tag-trigger-btn {selectedTag ? 'active' : ''}" onclick={() => showTagPopover = !showTagPopover}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.39.39 1.02.39 1.41 0l7.59-7.59c.39-.39.39-1.02 0-1.41L12 2z"/><path d="m7 7-.01.01"/></svg>
            {#if selectedTag}
              标签: #{selectedTag}
            {:else}
              按标签筛选
            {/if}
          </button>

          {#if selectedTag}
            <span class="active-tag-pill">
              #{selectedTag}
              <button class="clear-tag-btn-inline" onclick={() => handleTag(null)} title="清除标签">×</button>
            </span>
          {/if}

          {#if showTagPopover}
            <div class="tag-popover">
              <div class="tag-popover-search">
                <input
                  bind:this={tagInput}
                  type="text"
                  class="paper-input tag-search"
                  placeholder="检索标签..."
                  bind:value={tagSearchVal}
                />
              </div>
              <div class="tag-popover-list">
                {#if filteredTags().length === 0}
                  <div class="no-tags-found">无匹配标签</div>
                {:else}
                  {#each filteredTags() as tag}
                    <button class="tag-option {selectedTag === tag.name ? 'active' : ''}" onclick={() => handleTag(tag.name)}>
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

      <div class="toolbar-right">
        <!-- View Mode Switcher -->
        <div class="viewmode-toggle-group">
          <button 
            class="viewmode-btn {viewMode === 'grid' ? 'active' : ''}" 
            onclick={() => toggleViewMode("grid")}
            title="纸质卡片网格"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          </button>
          <button 
            class="viewmode-btn {viewMode === 'list' ? 'active' : ''}" 
            onclick={() => toggleViewMode("list")}
            title="极简标准列表"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Create Button -->
        <button class="paper-button primary" onclick={() => showCreateModal = true}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>
          </svg>
          新建条目
        </button>
      </div>
    </div>

    <!-- Errors -->
    {#if errorMsg}
      <div class="error-msg">⚠️ {errorMsg}</div>
    {/if}

    <!-- Content Workspace -->
    <div class="list-workspace">
      {#if loadingList}
        <div class="loading-state">正在检索条目列表...</div>
      {:else if filteredEntries().length === 0}
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.35; margin-bottom: 12px;"><path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="8"/></svg>
          没有符合条件的条目
        </div>
      {:else if viewMode === "grid"}
        <!-- Grid View (Scholar Paper Slip Card Style) -->
        <div class="books-grid-layout">
          {#each filteredEntries() as entry}
            {@const cat = entry.id.split('/')[0]}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="scholar-card-item" 
              onclick={() => router.navigate(`/dashboard/knowledge/view/${encodeURIComponent(entry.id)}`)}
            >
              <div class="card-header">
                <div class="category-badge cat-{cat}">
                  <span class="dot-indicator"></span>
                  {cat === 'inbox' ? '收集箱' : cat === 'topics' ? '专题' : cat === 'daily' ? '随笔' : cat}
                </div>
                <span class="card-date">{formatDate(entry.created_at)}</span>
              </div>
              
              <h3 class="card-title">{entry.title}</h3>
              
              <div class="card-footer">
                <div class="card-tags" title={entry.tags && entry.tags.length > 0 ? entry.tags.map(t => '#' + t).join(' ') : '无标签'}>
                  {#if entry.tags && entry.tags.length > 0}
                    {#each entry.tags.slice(0, 3) as tag}
                      <span class="book-tag">#{tag}</span>
                    {/each}
                    {#if entry.tags.length > 3}
                      <span class="more-tags-badge">+{entry.tags.length - 3}</span>
                    {/if}
                  {:else}
                    <span class="no-tags-placeholder">无标签</span>
                  {/if}
                </div>
                
                <div class="card-status-icons">
                  {#if entry.has_attachments}
                    <svg class="paperclip-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <title>包含附件</title>
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  {/if}
                  {#if entry.type === 'excerpt'}
                    <svg class="quote-icon" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px;">
                      <title>摘录</title>
                      <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M4 14h4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/>
                    </svg>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <!-- List View (Minimialist Standard Rows) -->
        <div class="list-rows-layout">
          <div class="list-header-row">
            <div class="col-title">标题</div>
            <div class="col-type">类别</div>
            <div class="col-tags">标签</div>
            <div class="col-date">创建日期</div>
          </div>
          <div class="list-body">
            {#each filteredEntries() as entry}
              {@const cat = entry.id.split('/')[0]}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div 
                class="list-row-item" 
                onclick={() => router.navigate(`/dashboard/knowledge/view/${encodeURIComponent(entry.id)}`)}
              >
                <div class="col-title">{entry.title}</div>
                <div class="col-type">
                  <span class="note-type" class:excerpt={entry.type === 'excerpt'} class:note={entry.type === 'note'}>
                    {cat === 'inbox' ? '收集箱' : cat === 'topics' ? '专题' : cat === 'daily' ? '随笔' : cat}
                  </span>
                </div>
                <div class="col-tags">
                  {#if entry.tags && entry.tags.length > 0}
                    <div class="row-tags-list" title={entry.tags.map(t => '#' + t).join(' ')}>
                      {#each entry.tags.slice(0, 4) as tag}
                        <span class="book-tag">#{tag}</span>
                      {/each}
                      {#if entry.tags.length > 4}
                        <span class="more-tags-badge">+{entry.tags.length - 4}</span>
                      {/if}
                    </div>
                  {:else}
                    <span class="text-muted" style="font-size: 11px; font-style: italic;">无标签</span>
                  {/if}
                </div>
                <div class="col-date text-muted">{formatDate(entry.created_at)}</div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Create Modal -->
  {#if showCreateModal}
    <div class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>新建知识条目</h3>
          <button class="modal-close-btn" onclick={() => showCreateModal = false} aria-label="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group" style="margin-bottom: 16px;">
            <label for="new-note-title" style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">条目标题:</label>
            <input 
              id="new-note-title" 
              type="text" 
              class="paper-input" 
              placeholder="请输入标题..." 
              bind:value={newNoteTitle} 
              onkeydown={(e) => e.key === 'Enter' && executeCreateNote()}
            />
          </div>
          <div class="form-group" style="margin-bottom: 16px;">
            <label for="new-note-cat" style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">归档位置:</label>
            <select id="new-note-cat" class="paper-input" bind:value={newNoteCategory} style="background: var(--bg-paper);">
              <option value="inbox">📥 收集箱 (待整理)</option>
              <option value="topics">📚 归档专题 (主题分组)</option>
              <option value="daily">📝 随笔日记 (日记记录)</option>
            </select>
          </div>
          {#if newNoteCategory === 'topics'}
            <div class="form-group animate-slide-down" style="margin-bottom: 16px;">
              <label for="new-note-subcat" style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px;">专题分类目录 (仅限英文文件夹名，默认 general):</label>
              <input id="new-note-subcat" type="text" class="paper-input" placeholder="例如: web-dev, deep-learning..." bind:value={newNoteSubCategory} />
            </div>
          {/if}
        </div>
        <div class="modal-footer">
          <button class="paper-button" onclick={() => showCreateModal = false}>取消</button>
          <button class="paper-button primary" onclick={executeCreateNote} disabled={creatingNote || !newNoteTitle.trim()}>
            {creatingNote ? '正在建立条目...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .kb-list-container {
    padding: 30px;
    height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: var(--bg-paper);
  }

  .blocked-card {
    background: #fff5f5;
    border: 1px solid #feb2b2;
    border-radius: 6px;
    padding: 40px;
    text-align: center;
    margin: 40px auto;
    max-width: 600px;
    box-shadow: var(--shadow-paper);
  }

  .blocked-card h3 {
    color: #c53030;
    margin-bottom: 16px;
    font-size: 18px;
    border-bottom: 1px dashed #fed7d7;
    padding-bottom: 10px;
  }

  .blocked-card p {
    color: #9b2c2c;
    font-size: 14px;
  }

  .error-msg {
    color: #c53030;
    font-size: 14px;
    padding: 10px 14px;
    background: #fff5f5;
    border: 1px solid #feb2b2;
    border-radius: 4px;
  }

  /* Stats Layout */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
  }

  .stats-card {
    background: #fdfcf9; /* Premium raised white paper backdrop */
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    padding: 18px 20px;
    box-shadow: 0 1px 3px rgba(35, 33, 28, 0.03);
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .stats-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-paper-lift);
    border-color: var(--text-muted);
  }

  .stats-card.active {
    border-color: var(--accent-ochre);
    background: #fffdfa; /* Parched warm paper tone */
    box-shadow: var(--shadow-paper-lift);
    transform: translateY(-2px);
  }

  .stats-card.active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--accent-ochre);
  }

  .stats-card .stats-label {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 600;
    font-family: var(--font-sans);
    letter-spacing: 0.02em;
  }

  .stats-card .stats-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-ink);
    font-family: var(--font-serif);
    line-height: 1.1;
  }

  .stats-card .stats-desc {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
    line-height: 1.3;
  }

  /* Toolbar Controls */
  .toolbar-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    background: var(--bg-card);
    padding: 12px 18px;
    border-radius: 8px;
    border: 1px solid var(--border-fine);
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    flex: 1;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search-input-wrapper {
    position: relative;
    min-width: 260px;
    flex: 2;
  }

  .search-input-wrapper input {
    padding-left: 36px;
    height: 36px;
    border-radius: 6px;
    background: rgba(35, 33, 28, 0.03);
    border: 1px solid rgba(178, 90, 56, 0.1);
    font-size: 13px;
    outline: none;
    width: 100%;
    color: var(--text-ink);
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .search-input-wrapper input:focus {
    border-color: var(--accent-ochre);
    box-shadow: 0 1px 4px rgba(178, 90, 56, 0.05), 0 0 0 2px rgba(178, 90, 56, 0.1);
    background: #ffffff;
  }

  .search-icon-svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }

  /* Tag filter elements */
  .tag-filter-bar {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tag-trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 14px;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    font-family: var(--font-sans);
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tag-trigger-btn:hover {
    border-color: var(--text-muted);
    color: var(--text-ink);
  }

  .tag-trigger-btn.active {
    background: var(--bg-card-hover);
    border-color: var(--accent-ochre);
    color: var(--accent-ochre);
    font-weight: 600;
  }

  .active-tag-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 12px;
    background: var(--bg-card-hover);
    border: 1.5px dashed var(--accent-ochre);
    border-radius: 6px;
    font-size: 12.5px;
    color: var(--accent-ochre);
    font-weight: 600;
    font-family: var(--font-sans);
  }

  .clear-tag-btn-inline {
    border: none;
    background: transparent;
    color: var(--accent-ochre);
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease;
  }

  .clear-tag-btn-inline:hover {
    color: var(--accent-terracotta);
  }

  /* Tag Popover Dropdown */
  .tag-popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 1000;
    width: 260px;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 8px;
    box-shadow: var(--shadow-paper-lift);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: fadeIn 0.15s ease-out;
  }

  .tag-popover-search input {
    height: 32px;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 4px;
  }

  .tag-popover-list {
    max-height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tag-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 10px;
    border-radius: 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: var(--font-sans);
    text-align: left;
  }

  .tag-option:hover {
    background: var(--bg-card-hover);
  }

  .tag-option.active {
    background: var(--bg-card-hover);
    color: var(--accent-ochre);
    font-weight: 600;
  }

  .tag-option .tag-name {
    font-size: 13px;
    color: var(--text-ink);
  }

  .tag-option.active .tag-name {
    color: var(--accent-ochre);
  }

  .tag-option .tag-count {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--bg-paper);
    padding: 1px 5px;
    border-radius: 10px;
    border: 1px solid var(--border-fine);
  }

  .no-tags-found {
    padding: 12px;
    text-align: center;
    color: var(--text-muted);
    font-size: 12px;
  }

  /* View Mode Toggle Group */
  .viewmode-toggle-group {
    display: flex;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    padding: 2px;
    height: 36px;
    align-items: center;
  }

  .viewmode-btn {
    width: 30px;
    height: 30px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .viewmode-btn:hover {
    color: var(--text-ink);
    background: var(--bg-card-hover);
  }

  .viewmode-btn.active {
    background: var(--bg-card-hover);
    color: var(--accent-ochre);
  }

  .toolbar-right .paper-button.primary {
    height: 36px;
    padding: 0 14px;
    border-radius: 6px;
    font-size: 12.5px;
    background: var(--accent-ochre);
    border: 1px solid var(--accent-ochre);
    color: #fff;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .toolbar-right .paper-button.primary:hover {
    background: var(--accent-terracotta);
    border-color: var(--accent-terracotta);
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(178, 90, 56, 0.15);
  }

  /* Grid Scholar Index Card Style Layout */
  .books-grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    padding: 4px 0;
  }

  .scholar-card-item {
    background: #fdfcf9; /* Premium white stationery paper */
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    padding: 16px 20px;
    box-shadow: 0 1px 3px rgba(35, 33, 28, 0.03);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 125px;
    transition: all 0.22s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    text-align: left;
  }

  .scholar-card-item:hover {
    transform: translateY(-2px);
    background: #fff;
    border-color: var(--text-muted);
    box-shadow: 0 4px 12px rgba(35, 33, 28, 0.05), 0 1px 2px rgba(35, 33, 28, 0.03);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-sans);
    color: var(--text-muted);
  }

  .dot-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
  }

  /* Indicator colors for categories */
  .category-badge.cat-inbox .dot-indicator {
    background-color: #78716c; /* Stone gray */
  }
  .category-badge.cat-topics .dot-indicator {
    background-color: var(--accent-ochre); /* Terracotta */
  }
  .category-badge.cat-daily .dot-indicator {
    background-color: var(--accent-sage); /* Sage green */
  }

  .card-date {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-sans);
  }

  .card-title {
    font-family: var(--font-serif);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.45;
    color: var(--text-ink);
    margin-bottom: 16px;
    margin-top: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.15s ease;
  }

  .scholar-card-item:hover .card-title {
    color: var(--accent-ochre);
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-width: 0;
  }

  .no-tags-placeholder {
    font-size: 10px;
    color: var(--text-muted);
    font-style: italic;
  }

  .book-tag {
    font-size: 10.5px;
    color: var(--text-muted);
    background: var(--bg-paper);
    padding: 1px 7px;
    border-radius: 4px;
    border: 1.5px dashed var(--border-fine); /* Scholar draft note style! */
    font-weight: 500;
    font-family: var(--font-sans);
  }

  .more-tags-badge {
    font-size: 10.5px;
    color: var(--text-muted);
    background: var(--bg-paper);
    padding: 1px 5px;
    border-radius: 4px;
    border: 1.5px dashed var(--border-fine);
    cursor: help;
    font-weight: 500;
    font-family: var(--font-sans);
    transition: all 0.15s ease;
  }

  .more-tags-badge:hover {
    color: var(--accent-ochre);
    border-color: var(--accent-ochre);
    background: var(--bg-card-hover);
  }

  .card-status-icons {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .paperclip-icon, .quote-icon {
    opacity: 0.6;
    transition: opacity 0.15s ease;
  }

  .scholar-card-item:hover .paperclip-icon,
  .scholar-card-item:hover .quote-icon {
    opacity: 1;
    color: var(--text-ink);
  }

  /* List Table Layout */
  .list-rows-layout {
    background: #fdfcf9;
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(35, 33, 28, 0.03);
    display: flex;
    flex-direction: column;
    padding: 8px 0;
  }

  .list-header-row {
    display: grid;
    grid-template-columns: 2.2fr 1.2fr 3.2fr 1.4fr;
    gap: 16px;
    padding: 12px 24px;
    border-bottom: 1px solid var(--border-fine);
    font-weight: 600;
    font-size: 12px;
    color: var(--text-muted);
    font-family: var(--font-sans);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: left;
  }

  .list-body {
    display: flex;
    flex-direction: column;
  }

  .list-row-item {
    display: grid;
    grid-template-columns: 2.2fr 1.2fr 3.2fr 1.4fr;
    gap: 16px;
    padding: 14px 24px;
    align-items: center;
    border-bottom: 1px solid var(--border-fine);
    cursor: pointer;
    transition: background 0.15s ease;
    text-align: left;
  }

  .list-row-item:last-child {
    border-bottom: none;
  }

  .list-row-item:hover {
    background: var(--bg-card-hover);
  }

  .list-row-item .col-title {
    font-family: var(--font-serif);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-ink);
    transition: color 0.15s ease;
  }

  .list-row-item:hover .col-title {
    color: var(--accent-ochre);
  }

  .row-tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .list-workspace {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: var(--text-muted);
    font-size: 14px;
    flex: 1;
  }

  .empty-state {
    border: 1.5px dashed var(--border-fine);
    background: var(--bg-card);
    border-radius: 8px;
    padding: 40px;
  }

  /* Form groups inside create modal */
  .form-group label {
    font-family: var(--font-sans);
    color: var(--text-ink);
  }

  .animate-slide-down {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
