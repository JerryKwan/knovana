<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { request, getApiUrl, getToken } from "../lib/api";
  import { router } from "../lib/router.svelte";
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import KLogo from "./KLogo.svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { EditorState } from "@codemirror/state";
  import { markdown } from "@codemirror/lang-markdown";

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
  let editStorageName = $state("");
  let editContent = $state("");
  let editTags = $state<string[]>([]);
  let editSourceUrl = $state("");
  let editAttachments = $state<Attachment[]>([]);
  let savingNote = $state(false);
  
  let editorView = $state<"edit" | "split" | "preview">("split");
  let editorDiv = $state<HTMLDivElement | null>(null);
  let editorViewInstance = $state<EditorView | null>(null);
  let previewPaneRef = $state<HTMLDivElement | null>(null);
  
  let uploadingAttachment = $state(false);
  let isDragOver = $state(false);
  
  // Category states
  let currentCategory = $state("inbox");
  let previousCategory = $state("inbox");
  let newTopicName = $state("");
  let isAddingNewTopic = $state(false);
  let existingCategories = $state<string[]>([]);
  
  // DOM element bindings for auto-growing inputs
  let titleTextareaRef = $state<HTMLTextAreaElement | null>(null);
  let urlTextareaRef = $state<HTMLTextAreaElement | null>(null);
  let storageTextareaRef = $state<HTMLTextAreaElement | null>(null);
  
  // Sidebar states
  let isSidebarCollapsed = $state(false);
  let activeSidebarTab = $state<"properties" | "attachments">("properties");
  let sidebarWidth = $state(320);
  let isResizing = $state(false);

  function handleResizeStart(e: MouseEvent) {
    e.preventDefault();
    isResizing = true;
    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);
  }

  function handleResizeMove(e: MouseEvent) {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 260 && newWidth <= 600) {
      sidebarWidth = newWidth;
    }
  }

  function handleResizeEnd() {
    isResizing = false;
    window.removeEventListener("mousemove", handleResizeMove);
    window.removeEventListener("mouseup", handleResizeEnd);
  }

  // Helper to extract storage name from ID
  function extractStorageName(idStr: string): string {
    const parts = idStr.split("/");
    const lastPart = parts.pop() || "";
    if (lastPart === "index.md") {
      return parts.pop() || "";
    } else {
      return lastPart.replace(/\.md$/, "");
    }
  }

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
        editStorageName = extractStorageName(res.data.id);
        editContent = res.data.content;
        editTags = [...res.data.tags];
        editSourceUrl = res.data.source_url || "";
        editAttachments = [...(res.data.attachments || [])];

        // Determine category
        if (res.data.id.startsWith("daily/")) {
          currentCategory = "daily";
        } else if (res.data.id.startsWith("topics/")) {
          const parts = res.data.id.split("/");
          if (parts.length >= 3) {
            currentCategory = `topics/${parts[1]}`;
          } else {
            currentCategory = "topics/general";
          }
        } else {
          currentCategory = "inbox";
        }
        previousCategory = currentCategory;
      }
    } finally {
      loadingDetail = false;
    }
  }

  $effect(() => {
    if (titleTextareaRef && editTitle !== undefined) {
      titleTextareaRef.style.height = "auto";
      titleTextareaRef.style.height = titleTextareaRef.scrollHeight + "px";
    }
  });

  $effect(() => {
    if (urlTextareaRef && editSourceUrl !== undefined) {
      urlTextareaRef.style.height = "auto";
      urlTextareaRef.style.height = urlTextareaRef.scrollHeight + "px";
    }
  });

  $effect(() => {
    if (storageTextareaRef && editStorageName !== undefined) {
      storageTextareaRef.style.height = "auto";
      storageTextareaRef.style.height = storageTextareaRef.scrollHeight + "px";
    }
  });

  function confirmNewTopic() {
    const cleaned = newTopicName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (cleaned) {
      const catVal = `topics/${cleaned}`;
      if (!existingCategories.includes(catVal)) {
        existingCategories = [...existingCategories, catVal];
      }
      currentCategory = catVal;
      previousCategory = catVal;
    } else {
      currentCategory = previousCategory;
    }
    isAddingNewTopic = false;
    newTopicName = "";
  }

  function cancelNewTopic() {
    currentCategory = previousCategory;
    isAddingNewTopic = false;
    newTopicName = "";
  }

  // Load existing categories to display in dropdown
  async function loadExistingCategories() {
    try {
      const res = await request<{ entries: { id: string }[] }>("/api/v1/knowledge?per_page=500");
      if (res.data && res.data.entries) {
        const cats = new Set<string>();
        for (const entry of res.data.entries) {
          const parts = entry.id.split("/");
          if (parts.length >= 2 && parts[0] === "topics") {
            cats.add(`topics/${parts[1]}`);
          }
        }
        existingCategories = Array.from(cats);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
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
            category: currentCategory,
            storage_name: editStorageName,
            attachments: editAttachments,
          }),
        }
      );

      if (res.error) {
        alert(`保存失败: ${res.error.message}`);
      } else {
        const hasAtts = editAttachments.length > 0;
        const finalStorage = editStorageName.toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[/?!:;.,\\()[\]{}'"“”('_)*=&%#@^~`<>|\u00a7\u00b6]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
        
        let targetId = "";
        if (currentCategory === "daily") {
          targetId = hasAtts ? `daily/${finalStorage}/index.md` : `daily/${finalStorage}.md`;
        } else {
          targetId = hasAtts ? `${currentCategory}/${finalStorage}/index.md` : `${currentCategory}/${finalStorage}.md`;
        }

        router.navigate(`/dashboard/knowledge/view/${encodeURIComponent(targetId)}`);
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
        // Automatically switch to attachments tab when file uploaded
        activeSidebarTab = "attachments";
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

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  }

  // Paper / Academic Custom Theme for CodeMirror 6
  const paperTheme = EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "14.5px",
      fontFamily: "var(--font-sans), sans-serif",
      backgroundColor: "var(--bg-paper)",
      color: "var(--text-ink)",
    },
    ".cm-content": {
      padding: "0",
      lineHeight: "1.7",
      caretColor: "var(--text-ink)",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeft: "1.5px solid var(--text-ink)",
    },
    ".cm-line": {
      padding: "0",
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "var(--font-serif), Georgia, serif",
      fontSize: "15px",
      padding: "30px",
    },
    ".cm-gutters": {
      display: "none",
    },
    "&.cm-focused": {
      outline: "none"
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(178, 90, 56, 0.12) !important",
    }
  }, { dark: false });

  let isUpdatingFromCM = false;

  let contextMenu = $state({
    show: false,
    x: 0,
    y: 0,
    line: 1,
    view: "main" as "main" | "attachments"
  });

  let rightClickFileInput = $state<HTMLInputElement | null>(null);

  function closeContextMenu() {
    if (contextMenu.show) {
      contextMenu.show = false;
    }
  }

  function handleContextMenu(event: MouseEvent) {
    if (!editorViewInstance) return;
    event.preventDefault();
    event.stopPropagation();

    let clickedLine = 1;
    const pos = editorViewInstance.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos !== null) {
      try {
        clickedLine = editorViewInstance.state.doc.lineAt(pos).number;
        editorViewInstance.dispatch({
          selection: { anchor: pos },
          scrollIntoView: false
        });
      } catch (e) {
        try {
          const cursorPos = editorViewInstance.state.selection.main.head;
          clickedLine = editorViewInstance.state.doc.lineAt(cursorPos).number;
        } catch (err) {}
      }
    } else {
      try {
        const cursorPos = editorViewInstance.state.selection.main.head;
        clickedLine = editorViewInstance.state.doc.lineAt(cursorPos).number;
      } catch (err) {}
    }

    let x = event.clientX;
    let y = event.clientY;
    const menuWidth = 180;
    const menuHeight = 76;
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    contextMenu = {
      show: true,
      x,
      y,
      line: clickedLine,
      view: "main"
    };
  }

  function triggerRightClickUpload(e: Event) {
    e.stopPropagation();
    if (rightClickFileInput) {
      rightClickFileInput.click();
    }
  }

  async function handleRightClickUploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    
    contextMenu.show = false;
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
        const newAtt = {
          name: result.filename,
          size: result.size,
          mime_type: result.mime_type,
          description: "",
        };
        editAttachments = [...editAttachments, newAtt];
        insertAttachment(newAtt);
      }
    } catch (err: any) {
      alert(`上传并插入附件失败: ${err.message}`);
    } finally {
      uploadingAttachment = false;
      input.value = "";
    }
  }

  function initEditor() {
    if (!editorDiv) return;

    const startState = EditorState.create({
      doc: editContent,
      extensions: [
        basicSetup,
        markdown(),
        paperTheme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            isUpdatingFromCM = true;
            editContent = update.state.doc.toString();
            isUpdatingFromCM = false;
          }
        })
      ]
    });

    editorViewInstance = new EditorView({
      state: startState,
      parent: editorDiv
    });
  }

  // Insert attachment Markdown code
  function insertAttachment(att: Attachment) {
    if (!editorViewInstance) return;
    const isExisting = selectedEntry?.attachments?.some(a => a.name === att.name) ?? false;
    const prefix = isExisting ? "assets" : "attachments";
    const isImg = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
      att.name.split(".").pop()?.toLowerCase() || ""
    );
    const refText = isImg
      ? `![${att.name}](${prefix}/${att.name})`
      : `[${att.name}](${prefix}/${att.name})`;

    const state = editorViewInstance.state;
    const ranges = state.selection.ranges;
    const primaryRange = ranges[0] || { from: state.doc.length, to: state.doc.length };

    editorViewInstance.dispatch({
      changes: {
        from: primaryRange.from,
        to: primaryRange.to,
        insert: refText
      },
      selection: { anchor: primaryRange.from + refText.length },
      scrollIntoView: true
    });

    editorViewInstance.focus();
  }

  function removeAttachment(attName: string) {
    editAttachments = editAttachments.filter((a) => a.name !== attName);
  }

  // Effect to sync content to CodeMirror from outside
  $effect(() => {
    if (editorViewInstance && !isUpdatingFromCM) {
      const currentDoc = editorViewInstance.state.doc.toString();
      if (currentDoc !== editContent) {
        editorViewInstance.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: editContent }
        });
      }
    }
  });

  function syncPreviewToLine(lineNum?: number) {
    if (!editorViewInstance || !previewPaneRef) return;

    // 1. Get the target line number
    let targetLineNum = lineNum;
    if (targetLineNum === undefined) {
      try {
        const cursorPos = editorViewInstance.state.selection.main.head;
        targetLineNum = editorViewInstance.state.doc.lineAt(cursorPos).number;
      } catch (e) {
        targetLineNum = 1;
      }
    }

    // 2. Parse headings in the Markdown text, skipping code blocks
    const lines = editContent.split("\n");
    const headings: { text: string; line: number }[] = [];
    let inCodeBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          text: match[2].trim(),
          line: i + 1, // 1-indexed line number
        });
      }
    }

    // 3. Find heading elements in the preview DOM
    const headingElements = previewPaneRef.querySelectorAll<HTMLElement>(
      "h1, h2, h3, h4, h5, h6"
    );

    let targetScrollTop = 0;

    // If no headings found, fall back to pure percentage sync scroll based on line number
    if (headings.length === 0 || headingElements.length === 0) {
      const percentage = targetLineNum / Math.max(1, lines.length);
      previewPaneRef.scrollTop = percentage * (previewPaneRef.scrollHeight - previewPaneRef.clientHeight);
      return;
    }

    // 4. Find the closest heading at or above targetLineNum
    let k = -1;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].line <= targetLineNum) {
        k = i;
      } else {
        break;
      }
    }

    if (k === -1) {
      // Before the first heading
      const firstHeadingLine = headings[0].line;
      const firstHeadingEl = headingElements[0];
      const ratio = targetLineNum / Math.max(1, firstHeadingLine);
      if (firstHeadingEl) {
        const targetY = firstHeadingEl.offsetTop - previewPaneRef.offsetTop;
        targetScrollTop = ratio * targetY;
      } else {
        const percentage = targetLineNum / Math.max(1, lines.length);
        targetScrollTop = percentage * (previewPaneRef.scrollHeight - previewPaneRef.clientHeight);
      }
    } else if (k === headings.length - 1) {
      // After the last heading
      const lastHeadingLine = headings[k].line;
      const lastHeadingEl = headingElements[k];
      const totalLines = lines.length;
      
      const ratio = (targetLineNum - lastHeadingLine) / Math.max(1, totalLines - lastHeadingLine);
      if (lastHeadingEl) {
        const startY = lastHeadingEl.offsetTop - previewPaneRef.offsetTop;
        const endY = previewPaneRef.scrollHeight - previewPaneRef.clientHeight;
        targetScrollTop = startY + ratio * (endY - startY);
      } else {
        const percentage = targetLineNum / Math.max(1, lines.length);
        targetScrollTop = percentage * (previewPaneRef.scrollHeight - previewPaneRef.clientHeight);
      }
    } else {
      // Between heading k and k + 1
      const lineStart = headings[k].line;
      const lineEnd = headings[k + 1].line;
      const ratio = (targetLineNum - lineStart) / Math.max(1, lineEnd - lineStart);

      const elStart = headingElements[k];
      const elEnd = headingElements[k + 1];

      if (elStart && elEnd) {
        const yStart = elStart.offsetTop - previewPaneRef.offsetTop;
        const yEnd = elEnd.offsetTop - previewPaneRef.offsetTop;
        targetScrollTop = yStart + ratio * (yEnd - yStart);
      } else if (elStart) {
        targetScrollTop = elStart.offsetTop - previewPaneRef.offsetTop;
      } else {
        const percentage = targetLineNum / Math.max(1, lines.length);
        targetScrollTop = percentage * (previewPaneRef.scrollHeight - previewPaneRef.clientHeight);
      }
    }

    // Scroll smoothly
    previewPaneRef.scrollTo({
      top: targetScrollTop,
      behavior: "smooth"
    });
  }

  // Compile real-time markdown editor preview
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
      const isExisting = selectedEntry?.attachments?.some(a => a.name === filename) ?? false;
      let serveUrl = "";
      if (isExisting) {
        serveUrl = getApiUrl(`/api/v1/attachments/notes/${noteDir}/assets/${filename}`);
      } else {
        serveUrl = getApiUrl(`/api/v1/attachments/file/${filename}`);
      }
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

  function getFileIconSvg(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
    }
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-music"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    }
    if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(ext)) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-video"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`;
    }
    if (['pdf', 'epub'].includes(ext)) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/><path d="M9 12h6"/><path d="M9 9h1"/></svg>`;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-archive"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect width="22" height="5" x="1" y="3" rx="1"/><path d="M10 12h4"/></svg>`;
    }
    if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css'].includes(ext)) {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-code"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  }

  function contextMenuCapture(node: HTMLElement) {
    node.addEventListener("contextmenu", handleContextMenu, { capture: true });
    return {
      destroy() {
        node.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      }
    };
  }

  onMount(async () => {
    await loadEntry();
    await loadExistingCategories();
    initEditor();
    window.addEventListener("click", closeContextMenu);
    window.addEventListener("contextmenu", closeContextMenu);
  });

  onDestroy(() => {
    if (editorViewInstance) {
      editorViewInstance.destroy();
    }
    window.removeEventListener("click", closeContextMenu);
    window.removeEventListener("contextmenu", closeContextMenu);
    window.removeEventListener("mousemove", handleResizeMove);
    window.removeEventListener("mouseup", handleResizeEnd);
  });
