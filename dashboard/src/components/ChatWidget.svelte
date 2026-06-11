<svelte:options customElement="knovana-chat-widget" />

<script lang="ts">
  import { onMount, tick } from "svelte";
  import { marked } from "marked";
  import DOMPurify from "dompurify";

  // Declare props as custom element attributes
  let {
    apiUrl = "http://localhost:8000",
    token = "",
    isBlocked = false
  } = $props<{
    apiUrl?: string;
    token?: string;
    isBlocked?: boolean;
  }>();

  // Floating window states
  let isMinimized = $state(true);
  let showSessions = $state(false);
  
  let width = $state(420);
  let height = $state(600);
  let x = $state<number | null>(null);
  let y = $state<number | null>(null);

  // Chat data states
  let sessions = $state<any[]>([]);
  let activeSessionId = $state<string | null>(null);
  let messages = $state<any[]>([]);
  let sessionTitle = $state("智能会话");
  let chatInput = $state("");
  let generating = $state(false);
  let statusText = $state("");
  let loadingHistory = $state(false);
  let loadingSessions = $state(false);

  let chatHistoryEl = $state<HTMLElement | null>(null);
  let widgetEl = $state<HTMLElement | null>(null);

  // Scroll helper
  async function scrollToBottom() {
    if (chatHistoryEl) {
      await tick();
      chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    }
  }

  // Self-contained HTTP client
  async function apiRequest<T>(method: string, path: string, body?: any): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with status ${response.status}`);
    }
    return response.json();
  }

  // Self-contained SSE Stream Reader
  async function readSse(
    response: Response,
    onChunk: (chunk: any) => void
  ) {
    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const raw = trimmed.slice(5).trimStart();
          if (!raw || raw === "[DONE]") continue;

          try {
            const json = JSON.parse(raw);
            onChunk(json);
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Load user sessions list
  async function loadSessions() {
    if (isBlocked) return;
    loadingSessions = true;
    try {
      const res = await apiRequest<{ sessions: any[] }>('GET', '/api/v1/chat/sessions?page=1&per_page=50');
      sessions = res.sessions || [];
      
      // If we don't have an active session but there are sessions, select the first one
      if (!activeSessionId && sessions.length > 0) {
        selectSession(sessions[0].id);
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
    } finally {
      loadingSessions = false;
    }
  }

  // Create a brand new session
  async function createNewSession() {
    if (isBlocked) return;
    generating = false;
    statusText = "";
    try {
      const res = await apiRequest<{ id: string, title: string }>('POST', '/api/v1/chat/sessions', {
        title: "新对话"
      });
      activeSessionId = res.id;
      sessionTitle = res.title || "新对话";
      messages = [];
      showSessions = false;
      await loadSessions();
    } catch (err) {
      console.error("Failed to create session", err);
    }
  }

  // Select and load details of a session
  async function selectSession(sessionId: string) {
    activeSessionId = sessionId;
    showSessions = false;
    loadingHistory = true;
    messages = [];
    statusText = "";
    try {
      const res = await apiRequest<{ title: string, messages: any[] }>('GET', `/api/v1/chat/sessions/${sessionId}`);
      sessionTitle = res.title || "智能会话";
      messages = res.messages || [];
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load session details", err);
    } finally {
      loadingHistory = false;
    }
  }

  // Delete a session
  async function deleteSession(sessionId: string, event: MouseEvent) {
    event.stopPropagation();
    if (!confirm("确定要删除该对话会话吗？")) return;
    try {
      await apiRequest('DELETE', `/api/v1/chat/sessions/${sessionId}`);
      if (activeSessionId === sessionId) {
        activeSessionId = null;
        messages = [];
        sessionTitle = "智能会话";
      }
      await loadSessions();
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  }

  // Send a chat message with full SSE handling
  async function sendChatMessage() {
    if (!chatInput.trim() || generating || isBlocked) return;
    
    const userText = chatInput.trim();
    chatInput = "";
    
    // Append user message locally
    const userMsgId = `msg_user_${Date.now()}`;
    messages = [...messages, {
      id: userMsgId,
      role: "user",
      content: userText,
      created_at: new Date().toISOString()
    }];
    scrollToBottom();
    
    generating = true;
    statusText = "正在唤醒智能助手...";
    
    let assistantMsgId = "";
    let contentBlocks: any[] = [];
    
    try {
      const body: any = { message: userText };
      if (activeSessionId) {
        body.session_id = activeSessionId;
      }
      
      const tokenHeader = token ? `Bearer ${token}` : "";
      const res = await fetch(`${apiUrl}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": tokenHeader
        },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      
      await readSse(res, (chunk) => {
        if (chunk.type === "message_start") {
          assistantMsgId = chunk.message?.id;
          messages = [...messages, {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            created_at: new Date().toISOString(),
            thinking: ""
          }];
        } else if (chunk.type === "session_created") {
          if (!activeSessionId) {
            activeSessionId = chunk.session_id;
            loadSessions();
          }
        } else if (chunk.type === "status") {
          statusText = chunk.text || "";
        } else if (chunk.type === "content_block_start") {
          const idx = chunk.index;
          contentBlocks[idx] = chunk.content_block;
        } else if (chunk.type === "content_block_delta") {
          const idx = chunk.index;
          const delta = chunk.delta;
          
          if (delta.type === "text_delta" && delta.text) {
            if (!contentBlocks[idx]) contentBlocks[idx] = { type: "text", text: "" };
            contentBlocks[idx].text += delta.text;
            updateAssistantContent();
          } else if (delta.type === "thinking_delta" && delta.text) {
            if (!contentBlocks[idx]) contentBlocks[idx] = { type: "thinking", text: "" };
            contentBlocks[idx].text += delta.text;
            updateAssistantThinking();
          }
        } else if (chunk.type === "content_block_stop") {
          const idx = chunk.index;
          contentBlocks[idx] = chunk.content_block;
          updateAssistantContent();
          updateAssistantThinking();
        } else if (chunk.type === "message_end") {
          statusText = "";
        } else if (chunk.type === "error") {
          statusText = `Error: ${chunk.error?.message || "流式输出故障"}`;
        }
      });
    } catch (err: any) {
      console.error("Streaming error", err);
      statusText = `连接助手失败: ${err.message || "未知网络错误"}`;
    } finally {
      generating = false;
      await loadSessions();
    }
    
    function updateAssistantContent() {
      const texts = contentBlocks
        .filter(b => b && b.type === "text" && b.text)
        .map(b => b.text)
        .join("");
        
      const index = messages.findIndex(m => m.id === assistantMsgId);
      if (index !== -1) {
        messages[index].content = texts;
        messages = [...messages];
        scrollToBottom();
      }
    }
    
    function updateAssistantThinking() {
      const thinkings = contentBlocks
        .filter(b => b && b.type === "thinking" && b.text)
        .map(b => b.text)
        .join("");
        
      const index = messages.findIndex(m => m.id === assistantMsgId);
      if (index !== -1) {
        messages[index].thinking = thinkings;
        messages = [...messages];
        scrollToBottom();
      }
    }
  }

  // Regenerate last response
  async function regenerateLastResponse() {
    if (!activeSessionId || generating || isBlocked) return;
    
    generating = true;
    statusText = "正在重新思考...";
    
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant") {
      messages = messages.slice(0, -1);
    }
    
    let assistantMsgId = "";
    let contentBlocks: any[] = [];
    
    try {
      const tokenHeader = token ? `Bearer ${token}` : "";
      const res = await fetch(`${apiUrl}/api/v1/chat/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": tokenHeader
        },
        body: JSON.stringify({ session_id: activeSessionId })
      });
      
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      
      await readSse(res, (chunk) => {
        if (chunk.type === "message_start") {
          assistantMsgId = chunk.message?.id;
          messages = [...messages, {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            created_at: new Date().toISOString(),
            thinking: ""
          }];
        } else if (chunk.type === "status") {
          statusText = chunk.text || "";
        } else if (chunk.type === "content_block_start") {
          const idx = chunk.index;
          contentBlocks[idx] = chunk.content_block;
        } else if (chunk.type === "content_block_delta") {
          const idx = chunk.index;
          const delta = chunk.delta;
          
          if (delta.type === "text_delta" && delta.text) {
            if (!contentBlocks[idx]) contentBlocks[idx] = { type: "text", text: "" };
            contentBlocks[idx].text += delta.text;
            updateAssistantContent();
          } else if (delta.type === "thinking_delta" && delta.text) {
            if (!contentBlocks[idx]) contentBlocks[idx] = { type: "thinking", text: "" };
            contentBlocks[idx].text += delta.text;
            updateAssistantThinking();
          }
        } else if (chunk.type === "content_block_stop") {
          const idx = chunk.index;
          contentBlocks[idx] = chunk.content_block;
          updateAssistantContent();
          updateAssistantThinking();
        } else if (chunk.type === "message_end") {
          statusText = "";
        } else if (chunk.type === "error") {
          statusText = `Error: ${chunk.error?.message || "流式输出故障"}`;
        }
      });
    } catch (err: any) {
      console.error("Regeneration error", err);
      statusText = `重新生成回答失败: ${err.message || "未知网络错误"}`;
    } finally {
      generating = false;
    }
    
    function updateAssistantContent() {
      const texts = contentBlocks
        .filter(b => b && b.type === "text" && b.text)
        .map(b => b.text)
        .join("");
        
      const index = messages.findIndex(m => m.id === assistantMsgId);
      if (index !== -1) {
        messages[index].content = texts;
        messages = [...messages];
        scrollToBottom();
      }
    }
    
    function updateAssistantThinking() {
      const thinkings = contentBlocks
        .filter(b => b && b.type === "thinking" && b.text)
        .map(b => b.text)
        .join("");
        
      const index = messages.findIndex(m => m.id === assistantMsgId);
      if (index !== -1) {
        messages[index].thinking = thinkings;
        messages = [...messages];
        scrollToBottom();
      }
    }
  }

  // Mouse Drag implementation using bound widget reference
  function startDrag(e: MouseEvent) {
    if (isMinimized) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('.resize-handle-tl') || target.closest('.resize-handle-br')) return;

    e.preventDefault();
    if (!widgetEl) return;

    const rect = widgetEl.getBoundingClientRect();
    if (x === null || y === null) {
      x = rect.left;
      y = rect.top;
    }

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = x;
    const startY = y;

    function doDrag(moveEvent: MouseEvent) {
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;
      x = Math.max(0, Math.min(window.innerWidth - width, startX + dx));
      y = Math.max(0, Math.min(window.innerHeight - height, startY + dy));
    }

    function stopDrag() {
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('mouseup', stopDrag);
    }

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  }

  // Top-left resizing implementation
  function startResizeTL(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!widgetEl) return;

    const rect = widgetEl.getBoundingClientRect();
    const isFixed = (x === null || y === null);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startWidth = width;
    const startHeight = height;
    const startX = isFixed ? rect.left : x!;
    const startY = isFixed ? rect.top : y!;

    function doResize(moveEvent: MouseEvent) {
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;

      const newWidth = Math.max(340, Math.min(800, startWidth - dx));
      const newHeight = Math.max(400, Math.min(900, startHeight - dy));

      const actualDx = startWidth - newWidth;
      const actualDy = startHeight - newHeight;

      width = newWidth;
      height = newHeight;

      if (!isFixed) {
        x = startX + actualDx;
        y = startY + actualDy;
      } else {
        // Fallback to absolute mode immediately to prevent jumping
        x = window.innerWidth - newWidth - 24;
        y = window.innerHeight - newHeight - 24;
      }
    }

    function stopResize() {
      window.removeEventListener('mousemove', doResize);
      window.removeEventListener('mouseup', stopResize);
    }

    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);
  }

  // Bottom-right resizing implementation
  function startResizeBR(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!widgetEl) return;

    const rect = widgetEl.getBoundingClientRect();
    const isFixed = (x === null || y === null);

    // If positioned via CSS bottom/right, lock current absolute x and y coordinates
    if (isFixed) {
      x = rect.left;
      y = rect.top;
    }

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startWidth = width;
    const startHeight = height;

    function doResize(moveEvent: MouseEvent) {
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;

      width = Math.max(340, Math.min(800, startWidth + dx));
      height = Math.max(400, Math.min(900, startHeight + dy));
    }

    function stopResize() {
      window.removeEventListener('mousemove', doResize);
      window.removeEventListener('mouseup', stopResize);
    }

    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);
  }

  // Markdown compiler helper
  function renderMarkdown(content: string): string {
    if (!content) return "";
    try {
      let html = marked.parse(content) as string;
      return DOMPurify.sanitize(html);
    } catch {
      return content;
    }
  }

  // Check if last message is assistant (for regenerate button)
  function isLastMessageAssistant(): boolean {
    if (messages.length === 0) return false;
    return messages[messages.length - 1].role === "assistant";
  }

  // Toggle Minimize
  function toggleMinimized() {
    isMinimized = !isMinimized;
    if (!isMinimized && sessions.length === 0) {
      loadSessions();
    }
    scrollToBottom();
  }

  // Lifecycle
  onMount(() => {
    if (!isBlocked && token) {
      loadSessions();
    }
  });
</script>

<div class="knovana-chat-container">
  <!-- Closed Floating Button -->
  {#if isMinimized}
    <button 
      class="floating-chat-trigger" 
      onclick={toggleMinimized} 
      title="打开智能助手"
      aria-label="打开智能助手"
    >
      <div class="trigger-ring">
        <svg class="trigger-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M8 10h.01M12 10h.01M16 10h.01"/>
        </svg>
      </div>
      <span class="trigger-badge">AI</span>
    </button>
  {:else}
    <!-- Open Draggable Resizable Window -->
    <div 
      class="widget-window"
      bind:this={widgetEl}
      style="width: {width}px; height: {height}px; left: {x !== null ? x + 'px' : 'auto'}; top: {y !== null ? y + 'px' : 'auto'};"
    >
      <!-- Notebook style margin line decoration -->
      <div class="notebook-margin-line"></div>

      <!-- Resize Handle (Top-Left corner) -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        class="resize-handle-tl" 
        onmousedown={startResizeTL}
        title="缩放 (左上角)"
      >
        <svg viewBox="0 0 100 100" class="resize-handle-svg"><line x1="100" y1="0" x2="0" y2="100" stroke="#b25a38" stroke-width="15" /></svg>
      </div>

      <!-- Resize Handle (Bottom-Right corner) -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        class="resize-handle-br" 
        onmousedown={startResizeBR}
        title="缩放 (右下角)"
      >
        <svg viewBox="0 0 100 100" class="resize-handle-svg-br"><line x1="0" y1="100" x2="100" y2="0" stroke="#b25a38" stroke-width="15" /></svg>
      </div>

      <!-- Drag Header -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="widget-header" onmousedown={startDrag}>
        <div class="header-left">
          {#if showSessions}
            <button class="header-icon-btn" onclick={() => showSessions = false} title="返回对话">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          {:else}
            <button class="header-icon-btn" onclick={() => { showSessions = true; loadSessions(); }} title="会话列表">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
            </button>
          {/if}
          <span class="header-title" title={showSessions ? '会话列表' : sessionTitle}>
            {showSessions ? '历史会话' : sessionTitle}
          </span>
        </div>
        <div class="header-right">
          {#if !showSessions}
            <button class="header-icon-btn" onclick={createNewSession} title="开启新对话">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
          {/if}
          <button class="header-icon-btn close" onclick={toggleMinimized} title="最小化">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Main Widget Body -->
      <div class="widget-body">
        {#if isBlocked}
          <div class="widget-blocked">
            <span class="blocked-lock">🔒</span>
            <h4>智能助手已锁定</h4>
            <p>您的账户尚未激活，请联系管理员激活以启用智能对话能力。</p>
          </div>
        {:else if showSessions}
          <!-- Session List View -->
          <div class="sessions-pane">
            <div class="sessions-header">
              <button class="widget-btn primary" onclick={createNewSession} style="width: 100%;">
                + 开启新的对话
              </button>
            </div>
            <div class="sessions-list-scroll">
              {#if loadingSessions}
                <div class="widget-loading">载入会话列表中...</div>
              {:else if sessions.length === 0}
                <div class="widget-empty">没有历史会话记录</div>
              {:else}
                <div class="sessions-grid">
                  {#each sessions as sess}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div 
                       class="session-item-card" 
                       class:selected={activeSessionId === sess.id}
                       onclick={() => selectSession(sess.id)}
                    >
                      <div class="session-card-info">
                        <div class="session-card-title">{sess.title || '无标题会话'}</div>
                        <div class="session-card-meta">
                          <span>💬 {sess.message_count || 0} 条消息</span>
                        </div>
                      </div>
                      <button 
                        class="session-delete-btn" 
                        onclick={(e) => deleteSession(sess.id, e)} 
                        title="删除会话"
                        aria-label="删除会话"
                      >
                        🗑️
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <!-- Conversation View -->
          <div class="chat-pane">
            <div class="chat-messages-container" bind:this={chatHistoryEl}>
              {#if loadingHistory}
                <div class="widget-loading">正在提取聊天记录...</div>
              {:else if messages.length === 0}
                <div class="chat-welcome">
                  <span class="welcome-avatar">📚</span>
                  <h3>Knovana AI 智能助手</h3>
                  <p>您可以问我关于知识库整理、Markdown格式优化、专题归纳的任何问题，我会竭诚为您提供分析和编写服务。</p>
                </div>
              {:else}
                <div class="messages-list">
                  {#each messages as msg}
                    <div class="message-row {msg.role}">
                      <div class="message-avatar">
                        {msg.role === 'user' ? '👤' : '🤖'}
                      </div>
                      <div class="message-content-wrapper">
                        <!-- Thinking details accordion (only for assistant with thinking field) -->
                        {#if msg.role === 'assistant' && msg.thinking}
                          <details class="thinking-details" open={generating && messages[messages.length-1].id === msg.id}>
                            <summary>🧠 推理思考过程</summary>
                            <pre class="thinking-text">{msg.thinking}</pre>
                          </details>
                        {/if}
                        
                        <div class="message-bubble">
                          {#if msg.role === 'user'}
                            <p style="white-space: pre-wrap; margin: 0;">{msg.content}</p>
                          {:else}
                            <div class="markdown-rich-content">
                              {@html renderMarkdown(msg.content)}
                            </div>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Composer Input Area -->
            <div class="composer-container">
              <div class="composer-card">
                <textarea
                  class="composer-textarea"
                  placeholder="向 Knovana 提问..."
                  bind:value={chatInput}
                  disabled={generating}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                ></textarea>
                <div class="composer-toolbar">
                  <div class="toolbar-left">
                    {#if statusText}
                      <div class="status-indicator">
                        <span class="pulse-icon">●</span>
                        <span class="status-msg">{statusText}</span>
                      </div>
                    {:else if isLastMessageAssistant() && !generating}
                      <button class="widget-btn-small" onclick={regenerateLastResponse}>
                        🔄 重新生成
                      </button>
                    {/if}
                  </div>
                  <div class="toolbar-right">
                    <button 
                      class="widget-send-btn" 
                      onclick={sendChatMessage} 
                      disabled={generating || !chatInput.trim()}
                      title="发送"
                      aria-label="发送"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m22 2-7 20-4-9-9-4Z"/>
                        <path d="M22 2 11 13"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Fully scoped custom element styles for Shadow DOM */
  
  :host {
    /* Set Outfit / Lora font stacks locally in shadow root */
    --font-sans: "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-serif: "Lora", Georgia, "Times New Roman", serif;
    --bg-paper: #fcfbf9;
    --bg-card: #f5f4ef;
    --bg-card-hover: #ebeae4;
    --text-ink: #1c1c1a;
    --text-muted: #5e5c54;
    --border-fine: #e6e4dc;
    --accent-ochre: #b25a38;
    --accent-terracotta: #a04724;
    --accent-sage: #4a6b5d;
    
    font-family: var(--font-sans);
    color: var(--text-ink);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .knovana-chat-container {
    position: relative;
    font-family: var(--font-sans);
    line-height: 1.5;
  }

  /* Redesigned Floating Chat Trigger (Premium Paper Stamp Style) */
  .floating-chat-trigger {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 54px;
    height: 54px;
    border-radius: 14px; /* Squircle appearance */
    background: var(--bg-paper);
    border: 1.5px solid var(--text-ink);
    box-shadow: 
      0 4px 10px rgba(28, 28, 26, 0.08), 
      0 12px 28px rgba(28, 28, 26, 0.06);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    outline: none;
    padding: 3px;
  }

  .trigger-ring {
    width: 100%;
    height: 100%;
    border-radius: 10px;
    border: 1px dashed var(--border-fine);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s ease;
  }

  .trigger-svg {
    width: 22px;
    height: 22px;
    color: var(--accent-ochre);
    transition: transform 0.25s ease, color 0.2s ease;
  }

  .floating-chat-trigger:hover {
    transform: translateY(-4px) scale(1.04);
    background: var(--text-ink);
    border-color: var(--text-ink);
    box-shadow: 
      0 6px 15px rgba(28, 28, 26, 0.14), 
      0 18px 36px rgba(28, 28, 26, 0.1);
  }

  .floating-chat-trigger:hover .trigger-ring {
    border-color: var(--text-muted);
  }

  .floating-chat-trigger:hover .trigger-svg {
    transform: rotate(5deg) scale(1.05);
    color: var(--bg-paper);
  }

  .trigger-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--accent-ochre);
    color: #ffffff;
    font-size: 8px;
    font-weight: 700;
    padding: 1px 4.5px;
    border-radius: 6px;
    border: 1.5px solid var(--bg-paper);
    font-family: var(--font-sans);
    letter-spacing: 0.5px;
  }

  /* Open Floating Window (Notebook Aesthetic) */
  .widget-window {
    position: fixed;
    right: 24px;
    bottom: 24px; /* Aligned vertically with trigger bottom */
    z-index: 9999;
    background: var(--bg-paper);
    border: 1.5px solid var(--text-ink);
    border-radius: 12px;
    box-shadow: 
      0 12px 36px rgba(28, 28, 26, 0.08), 
      0 24px 72px rgba(28, 28, 26, 0.06);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 340px;
    min-height: 400px;
    max-width: 90vw;
    max-height: 90vh;
    animation: windowFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes windowFadeIn {
    from { opacity: 0; transform: translateY(15px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Vertical Notebook Ruler Line */
  .notebook-margin-line {
    position: absolute;
    left: 20px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: #e07b6b;
    opacity: 0.35;
    pointer-events: none;
    z-index: 99;
  }

  /* Drag Header (Premium leather/card strip) */
  .widget-header {
    height: 46px;
    background: var(--bg-card);
    border-bottom: 1.5px solid var(--text-ink);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px 0 28px; /* Left padded to clear margin line */
    cursor: move;
    user-select: none;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .header-title {
    font-size: 13.5px;
    font-weight: 700;
    font-family: var(--font-sans);
    color: var(--text-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.3px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .header-icon-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    width: 26px;
    height: 26px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    outline: none;
  }

  .header-icon-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
  }

  .header-icon-btn.close:hover {
    color: #ef4444;
    background: #fee2e2;
  }

  /* Top-left resize handle */
  .resize-handle-tl {
    position: absolute;
    top: 0;
    left: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    z-index: 10000;
    background: transparent;
  }

  .resize-handle-svg {
    width: 7px;
    height: 7px;
    position: absolute;
    top: 2px;
    left: 2px;
    opacity: 0.5;
    transition: opacity 0.2s ease;
  }

  .resize-handle-tl:hover .resize-handle-svg {
    opacity: 1;
  }

  /* Bottom-right resize handle */
  .resize-handle-br {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    cursor: se-resize;
    z-index: 10000;
    background: transparent;
  }

  .resize-handle-svg-br {
    width: 7px;
    height: 7px;
    position: absolute;
    bottom: 2px;
    right: 2px;
    opacity: 0.5;
    transition: opacity 0.2s ease;
  }

  .resize-handle-br:hover .resize-handle-svg-br {
    opacity: 1;
  }

  /* Main body container */
  .widget-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-paper);
    position: relative;
  }

  .widget-blocked {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    height: 100%;
    text-align: center;
  }

  .blocked-lock {
    font-size: 44px;
    margin-bottom: 14px;
  }

  .widget-blocked h4 {
    font-family: var(--font-sans);
    font-weight: 700;
    margin-bottom: 6px;
    font-size: 14px;
  }

  .widget-blocked p {
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.45;
  }

  /* Scroll areas */
  .chat-messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px 16px 16px 28px; /* Left padded to clear notebook margin line */
  }

  /* Custom Scrollbar for messages & code */
  .chat-messages-container::-webkit-scrollbar,
  .thinking-text::-webkit-scrollbar,
  .sessions-list-scroll::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  .chat-messages-container::-webkit-scrollbar-track,
  .thinking-text::-webkit-scrollbar-track,
  .sessions-list-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .chat-messages-container::-webkit-scrollbar-thumb,
  .thinking-text::-webkit-scrollbar-thumb,
  .sessions-list-scroll::-webkit-scrollbar-thumb {
    background: var(--bg-card-hover);
    border-radius: 3px;
  }
  .chat-messages-container::-webkit-scrollbar-thumb:hover,
  .thinking-text::-webkit-scrollbar-thumb:hover,
  .sessions-list-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--accent-ochre);
  }

  .chat-welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 60px 10px;
    color: var(--text-muted);
  }

  .welcome-avatar {
    font-size: 44px;
    margin-bottom: 12px;
  }

  .chat-welcome h3 {
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 6px;
    color: var(--text-ink);
  }

  .chat-welcome p {
    font-size: 12px;
    line-height: 1.5;
    max-width: 250px;
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Message balloon layout */
  .message-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .message-row.user {
    flex-direction: row-reverse;
  }

  .message-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--bg-card);
    border: 1px solid var(--border-fine);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
    user-select: none;
  }

  .message-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 78%;
  }

  .message-bubble {
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
  }

  /* Redesigned Paper theme bubble colors */
  .message-row.user .message-bubble {
    background: #fdfaf7;
    color: var(--text-ink);
    border: 1.5px solid var(--accent-ochre);
    border-top-right-radius: 2px;
    text-align: left;
    box-shadow: 0 2px 6px rgba(178, 90, 56, 0.05);
  }

  .message-row.assistant .message-bubble {
    background: #ffffff;
    color: var(--text-ink);
    border: 1px dashed var(--border-fine);
    border-top-left-radius: 2px;
    box-shadow: 0 2px 6px rgba(28, 28, 26, 0.02);
  }

  /* Thinking Details styles */
  .thinking-details {
    margin-bottom: 6px;
    border: 1px dashed var(--border-fine);
    border-radius: 6px;
    background: var(--bg-card);
    overflow: hidden;
  }

  .thinking-details summary {
    padding: 6px 10px;
    font-size: 10px;
    font-weight: 700;
    color: var(--accent-ochre);
    cursor: pointer;
    user-select: none;
    outline: none;
    background: var(--bg-card-hover);
  }

  .thinking-text {
    padding: 10px;
    font-family: monospace;
    font-size: 10.5px;
    color: var(--text-muted);
    background: var(--bg-card);
    max-height: 100px;
    overflow-y: auto;
    white-space: pre-wrap;
    border-top: 1px dashed var(--border-fine);
    margin: 0;
  }

  /* Markdown custom styles inside Chat message bubble */
  .markdown-rich-content {
    font-family: var(--font-sans);
  }

  .markdown-rich-content h1,
  .markdown-rich-content h2,
  .markdown-rich-content h3 {
    font-family: var(--font-sans);
    font-size: 1.05em;
    font-weight: 700;
    margin-top: 10px;
    margin-bottom: 4px;
  }

  .markdown-rich-content p {
    margin-bottom: 6px;
  }
  .markdown-rich-content p:last-child {
    margin-bottom: 0;
  }

  .markdown-rich-content ul,
  .markdown-rich-content ol {
    margin-bottom: 6px;
    padding-left: 16px;
  }

  .markdown-rich-content li {
    margin-bottom: 2px;
  }

  .markdown-rich-content code {
    font-family: monospace;
    background: var(--bg-card);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.9em;
    border: 1px solid var(--border-fine);
  }

  .markdown-rich-content pre {
    background: #252422;
    color: #f4f3ef;
    padding: 8px 10px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 6px 0;
  }

  .markdown-rich-content pre code {
    background: transparent;
    border: none;
    padding: 0;
    font-size: 0.85em;
    color: inherit;
  }

  .markdown-rich-content blockquote {
    border-left: 2px solid var(--accent-sage);
    padding-left: 8px;
    color: var(--text-muted);
    margin: 6px 0;
    font-style: italic;
  }

  /* Streamlined Composer Card Layout (Extension-style) */
  .composer-container {
    padding: 10px 14px 14px 28px; /* Left padded to align with notebook lines */
    background: transparent;
    flex-shrink: 0;
    z-index: 100;
  }

  .composer-card {
    background: #ffffff;
    border: 1.5px solid var(--text-ink);
    border-radius: 12px;
    padding: 8px 10px 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 0 2px 8px rgba(28, 28, 26, 0.04);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .composer-card:focus-within {
    border-color: var(--accent-ochre);
    box-shadow: 
      0 4px 12px rgba(28, 28, 26, 0.06),
      0 0 0 3px rgba(178, 90, 56, 0.08);
  }

  .composer-textarea {
    border: 0;
    outline: none;
    resize: none;
    background: transparent;
    padding: 2px 0;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
    color: var(--text-ink);
    min-height: 24px;
    max-height: 120px;
    width: 100%;
    scrollbar-width: thin;
  }

  .composer-textarea::placeholder {
    color: var(--text-muted);
  }

  .composer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px dashed var(--border-fine);
    padding-top: 6px;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
  }

  .widget-send-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--text-ink);
    border: none;
    color: var(--bg-paper);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    outline: none;
    flex-shrink: 0;
  }

  .widget-send-btn:hover:not(:disabled) {
    background: var(--accent-ochre);
    transform: scale(1.05);
  }

  .widget-send-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
  }

  /* Status message under composer toolbar */
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: 10px;
  }

  .pulse-icon {
    color: var(--accent-ochre);
    font-size: 8px;
    animation: statusPulse 1.2s infinite;
  }

  @keyframes statusPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  .status-msg {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .widget-btn-small {
    background: transparent;
    border: 1px solid var(--border-fine);
    color: var(--text-muted);
    padding: 2px 6px;
    font-size: 10px;
    border-radius: 4px;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: all 0.15s ease;
    outline: none;
  }

  .widget-btn-small:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
    border-color: var(--text-ink);
  }

  /* General Button styling */
  .widget-btn {
    padding: 6px 12px;
    background: var(--bg-card);
    border: 1px solid var(--text-ink);
    color: var(--text-ink);
    border-radius: 4px;
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }

  .widget-btn:hover {
    background: var(--text-ink);
    color: var(--bg-paper);
  }

  .widget-btn.primary {
    background: var(--accent-ochre);
    border-color: var(--accent-ochre);
    color: #ffffff;
  }

  .widget-btn.primary:hover {
    background: var(--accent-terracotta);
    border-color: var(--accent-terracotta);
  }

  /* Sessions pane */
  .sessions-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sessions-header {
    padding: 10px 14px 10px 28px;
    border-bottom: 1px solid var(--border-fine);
    background: var(--bg-card);
  }

  .sessions-list-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 12px 12px 28px;
  }

  .sessions-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .session-item-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 12px;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .session-item-card:hover {
    border-color: var(--text-ink);
    background: var(--bg-card);
  }

  .session-item-card.selected {
    border-color: var(--accent-ochre);
    background: rgba(178, 90, 56, 0.04);
  }

  .session-card-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .session-card-title {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--text-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }

  .session-card-meta {
    font-size: 10.5px;
    color: var(--text-muted);
    text-align: left;
  }

  .session-delete-btn {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    opacity: 0.4;
    transition: all 0.15s ease;
    outline: none;
  }

  .session-item-card:hover .session-delete-btn {
    opacity: 0.7;
  }

  .session-delete-btn:hover {
    background: #fee2e2;
    opacity: 1 !important;
  }

  .widget-loading, .widget-empty {
    padding: 30px;
    font-size: 11.5px;
    color: var(--text-muted);
    text-align: center;
  }

  .chat-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
