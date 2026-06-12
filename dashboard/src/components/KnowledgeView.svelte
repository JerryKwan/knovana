<script lang="ts">
  import { onMount } from "svelte";
  import { request, getApiUrl, getToken } from "../lib/api";
  import { router } from "../lib/router.svelte";
  import { marked } from "marked";
  import DOMPurify from "dompurify";

  interface Attachment {
    name: string;
    description?: string;
    size?: number;
    mime_type?: string;
  }

  interface KnowledgeEntry {
    id: string;
    title: string;
    content: string;
    tags: string[];
    source_url?: string;
    attachments: Attachment[];
    created_at: string;
    updated_at: string;
  }

  let { id, isBlocked = false } = $props<{ id: string; isBlocked?: boolean }>();

  let selectedEntry = $state<KnowledgeEntry | null>(null);
  let loadingDetail = $state(false);
  let errorMsg = $state("");

  // Deletion state
  let deleteConfirmActive = $state(false);
  let deleteTimeout: any = null;

  // Fetch detailed entry content
  async function loadEntry() {
    if (isBlocked || !id) return;
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

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Parse headers from markdown content to construct Table of Contents (TOC)
  const toc = $derived(() => {
    if (!selectedEntry) return [];
    const raw = selectedEntry.content;
    const lines = raw.split("\n");
    const headings: Array<{ level: number; text: string; id: string }> = [];
    let headingCount = 0;
    
    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const rawText = match[2].replace(/<[^>]*>/g, "").trim(); // Strip HTML if any
        const cleanText = rawText.replace(/[#*`_[\]]/g, "").trim(); // Strip markdown decorators
        const anchorId = slugify(cleanText) || `heading-${headingCount++}`;
        headings.push({ level, text: cleanText, id: anchorId });
      }
    });
    return headings;
  });

  // Calculate dir path to fetch relative assets correctly
  function getNoteDir(noteId: string): string {
    const parts = noteId.split("/");
    parts.pop(); // remove file name (e.g. index.md)
    return parts.join("/");
  }

  // Compile markdown to HTML with proper heading IDs and asset paths
  const compiledContent = $derived(() => {
    if (!selectedEntry) return "";
    const rawMarkdown = selectedEntry.content;
    const noteDir = getNoteDir(selectedEntry.id);
    
    // Parse markdown to HTML
    let html = marked.parse(rawMarkdown) as string;

    // Sanitize HTML
    html = DOMPurify.sanitize(html);

    // Inject heading IDs for TOC anchors
    let headingCount = 0;
    html = html.replace(/<h([1-3])>(.*?)<\/h\1>/gi, (match, level, text) => {
      const cleanText = text.replace(/<[^>]*>/g, "").trim();
      const slug = slugify(cleanText) || `heading-${headingCount++}`;
      return `<h${level} id="${slug}">${text}</h${level}>`;
    });

    // Rewrite relative assets path: src="assets/image.png" -> absolute API path
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

  // Helper to generate full attachment URL
  function getAttachmentUrl(attName: string): string {
    if (!selectedEntry) return "";
    const noteDir = getNoteDir(selectedEntry.id);
    let serveUrl = getApiUrl(`/api/v1/attachments/notes/${noteDir}/assets/${encodeURIComponent(attName)}`);
    const token = getToken();
    if (token) {
      serveUrl += `?token=${encodeURIComponent(token)}`;
    }
    return serveUrl;
  }

  // Double-click/Timeout delete note logic
  function clickDelete() {
    if (!selectedEntry) return;
    if (!deleteConfirmActive) {
      deleteConfirmActive = true;
      deleteTimeout = setTimeout(() => {
        deleteConfirmActive = false;
      }, 3000);
    } else {
      if (deleteTimeout) {
        clearTimeout(deleteTimeout);
        deleteTimeout = null;
      }
      deleteConfirmActive = false;
      executeDelete(selectedEntry.id);
    }
  }

  async function executeDelete(noteId: string) {
    errorMsg = "";
    const res = await request(`/api/v1/knowledge/${encodeURIComponent(noteId)}`, {
      method: "DELETE",
    });

    if (res.error) {
      errorMsg = res.error.message;
    } else {
      router.navigate("/dashboard/knowledge");
    }
  }

  function formatBytes(bytes?: number): string {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function formatDate(isoStr?: string): string {
    if (!isoStr) return "";
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr || "";
    }
  }

  function getFileExt(attName: string): string {
    return attName.split('.').pop()?.toUpperCase() || 'FILE';
  }

  function isImage(attName: string): boolean {
    const ext = attName.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
  }

  onMount(() => {
    loadEntry();
  });

  // Track scroll section to highlight active TOC heading (Scroll Spy)
  let activeTocId = $state<string>("");
  let scrollContainer = $state<HTMLElement | null>(null);

  function handleScroll(e: Event) {
    const headings = toc();
    if (headings.length === 0) return;

    let currentActive = "";
    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Check if heading has scrolled past or is near the top of browser viewport
        if (rect.top <= 140) {
          currentActive = heading.id;
        } else {
          break;
        }
      }
    }
    activeTocId = currentActive || headings[0].id;
  }
