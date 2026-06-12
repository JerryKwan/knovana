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

  // Edit states
  let editTitle = $state("");
  let editContent = $state("");
  let editTags = $state<string[]>([]);
  let editSourceUrl = $state("");
  let editAttachments = $state<Attachment[]>([]);
  let savingNote = $state(false);
  
  let editorView = $state<"edit" | "split" | "preview">("split");
  let textareaRef = $state<HTMLTextAreaElement | null>(null);
  let uploadingAttachment = $state(false);
  let isDragOver = $state(false);

  // Fetch detailed entry content for editing
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
      } else if (res.data) {
        selectedEntry = res.data;
        editTitle = res.data.title;
        editContent = res.data.content;
        editTags = [...res.data.tags];
        editSourceUrl = res.data.source_url || "";
        editAttachments = [...(res.data.attachments || [])];
      }
    } finally {
      loadingDetail = false;
    }
  }

  // Calculate dir path to fetch relative assets correctly
  function getNoteDir(noteId: string): string {
    const parts = noteId.split("/");
    parts.pop(); // remove file name (e.g. index.md)
    return parts.join("/");
  }

  // Save changes and navigate back to view page
  async function saveEditing() {
    if (!selectedEntry) return;
    savingNote = true;
    try {
      const res = await request<{ status: string }>(
        `/api/v1/knowledge/${encodeURIComponent(selectedEntry.id)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: editTitle,
            content: editContent,
            tags: editTags,
            source: editSourceUrl,
            attachments: editAttachments,
          }),
        }
      );

      if (res.error) {
        alert(`保存失败: ${res.error.message}`);
      } else {
        router.navigate(`/dashboard/knowledge/view/${encodeURIComponent(selectedEntry.id)}`);
      }
    } finally {
      savingNote = false;
    }
  }

  // Cancel editing
  function cancelEditing() {
    if (selectedEntry) {
      router.navigate(`/dashboard/knowledge/view/${encodeURIComponent(selectedEntry.id)}`);
    } else {
      router.navigate("/dashboard/knowledge");
    }
  }

  // Attachment upload logic
  async function uploadFile(file: File) {
    uploadingAttachment = true;
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = getToken();
      const headers = new Headers();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const res = await fetch(getApiUrl("/api/v1/attachments"), {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const result = await res.json();
      if (result.filename) {
        editAttachments = [
          ...editAttachments,
          {
            name: result.filename,
            size: result.size,
            mime_type: result.mime_type,
            description: "",
          },
        ];
      }
    } catch (err: any) {
      alert(`上传附件失败: ${err.message}`);
    } finally {
      uploadingAttachment = false;
    }
  }

  async function handleUploadAttachment(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    await uploadFile(file);
    input.value = "";
  }

  // Drag and drop attachment handler
  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  }

  // Insert attachment Markdown code
  function insertAttachment(att: Attachment) {
    if (!textareaRef) return;
    const textarea = textareaRef;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const isImg = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
      att.name.split(".").pop()?.toLowerCase() || ""
    );
    const refText = isImg
      ? `![${att.name}](attachments/${att.name})`
      : `[${att.name}](attachments/${att.name})`;

    editContent = text.substring(0, start) + refText + text.substring(end);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + refText.length, start + refText.length);
    }, 0);
  }

  // Remove attachment link
  function removeAttachment(attName: string) {
    editAttachments = editAttachments.filter((a) => a.name !== attName);
  }

  // Compile real-time markdown editor preview with temporary upload support
  const compiledEditPreview = $derived(() => {
    if (!selectedEntry) return "";
    const rawMarkdown = editContent;
    const noteDir = getNoteDir(selectedEntry.id);

    let html = marked.parse(rawMarkdown) as string;
    html = DOMPurify.sanitize(html);

    const token = getToken();

    // 1. Rewrite assets path
    const regex = /src=["']assets\/([^"']+)["']/g;
    let resolvedHtml = html.replace(regex, (match, filename) => {
      let serveUrl = getApiUrl(`/api/v1/attachments/notes/${noteDir}/assets/${filename}`);
      if (token) {
        serveUrl += `?token=${encodeURIComponent(token)}`;
      }
      return `src="${serveUrl}"`;
    });

    // 2. Rewrite temporary attachments path
    const tempRegex = /src=["']attachments\/([^"']+)["']/g;
    resolvedHtml = resolvedHtml.replace(tempRegex, (match, filename) => {
      let serveUrl = getApiUrl(`/api/v1/attachments/file/${filename}`);
      if (token) {
        serveUrl += `?token=${encodeURIComponent(token)}`;
      }
      return `src="${serveUrl}"`;
    });

    return resolvedHtml;
  });

  function formatBytes(bytes?: number): string {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function getFileExt(attName: string): string {
    return attName.split('.').pop()?.toUpperCase() || 'FILE';
  }

  onMount(() => {
    loadEntry();
  });
</script>

<div class="kb-editor-container">
  <!-- Top bar controls -->
  <div class="editor-top-bar">
    <div class="editor-header-title">
      <h2>修改条目</h2>
      {#if selectedEntry}
        <span class="file-path-badge">{selectedEntry.id}</span>
      {/if}
    </div>
    
    <div class="editor-controls">
      <div class="view-toggle segmented-control">
        <button class="segment-btn {editorView === 'edit' ? 'active' : ''}" onclick={() => editorView = 'edit'}>仅编辑</button>
        <button class="segment-btn {editorView === 'split' ? 'active' : ''}" onclick={() => editorView = 'split'}>双栏分屏</button>
        <button class="segment-btn {editorView === 'preview' ? 'active' : ''}" onclick={() => editorView = 'preview'}>仅预览</button>
      </div>

      <div class="action-buttons">
        <button class="paper-button" onclick={cancelEditing}>取消</button>
        <button class="paper-button primary" onclick={saveEditing} disabled={savingNote || !editTitle.trim()}>
          {savingNote ? '正在保存...' : '保存修改'}
        </button>
      </div>
    </div>
  </div>

  {#if errorMsg}
    <div class="error-msg">⚠️ {errorMsg}</div>
  {/if}

  {#if loadingDetail}
    <div class="editor-loading">
      <div class="spinner">✍️</div>
      <p>正在打开条目编辑器...</p>
    </div>
  {:else if selectedEntry}
    <!-- Main editor body split -->
    <div class="editor-body-layout">
      <!-- Workspace: Left Editor Pane & Right Preview Pane -->
      <div class="editor-main-workspace {editorView}">
        <!-- Editor Input Panel -->
        {#if editorView === 'edit' || editorView === 'split'}
          <div class="editor-pane">
            <!-- Title & Source Inputs -->
            <div class="editor-fields-box">
              <div class="form-group">
                <label for="edit-title">标题</label>
                <input id="edit-title" type="text" class="paper-input title-input" bind:value={editTitle} placeholder="输入笔记标题..." />
              </div>
              <div class="form-group">
                <label for="edit-source">来源 URL</label>
                <input id="edit-source" type="text" class="paper-input source-input" bind:value={editSourceUrl} placeholder="例如: https://example.com/article" />
              </div>
            </div>
            
            <!-- Textarea -->
            <textarea
              bind:this={textareaRef}
              class="editor-textarea"
              bind:value={editContent}
              placeholder="请在此输入 Markdown 正文内容..."
            ></textarea>
          </div>
        {/if}
        
        <!-- Live HTML Viewer Panel -->
        {#if editorView === 'preview' || editorView === 'split'}
          <div class="preview-pane markdown-body">
            {#if editorView === 'preview'}
              <!-- Show title in full preview mode -->
              <h1 class="preview-title">{editTitle || '无标题'}</h1>
            {/if}
            {@html compiledEditPreview()}
          </div>
        {/if}
      </div>

      <!-- Collapsible properties sidebar (Metadata, tags & attachments upload) -->
      <aside class="editor-props-sidebar">
        <!-- Tags Manager -->
        <section class="props-section">
          <h4 class="props-section-title">条目标签</h4>
          <div class="tag-input-container">
            <div class="edit-tags-list">
              {#each editTags as tag}
                <span class="note-tag-pill editing">
                  #{tag}
                  <button class="remove-tag-btn" onclick={() => editTags = editTags.filter(t => t !== tag)} title="移除">×</button>
                </span>
              {/each}
            </div>
            <input
              type="text"
              class="paper-input tag-input-box"
              placeholder="输入标签并回车添加"
              onkeydown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim().replace(/^#/, '');
                  if (val && !editTags.includes(val)) {
                    editTags = [...editTags, val];
                  }
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
          </div>
        </section>

        <!-- Attachments shelf -->
        <section class="props-section attachments-shelf">
          <h4 class="props-section-title">关联附件 ({editAttachments.length})</h4>
          
          <!-- Drag & Drop Uploader -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div 
            class="drag-upload-zone {isDragOver ? 'dragover' : ''} {uploadingAttachment ? 'uploading' : ''}"
            ondragover={(e) => { e.preventDefault(); isDragOver = true; }}
            ondragleave={() => { isDragOver = false; }}
            ondrop={handleDrop}
          >
            <input 
              type="file" 
              id="file-upload" 
              class="hidden-file-input" 
              onchange={handleUploadAttachment} 
              disabled={uploadingAttachment}
            />
            <label for="file-upload" class="upload-zone-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m15 15-3-3-3 3"/></svg>
              <span>{uploadingAttachment ? '正在上传文件...' : '拖拽文件至此 或 点击上传'}</span>
            </label>
          </div>

          <!-- Attachments list -->
          {#if editAttachments.length === 0}
            <p class="no-attachments-text">本条目尚无附件</p>
          {:else}
            <div class="edit-attachments-list">
              {#each editAttachments as att}
                <div class="attachment-item-card">
                  <div class="att-type-label">{getFileExt(att.name)}</div>
                  <div class="att-meta">
                    <span class="att-name" title={att.name}>{att.name}</span>
                    <span class="att-size">{formatBytes(att.size)}</span>
                  </div>
                  <div class="att-actions">
                    <button class="att-btn" onclick={() => insertAttachment(att)} title="插入到Markdown光标位置">
                      插入
                    </button>
                    <button class="att-btn danger" onclick={() => removeAttachment(att.name)} title="从条目中解绑附件">
                      解绑
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </section>
      </aside>
    </div>
  {/if}
</div>

<style>
  .kb-editor-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-paper);
  }

  .editor-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 30px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-fine);
    z-index: 10;
  }

  .editor-header-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .editor-header-title h2 {
    font-size: 16px;
    font-weight: 600;
  }

  .file-path-badge {
    font-family: monospace;
    font-size: 11px;
    padding: 2px 8px;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 4px;
    color: var(--text-muted);
  }

  .editor-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .segmented-control {
    display: flex;
    gap: 4px;
    background: var(--bg-paper);
    padding: 2px;
    border-radius: 6px;
    border: 1px solid var(--border-fine);
    height: 34px;
    align-items: center;
  }

  .segment-btn {
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 500;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-sans);
  }

  .segment-btn.active {
    background: var(--bg-card-hover);
    color: var(--accent-ochre);
    font-weight: 600;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .error-msg {
    color: #c53030;
    font-size: 14px;
    padding: 10px 20px;
    background: #fff5f5;
    border-bottom: 1px solid #feb2b2;
  }

  .editor-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--text-muted);
  }

  .editor-loading .spinner {
    font-size: 36px;
    margin-bottom: 12px;
    animation: rotate 2s linear infinite;
  }

  @keyframes rotate {
    from { transform: rotate(0); }
    to { transform: rotate(360deg); }
  }

  /* Body split layout */
  .editor-body-layout {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  /* Workspaces: Split / Edit / Preview */
  .editor-main-workspace {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .editor-main-workspace.edit {
    grid-template-columns: 1fr;
  }

  .editor-main-workspace.preview {
    grid-template-columns: 1fr;
  }

  .editor-main-workspace.split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }

  .editor-pane {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border-fine);
    overflow: hidden;
    background: var(--bg-paper);
  }

  .editor-fields-box {
    padding: 20px;
    border-bottom: 1px solid var(--border-fine);
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--bg-card);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
  }

  .form-group label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    font-family: var(--font-sans);
  }

  .title-input {
    font-size: 15px;
    font-weight: 600;
    font-family: var(--font-serif);
    border-radius: 6px;
  }

  .editor-textarea {
    flex: 1;
    width: 100%;
    border: none;
    resize: none;
    padding: 24px;
    font-family: monospace;
    font-size: 13.5px;
    line-height: 1.6;
    background: var(--bg-paper);
    color: var(--text-ink);
    outline: none;
    overflow-y: auto;
  }

  .preview-pane {
    padding: 40px;
    overflow-y: auto;
    background: var(--bg-paper);
    text-align: left;
  }

  .preview-title {
    font-family: var(--font-serif);
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 24px;
    border-bottom: 1px dashed var(--border-fine);
    padding-bottom: 16px;
  }

  /* Properties Sidebar */
  .editor-props-sidebar {
    width: 280px;
    border-left: 1px solid var(--border-fine);
    background: var(--bg-card);
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
    flex-shrink: 0;
  }

  .props-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: left;
  }

  .props-section-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: var(--font-sans);
    border-bottom: 1px solid var(--border-fine);
    padding-bottom: 6px;
  }

  .tag-input-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .edit-tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .note-tag-pill {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 12px;
    font-size: 11px;
    color: var(--text-muted);
    gap: 4px;
    font-family: var(--font-sans);
    font-weight: 500;
  }

  .remove-tag-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-weight: 700;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    width: 12px;
    height: 12px;
  }

  .remove-tag-btn:hover {
    color: #ef4444;
  }

  .tag-input-box {
    border-radius: 4px;
    height: 32px;
    font-size: 12px;
  }

  /* File drag uploader */
  .drag-upload-zone {
    border: 1.5px dashed var(--border-fine);
    border-radius: 6px;
    padding: 16px;
    text-align: center;
    background: var(--bg-paper);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .drag-upload-zone:hover, .drag-upload-zone.dragover {
    border-color: var(--accent-ochre);
    background: var(--bg-card-hover);
  }

  .drag-upload-zone.uploading {
    opacity: 0.7;
    pointer-events: none;
  }

  .hidden-file-input {
    display: none;
  }

  .upload-zone-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: var(--text-muted);
  }

  .upload-zone-label svg {
    color: var(--text-muted);
  }

  .upload-zone-label span {
    font-size: 11px;
    font-weight: 500;
    font-family: var(--font-sans);
    line-height: 1.3;
  }

  .no-attachments-text {
    font-size: 12px;
    color: var(--text-muted);
    font-style: italic;
  }

  .edit-attachments-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .attachment-item-card {
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 4px;
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .att-type-label {
    font-size: 8.5px;
    font-weight: 700;
    color: var(--text-muted);
    background: var(--bg-card);
    border: 1px solid var(--border-fine);
    padding: 4px 6px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .att-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .att-name {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .att-size {
    font-size: 10px;
    color: var(--text-muted);
  }

  .att-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
  }

  .att-btn {
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 600;
    border-radius: 3px;
    cursor: pointer;
    background: var(--bg-card);
    border: 1px solid var(--border-fine);
    color: var(--text-ink);
    font-family: var(--font-sans);
    transition: all 0.15s ease;
  }

  .att-btn:hover {
    background: var(--bg-card-hover);
  }

  .att-btn.danger {
    color: #b91c1c;
    border-color: rgba(185, 28, 28, 0.15);
  }

  .att-btn.danger:hover {
    background: #fef2f2;
  }
</style>