</script>

<div class="kb-editor-container">
  <!-- Top bar controls -->
  <div class="editor-top-bar">
    <div class="editor-header-title">
      <h2>编辑条目</h2>
      {#if selectedEntry}
        <span class="editor-header-divider">/</span>
        <span class="editor-header-path" title="存储路径">{selectedEntry.id}</span>
      {/if}
    </div>
    
    <div class="editor-controls">
      <div class="view-toggle segmented-control">
        <button class="segment-btn {editorView === 'edit' ? 'active' : ''}" onclick={() => editorView = 'edit'}>仅编辑</button>
        <button class="segment-btn {editorView === 'split' ? 'active' : ''}" onclick={() => editorView = 'split'}>双栏分屏</button>
        <button class="segment-btn {editorView === 'preview' ? 'active' : ''}" onclick={() => editorView = 'preview'}>仅预览</button>
      </div>

      <button 
        class="props-toggle-btn" 
        class:active={!isSidebarCollapsed}
        onclick={() => isSidebarCollapsed = !isSidebarCollapsed}
        title={isSidebarCollapsed ? "展开属性面板" : "收起属性面板"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-sidebar-right"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/></svg>
        {isSidebarCollapsed ? "属性面板" : "收起面板"}
      </button>

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
      <KLogo width={48} height={48} animated={true} />
      <p>正在打开条目编辑器...</p>
    </div>
  {:else if selectedEntry}
    <!-- Main editor body split -->
    <div class="editor-body-layout">
      <!-- Workspace: Left Editor Pane & Right Preview Pane -->
      <div class="editor-main-workspace {editorView}">
        <!-- Editor Input Panel -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
          class="editor-pane" 
          class:hidden={editorView === 'preview'}
          use:contextMenuCapture
        >
          <!-- CodeMirror parent container -->
          <div bind:this={editorDiv} class="codemirror-editor-container"></div>
        </div>
        
        <!-- Live HTML Viewer Panel -->
        <div 
          class="preview-pane markdown-body" 
          class:hidden={editorView === 'edit'}
          bind:this={previewPaneRef}
        >
          {@html compiledEditPreview()}
        </div>
      </div>



      <!-- Collapsible properties sidebar (Metadata, tags & attachments upload) -->
      <aside 
        class="editor-props-sidebar" 
        class:collapsed={isSidebarCollapsed}
        class:resizing={isResizing}
        style="width: {sidebarWidth}px;"
      >
        <!-- Resize handle -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div 
          class="sidebar-resize-handle" 
          class:active={isResizing}
          onmousedown={handleResizeStart}
        ></div>
        <!-- Tabs Header -->
        <div class="sidebar-tabs">
          <button 
            type="button"
            class="sidebar-tab-btn {activeSidebarTab === 'properties' ? 'active' : ''}" 
            onclick={() => activeSidebarTab = 'properties'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            属性
          </button>
          <button 
            type="button"
            class="sidebar-tab-btn {activeSidebarTab === 'attachments' ? 'active' : ''}" 
            onclick={() => activeSidebarTab = 'attachments'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            附件 ({editAttachments.length})
          </button>
        </div>

        <!-- Tab 1: Properties Grid -->
        {#if activeSidebarTab === 'properties'}
          <div class="properties-grid">
            <!-- Title -->
            <div class="property-row block-row">
              <div class="property-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                文档标题
              </div>
              <div class="property-value">
                <textarea 
                  class="property-textarea" 
                  bind:value={editTitle} 
                  bind:this={titleTextareaRef}
                  placeholder="无标题"
                  rows="1"
                  oninput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                ></textarea>
              </div>
            </div>

            <!-- Storage Name (Filename) -->
            <div class="property-row block-row">
              <div class="property-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                存储文件名
              </div>
              <div class="property-value">
                <textarea 
                  class="property-textarea filename-textarea" 
                  bind:value={editStorageName} 
                  bind:this={storageTextareaRef}
                  placeholder="请输入存储文件名..." 
                  rows="1"
                  oninput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                ></textarea>
                <div class="property-warning-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="warning-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span class="property-warning-text">更改存储名字会物理重命名，其它条目的双链引用可能会失效。</span>
                </div>
              </div>
            </div>

            <!-- Category selection -->
            <div class="property-row block-row">
              <div class="property-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M2 10h20"/></svg>
                归档位置
              </div>
              <div class="property-value">
                {#if isAddingNewTopic}
                  <div class="new-topic-inline-wrapper">
                    <input 
                      type="text" 
                      class="property-input new-topic-input" 
                      placeholder="输入新专题标识 (如 ai)..." 
                      bind:value={newTopicName}
                      autofocus
                      onkeydown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          confirmNewTopic();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelNewTopic();
                        }
                      }}
                    />
                    <div class="new-topic-actions">
                      <button type="button" class="inline-action-btn confirm" onclick={confirmNewTopic} title="确认创建并归档">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <button type="button" class="inline-action-btn cancel" onclick={cancelNewTopic} title="取消创建">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                {:else}
                  <div class="custom-select-wrapper">
                    <select class="property-select" bind:value={currentCategory} onchange={() => {
                      if (currentCategory === '__new_topic__') {
                        isAddingNewTopic = true;
                      } else {
                        previousCategory = currentCategory;
                      }
                    }}>
                      <option value="inbox">收集箱 (inbox)</option>
                      <option value="daily">随笔日记 (daily)</option>
                      {#if existingCategories.length > 0}
                        <option disabled>────── 专题类别 ──────</option>
                        {#each existingCategories as cat}
                          <option value={cat}>{cat.replace('topics/', '')}</option>
                        {/each}
                      {/if}
                      <option value="__new_topic__">+ 新建专题...</option>
                    </select>
                    <span class="select-arrow">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Source URL -->
            <div class="property-row block-row">
              <div class="property-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                来源 URL
              </div>
              <div class="property-value">
                <div class="url-input-wrapper">
                  <textarea 
                    class="property-textarea url-textarea" 
                    bind:value={editSourceUrl} 
                    bind:this={urlTextareaRef}
                    placeholder="无来源 URL"
                    rows="1"
                    oninput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  ></textarea>
                  {#if editSourceUrl && editSourceUrl.trim()}
                    <a 
                      href={editSourceUrl.trim()} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="url-visit-btn"
                      title="在新标签页中访问来源链接"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div class="property-row block-row">
              <div class="property-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                条目标签
              </div>
              <div class="property-value tags-value">
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
                  class="property-input tag-input-box"
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
            </div>
          </div>
        {/if}

        <!-- Tab 2: Attachments Shelf -->
        {#if activeSidebarTab === 'attachments'}
          <div class="attachments-shelf">
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
                  <div class="attachment-item-row">
                    <div class="att-left">
                      <span class="att-file-icon">
                        {@html getFileIconSvg(att.name)}
                      </span>
                      <div class="att-info">
                        <span class="att-name-text" title={att.name}>{att.name}</span>
                        <span class="att-size-text">{formatBytes(att.size)}</span>
                      </div>
                    </div>
                    <div class="att-actions-group">
                      <button 
                        type="button" 
                        class="att-action-btn-circle insert-btn" 
                        onclick={() => insertAttachment(att)} 
                        title="插入引用到光标处"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                      </button>
                      <button 
                        type="button" 
                        class="att-action-btn-circle delete-btn" 
                        onclick={() => removeAttachment(att.name)} 
                        title="删除此附件"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </aside>
    </div>
  {/if}

  {#if contextMenu.show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
      class="custom-context-menu" 
      style="position: fixed; top: {contextMenu.y}px; left: {contextMenu.x}px; z-index: 10000;"
      onclick={(e) => e.stopPropagation()}
      oncontextmenu={(e) => e.preventDefault()}
    >
      {#if contextMenu.view === 'main'}
        <button class="context-menu-item" onclick={() => { syncPreviewToLine(contextMenu.line); contextMenu.show = false; }}>
          聚焦渲染视区
        </button>
        <div class="context-menu-divider"></div>
        <button class="context-menu-item has-submenu" onclick={(e) => { contextMenu.view = 'attachments'; e.stopPropagation(); }}>
          <span>插入附件</span>
          <svg class="submenu-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      {:else if contextMenu.view === 'attachments'}
        <button class="context-menu-item back-item" onclick={(e) => { contextMenu.view = 'main'; e.stopPropagation(); }}>
          <svg class="back-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          <span>返回主菜单</span>
        </button>
        <button class="context-menu-item upload-item" onclick={triggerRightClickUpload}>
          <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>上传新文件...</span>
        </button>
        
        {#if editAttachments.length > 0}
          <div class="context-menu-divider"></div>
          <div class="submenu-header">已有附件：</div>
          <div class="submenu-scroll-area">
            {#each editAttachments as att}
              <button 
                class="context-menu-item attachment-item" 
                onclick={() => { insertAttachment(att); contextMenu.show = false; }}
                title="插入 {att.name}"
              >
                <span class="menu-att-icon">{@html getFileIconSvg(att.name)}</span>
                <span class="attachment-name-text">{att.name}</span>
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/if}

  <input 
    type="file" 
    bind:this={rightClickFileInput} 
    class="hidden" 
    onchange={handleRightClickUploadFile} 
    style="display: none;"
  />
</div>

<style>
  /* Resize handle on the left edge of properties sidebar */
  .sidebar-resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: ew-resize;
    z-index: 60;
    transition: background-color 0.2s ease;
  }
  .sidebar-resize-handle:hover,
  .sidebar-resize-handle.active {
    background-color: var(--accent-ochre);
  }

  @keyframes unfocused-cm-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* Keep cursor selection highlight visible when editor is unfocused */
  .codemirror-editor-container :global(.cm-selectionBackground) {
    background: rgba(178, 90, 56, 0.15) !important;
  }
  .codemirror-editor-container :global(.cm-editor.cm-focused .cm-selectionBackground) {
    background: rgba(178, 90, 56, 0.15) !important;
  }
  /* Force cursor blinking visibility when editor is unfocused */
  .codemirror-editor-container :global(.cm-editor:not(.cm-focused) .cm-cursorLayer) {
    display: block !important;
    visibility: visible !important;
    animation: unfocused-cm-blink 1.2s steps(1) infinite;
  }
  .codemirror-editor-container :global(.cm-editor:not(.cm-focused) .cm-cursor) {
    display: block !important;
    visibility: visible !important;
    border-left: 1.5px solid var(--text-ink) !important;
  }

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
    gap: 8px;
  }

  .editor-header-title h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .editor-header-divider {
    color: var(--text-muted);
    font-size: 14px;
    opacity: 0.6;
    user-select: none;
  }

  .editor-header-path {
    font-family: var(--font-sans), sans-serif;
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
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

  .props-toggle-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 12px;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.22s ease;
    font-family: var(--font-sans);
  }

  .props-toggle-btn:hover {
    border-color: var(--text-muted);
    color: var(--text-ink);
  }

  .props-toggle-btn.active {
    color: var(--accent-ochre);
    border-color: var(--accent-ochre);
    background: var(--bg-card-hover);
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
    gap: 16px;
  }

  .editor-body-layout {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }



  .editor-main-workspace {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  /* Workspace split / edit / preview configurations */
  .editor-main-workspace.edit .editor-pane {
    flex: 1;
    width: 100%;
    border-right: none;
  }
  
  .editor-main-workspace.preview .preview-pane {
    flex: 1;
    width: 100%;
  }

  .editor-main-workspace.split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }

  .editor-pane.hidden, .preview-pane.hidden {
    display: none !important;
  }

  .editor-pane {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border-fine);
    overflow: hidden;
    background: var(--bg-paper);
    box-sizing: border-box;
    height: 100%;
  }

  .codemirror-editor-container {
    flex: 1;
    overflow: hidden;
    text-align: left;
    height: 100%;
  }

  .codemirror-editor-container :global(.cm-editor) {
    height: 100%;
  }

  .preview-pane {
    position: relative;
    padding: 40px;
    overflow-y: auto;
    background: var(--bg-paper);
    text-align: left;
    box-sizing: border-box;
    height: 100%;
  }

  /* Properties Sidebar - Docked Panel design */
  .editor-props-sidebar {
    position: relative;
    width: 320px;
    background: var(--bg-card);
    border-left: 1px solid var(--border-fine);
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    z-index: 50;
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.06);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease, border-left-width 0.3s ease;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .editor-props-sidebar.collapsed {
    width: 0 !important;
    padding: 0 !important;
    border-left-width: 0 !important;
    overflow: hidden;
    box-shadow: none;
  }

  .editor-props-sidebar.resizing {
    transition: none !important;
  }

  /* Tabs Layout */
  .sidebar-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-fine);
    margin-bottom: 8px;
    gap: 8px;
  }

  .sidebar-tab-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-sans), sans-serif;
  }

  .sidebar-tab-btn svg {
    flex-shrink: 0;
    color: currentColor;
  }

  .sidebar-tab-btn:hover {
    color: var(--text-ink);
  }

  .sidebar-tab-btn.active {
    color: var(--accent-ochre);
    border-bottom-color: var(--accent-ochre);
  }

  /* Properties Grid (Notion-style) */
  .properties-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .property-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .property-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: var(--font-sans), sans-serif;
    user-select: none;
  }

  .property-label svg {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .property-value {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    text-align: left;
  }

  .property-textarea {
    width: 100%;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-ink);
    border: none;
    background: transparent;
    outline: none;
    resize: none;
    padding: 6px 0;
    font-family: var(--font-sans), sans-serif;
    border-bottom: 1px dashed var(--border-fine);
    transition: border-color 0.2s ease;
    line-height: 1.4;
    overflow-y: hidden;
  }

  .property-textarea:focus {
    border-bottom-style: solid;
    border-bottom-color: var(--accent-ochre);
  }

  .property-input {
    border: none;
    border-bottom: 1px solid var(--border-fine);
    background: transparent;
    font-size: 13px;
    color: var(--text-ink);
    padding: 6px 0;
    width: 100%;
    outline: none;
    transition: all 0.2s ease;
  }

  .property-input:focus {
    border-bottom-color: var(--accent-ochre);
  }

  .filename-textarea {
    font-family: monospace;
    font-size: 13px !important;
    font-weight: 500 !important;
    border-bottom: 1px dashed var(--border-fine) !important;
    overflow-y: hidden;
    word-break: break-all;
  }
  .filename-textarea:focus {
    border-bottom-style: solid !important;
    border-bottom-color: var(--accent-ochre) !important;
  }

  /* Warning Box Design */
  .property-warning-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 6px;
    padding: 10px;
    background: rgba(197, 48, 48, 0.04);
    border: 1px solid rgba(197, 48, 48, 0.12);
    border-radius: 6px;
    line-height: 1.4;
  }

  .property-warning-box .warning-icon {
    color: var(--accent-terracotta);
    margin-top: 2px;
    flex-shrink: 0;
  }

  .property-warning-text {
    font-size: 11px;
    color: var(--text-ink);
    font-family: var(--font-sans), sans-serif;
  }

  /* Custom Category Select wrapper */
  .custom-select-wrapper {
    position: relative;
    width: 100%;
  }

  .custom-select-wrapper select.property-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    width: 100%;
    padding: 8px 30px 8px 10px;
    font-size: 13px;
    font-family: var(--font-sans), sans-serif;
    color: var(--text-ink);
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .custom-select-wrapper select.property-select:focus {
    border-color: var(--accent-ochre);
    box-shadow: 0 0 0 2px rgba(178, 90, 56, 0.1);
  }

  .select-arrow {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--text-muted);
    display: flex;
    align-items: center;
  }

  /* Inline New Topic Creator */
  .new-topic-inline-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    animation: slideInLeft 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .new-topic-input {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--border-fine) !important;
    border-radius: 6px !important;
    padding: 6px 10px !important;
    background: var(--bg-paper) !important;
    font-size: 13px !important;
    font-family: var(--font-sans), sans-serif;
  }

  .new-topic-input:focus {
    border-color: var(--accent-ochre) !important;
    box-shadow: 0 0 0 2px rgba(178, 90, 56, 0.1);
  }

  .new-topic-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .inline-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--border-fine);
    background: var(--bg-paper);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .inline-action-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
  }

  .inline-action-btn.confirm:hover {
    border-color: var(--accent-ochre);
    color: var(--accent-ochre);
    background: var(--bg-card-hover);
  }

  .inline-action-btn.cancel:hover {
    border-color: var(--accent-terracotta);
    color: var(--accent-terracotta);
    background: rgba(197, 48, 48, 0.04);
  }

  /* Source URL input wrapper */
  .url-input-wrapper {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border-fine);
    transition: border-color 0.2s ease;
    width: 100%;
  }

  .url-input-wrapper:focus-within {
    border-bottom-color: var(--accent-ochre);
  }

  .url-input-wrapper .url-textarea {
    border-bottom: none;
    padding-right: 8px;
    flex: 1;
    min-width: 0;
  }

  .url-textarea {
    font-size: 13px !important;
    font-weight: 500 !important;
    font-family: var(--font-sans), sans-serif !important;
    border-bottom: none !important;
    padding: 6px 0 !important;
    line-height: 1.5 !important;
    overflow-y: hidden;
    word-break: break-all;
  }

  .url-visit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    padding: 6px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .url-visit-btn:hover {
    color: var(--accent-ochre);
    background: var(--bg-card-hover);
  }

  /* Tags styles */
  .tags-value {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tag-input-box {
    border: 1px solid var(--border-fine) !important;
    border-radius: 4px !important;
    padding: 6px 8px !important;
    background: var(--bg-paper) !important;
    font-size: 12px !important;
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
    padding: 3px 8px;
    background: var(--bg-card-hover);
    border: 1px solid var(--border-fine);
    border-radius: 4px;
    font-size: 11.5px;
    color: var(--text-ink);
    gap: 6px;
    font-family: var(--font-sans), sans-serif;
    font-weight: 500;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .note-tag-pill:hover {
    background: var(--bg-card);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    border-color: var(--text-muted);
  }

  .remove-tag-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    transition: all 0.2s ease;
  }

  .remove-tag-btn:hover {
    color: var(--accent-terracotta);
    background: rgba(197, 48, 48, 0.08);
    transform: scale(1.15);
  }

  /* File drag uploader */
  .attachments-shelf {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

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
    font-family: var(--font-sans), sans-serif;
    line-height: 1.3;
  }

  .no-attachments-text {
    font-size: 12px;
    color: var(--text-muted);
    font-style: italic;
    margin: 0;
    text-align: left;
  }

  .edit-attachments-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .attachment-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    gap: 10px;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .attachment-item-row:hover {
    background: var(--bg-card-hover);
  }

  .att-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }

  .att-file-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: var(--bg-card);
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .attachment-item-row:hover .att-file-icon {
    background: var(--bg-paper);
    color: var(--text-ink);
  }

  .att-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    text-align: left;
  }

  .att-name-text {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  .att-size-text {
    font-size: 10.5px;
    color: var(--text-muted);
    line-height: 1.2;
    margin-top: 1px;
  }

  .att-actions-group {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    opacity: 0.4;
    transition: opacity 0.15s ease;
  }

  .attachment-item-row:hover .att-actions-group,
  .attachment-item-row:focus-within .att-actions-group {
    opacity: 1;
  }

  .att-action-btn-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .att-action-btn-circle svg {
    flex-shrink: 0;
  }

  .att-action-btn-circle:hover {
    color: var(--text-ink);
    background: var(--bg-card);
  }

  .att-action-btn-circle.insert-btn:hover {
    background: rgba(178, 90, 56, 0.08);
    color: var(--accent-ochre);
  }

  .att-action-btn-circle.delete-btn:hover {
    background: rgba(160, 71, 36, 0.08);
    color: var(--accent-terracotta);
  }

  .new-topic-input-wrapper {
    animation: slideDown 0.2s ease;
    margin-top: 4px;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Custom Context Menu - Modern Floating Card Design */
  .custom-context-menu {
    background: var(--bg-card);
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
    min-width: 170px;
    max-width: 240px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    z-index: 10000;
    font-family: var(--font-sans), sans-serif;
  }

  .context-menu-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-ink);
    border-radius: 4px;
    transition: all 0.18s ease;
    font-family: inherit;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .context-menu-item:hover {
    background: var(--bg-card-hover);
    color: var(--accent-ochre);
  }

  .context-menu-item.back-item {
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-fine);
    border-radius: 0;
    padding-bottom: 6px;
    margin-bottom: 4px;
  }

  .context-menu-item.upload-item {
    font-weight: 600;
    color: var(--accent-ochre);
  }

  .context-menu-divider {
    height: 1px;
    background: var(--border-fine);
    margin: 4px 0;
  }

  .submenu-header {
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 4px 12px;
    user-select: none;
  }

  .submenu-scroll-area {
    max-height: 140px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .context-menu-item.attachment-item {
    font-size: 11.5px;
    padding: 6px 12px;
    color: var(--text-muted);
  }

  .attachment-name-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    width: 100%;
  }

  .context-menu-item.has-submenu {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .submenu-chevron {
    color: var(--text-muted);
    transition: transform 0.18s ease;
    flex-shrink: 0;
  }

  .context-menu-item:hover .submenu-chevron {
    color: var(--accent-ochre);
    transform: translateX(2px);
  }

  .back-chevron {
    margin-right: 6px;
    color: var(--text-muted);
    transition: transform 0.18s ease;
    flex-shrink: 0;
  }

  .context-menu-item.back-item {
    display: flex;
    align-items: center;
  }

  .context-menu-item.back-item:hover .back-chevron {
    color: var(--accent-ochre);
    transform: translateX(-2px);
  }

  .upload-icon {
    margin-right: 6px;
    color: var(--accent-ochre);
    flex-shrink: 0;
  }

  .context-menu-item.upload-item {
    display: flex;
    align-items: center;
  }

  .menu-att-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    margin-right: 6px;
    flex-shrink: 0;
  }

  .context-menu-item.attachment-item {
    display: flex;
    align-items: center;
  }
</style>