</script>

<div class="kb-reader-container">
  <!-- Control bar -->
  <div class="reader-control-bar">
    <button class="paper-button" onclick={() => router.navigate("/dashboard/knowledge")} title="返回条目列表">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      返回列表
    </button>

    <div class="control-actions">
      {#if selectedEntry}
        <!-- Edit note -->
        <button class="paper-button" onclick={() => router.navigate(`/dashboard/knowledge/edit/${encodeURIComponent(id)}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          编辑条目
        </button>

        <!-- Source link if exists -->
        {#if selectedEntry.source_url}
          <a class="paper-button" href={selectedEntry.source_url} target="_blank" rel="noopener noreferrer" title="查看原始网页链接">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            源网页
          </a>
        {/if}

        <!-- Delete note with countdown -->
        <button 
          class="paper-button danger {deleteConfirmActive ? 'confirming' : ''}" 
          onclick={clickDelete}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          {deleteConfirmActive ? '确认删除？(3s)' : '删除条目'}
        </button>
      {/if}
    </div>
  </div>

  {#if errorMsg}
    <div class="error-msg">⚠️ {errorMsg}</div>
  {/if}

  {#if loadingDetail}
    <div class="reader-loading">
      <div class="spinner">📖</div>
      <p>正在检索条目内容...</p>
    </div>
  {:else if selectedEntry}
    <!-- Content Body with optional TOC -->
    <div class="reader-body-layout">
      <!-- Left sidebar: Scroll-Spy TOC -->
      {#if toc().length > 0}
        <aside class="reader-toc-pane">
          <div class="toc-title">条目大纲</div>
          <nav class="toc-nav">
            {#each toc() as heading}
              <a 
                href="#{heading.id}" 
                class="toc-item level-{heading.level} {activeTocId === heading.id ? 'active' : ''}"
                onclick={(e) => {
                  e.preventDefault();
                  document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                  activeTocId = heading.id;
                }}
              >
                {heading.text}
              </a>
            {/each}
          </nav>
        </aside>
      {/if}

      <!-- Center Pane: Scrollable Reader Paper -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <article 
        bind:this={scrollContainer} 
        class="reader-paper-pane"
        onscroll={handleScroll}
      >
        <!-- Header details -->
        <header class="paper-header">
          <div class="paper-category-tag">
            分类: <span>{selectedEntry.id.split('/')[0].toUpperCase()}</span>
          </div>
          <h1 class="paper-title">{selectedEntry.title}</h1>
          <div class="paper-metadata">
            <span class="meta-date">修撰于 {formatDate(selectedEntry.updated_at || selectedEntry.created_at)}</span>
            {#if selectedEntry.tags && selectedEntry.tags.length > 0}
              <div class="meta-tags-row">
                {#each selectedEntry.tags as tag}
                  <span class="book-tag">#{tag}</span>
                {/each}
              </div>
            {/if}
          </div>
        </header>

        <!-- Markdown body content -->
        <div class="markdown-body paper-content">
          {@html compiledContent()}
        </div>

        <!-- Attachment shelf -->
        {#if selectedEntry.attachments && selectedEntry.attachments.length > 0}
          <section class="paper-attachments-shelf">
            <h4 class="shelf-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              关联附件（{selectedEntry.attachments.length}）
            </h4>
            <div class="attachments-grid">
              {#each selectedEntry.attachments as att}
                <div class="attachment-card">
                  <div class="att-icon-badge {getFileExt(att.name).toLowerCase()}">
                    {getFileExt(att.name)}
                  </div>
                  <div class="att-card-details">
                    <span class="att-name" title={att.name}>{att.name}</span>
                    <span class="att-size">{formatBytes(att.size)}</span>
                  </div>
                  <div class="att-card-actions">
                    <a href={getAttachmentUrl(att.name)} download={att.name} class="att-action-btn" title="下载附件">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    </a>
                    {#if isImage(att.name)}
                      <a href={getAttachmentUrl(att.name)} target="_blank" class="att-action-btn" title="在新窗口预览">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </a>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      </article>
    </div>
  {:else}
    <div class="empty-state">
      未找到对应条目，可能已被删除或路径不正确。
    </div>
  {/if}
</div>

<style>
  .kb-reader-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-paper);
  }

  .reader-control-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 30px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-fine);
    z-index: 10;
  }

  .control-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .reader-control-bar button.danger {
    border-color: #fca5a5;
    color: #ef4444;
  }

  .reader-control-bar button.danger:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .reader-control-bar button.danger.confirming {
    background: #ef4444;
    color: #fff;
    border-color: #ef4444;
    animation: flashConfirm 1s infinite alternate;
  }

  @keyframes flashConfirm {
    from { opacity: 0.8; }
    to { opacity: 1; }
  }

  .error-msg {
    color: #c53030;
    font-size: 14px;
    padding: 10px 20px;
    background: #fff5f5;
    border-bottom: 1px solid #feb2b2;
  }

  .reader-loading, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--text-muted);
  }

  .reader-loading .spinner {
    font-size: 36px;
    margin-bottom: 12px;
    animation: bounce 1.5s infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  /* Core Layout splits */
  .reader-body-layout {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  /* TOC Sidebar */
  .reader-toc-pane {
    width: 240px;
    border-right: 1px solid var(--border-fine);
    background: var(--bg-card);
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex-shrink: 0;
  }

  .toc-title {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-family: var(--font-sans);
  }

  .toc-nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .toc-item {
    font-size: 13px;
    color: var(--text-muted);
    text-decoration: none;
    line-height: 1.4;
    transition: all 0.15s ease;
    border-left: 2px solid transparent;
    padding-left: 10px;
    text-align: left;
  }

  .toc-item:hover {
    color: var(--text-ink);
    border-left-color: var(--border-fine);
  }

  .toc-item.active {
    color: var(--accent-ochre);
    font-weight: 600;
    border-left-color: var(--accent-ochre);
  }

  .toc-item.level-2 {
    margin-left: 10px;
    font-size: 12.5px;
  }

  .toc-item.level-3 {
    margin-left: 20px;
    font-size: 12px;
  }

  /* Center reading pane */
  .reader-paper-pane {
    flex: 1;
    overflow-y: auto;
    padding: 40px 60px 80px 60px;
    scroll-behavior: smooth;
  }

  .paper-header {
    max-width: 780px;
    margin: 0 auto 36px auto;
    border-bottom: 1px dashed var(--border-fine);
    padding-bottom: 24px;
    text-align: left;
  }

  .paper-category-tag {
    font-size: 11px;
    font-weight: 700;
    color: var(--accent-ochre);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: var(--font-sans);
    margin-bottom: 8px;
  }

  .paper-title {
    font-family: var(--font-serif);
    font-size: 30px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--text-ink);
    margin-bottom: 14px;
  }

  .paper-metadata {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .meta-date {
    font-size: 12px;
    color: var(--text-muted);
  }

  .meta-tags-row {
    display: flex;
    gap: 6px;
  }

  .book-tag {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--bg-card);
    padding: 1px 7px;
    border-radius: 10px;
    border: 1px solid var(--border-fine);
    font-weight: 500;
  }

  .paper-content {
    max-width: 780px;
    margin: 0 auto;
    text-align: left;
  }

  /* Attachments Section */
  .paper-attachments-shelf {
    max-width: 780px;
    margin: 50px auto 0 auto;
    border-top: 1px solid var(--border-fine);
    padding-top: 24px;
    text-align: left;
  }

  .shelf-title {
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-ink);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .attachments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .attachment-card {
    background: var(--bg-card);
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--shadow-paper);
    min-width: 0;
  }

  .att-icon-badge {
    width: 34px;
    height: 34px;
    border-radius: 4px;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: var(--text-muted);
    font-family: var(--font-sans);
    flex-shrink: 0;
  }

  .att-icon-badge.pdf {
    background: rgba(185, 28, 28, 0.08);
    color: #b91c1c;
    border-color: rgba(185, 28, 28, 0.2);
  }

  .att-icon-badge.png, .att-icon-badge.jpg, .att-icon-badge.jpeg, .att-icon-badge.gif, .att-icon-badge.webp {
    background: rgba(74, 107, 93, 0.08);
    color: var(--accent-sage);
    border-color: rgba(74, 107, 93, 0.2);
  }

  .att-card-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .att-name {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .att-size {
    font-size: 11px;
    color: var(--text-muted);
  }

  .att-card-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .att-action-btn {
    width: 26px;
    height: 26px;
    border-radius: 4px;
    border: 1px solid var(--border-fine);
    background: var(--bg-paper);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .att-action-btn:hover {
    color: var(--text-ink);
    border-color: var(--text-muted);
    background: var(--bg-card-hover);
  }
</style>
