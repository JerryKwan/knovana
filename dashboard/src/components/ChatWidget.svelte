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
  let statusIndicator = $state<'thinking' | 'tool' | 'loading'>('thinking');
  let loadingHistory = $state(false);
  let loadingSessions = $state(false);

  let chatHistoryEl = $state<HTMLElement | null>(null);
  let widgetEl = $state<HTMLElement | null>(null);
  let copiedMessageId = $state<string | null>(null);

  // Derived state to find the index of the last user message
  let lastUserMessageIndex = $derived.by(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return i;
      }
    }
    return -1;
  });

  // Auto scroll to bottom when messages or generation state changes
  $effect(() => {
    const msgCount = messages.length;
    const isGenerating = generating;
    const lastMsgContent = msgCount > 0 ? messages[msgCount - 1].content : '';
    const lastMsgThinking = msgCount > 0 ? messages[msgCount - 1].thinking : '';
    const lastMsgBlocks = msgCount > 0 ? (messages[msgCount - 1].blocks?.length || 0) : 0;
    scrollToBottom();
  });

  // Svelte helpers for assistant blocks and placeholders
  function shouldShowAssistantPlaceholder(msg: any): boolean {
    if (msg.role !== 'assistant') return false;
    const isStreaming = generating && messages[messages.length - 1]?.id === msg.id;
    if (!isStreaming) return false;
    if (msg.error) return false;

    const hasText = msg.content && msg.content.trim().length > 0;
    const hasThinking = msg.thinking && msg.thinking.trim().length > 0;
    const hasBlocks = msg.blocks && msg.blocks.length > 0 && msg.blocks.some((b: any) => {
      if (b.type === 'text' || b.type === 'thinking') {
        return b.text && b.text.trim().length > 0;
      }
      if (b.type === 'tool_call') {
        return b.name.trim().length > 0 || Object.keys(b.input).length > 0 || Boolean(b.partialJson?.trim());
      }
      return true;
    });

    return !hasText && !hasThinking && !hasBlocks;
  }

  function formatToolValue(content: unknown): string {
    if (content === null || content === undefined) {
      return '';
    }
    if (typeof content === 'string') {
      return content.replace(/\r\n?/g, '\n');
    }
    if (
      typeof content === 'number' ||
      typeof content === 'boolean' ||
      typeof content === 'bigint'
    ) {
      return String(content);
    }
    try {
      return JSON.stringify(content, null, 2).replace(/\r\n?/g, '\n');
    } catch {
      return String(content).replace(/\r\n?/g, '\n');
    }
  }

  function hasToolResultContent(content: unknown): boolean {
    if (content === null || content === undefined) {
      return false;
    }
    if (typeof content === 'string') {
      return content.length > 0;
    }
    return true;
  }

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
      messages = (res.messages || []).map((m: any) => ({
        ...m,
        blocks: m.role === 'assistant' ? [{ type: 'text', text: m.content || "" }] : undefined
      }));
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
    statusIndicator = "loading";
    
    let assistantMsgId = `msg_assistant_${Date.now()}`;
    // Immediately append assistant placeholder message
    messages = [...messages, {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      thinking: "",
      blocks: []
    }];
    scrollToBottom();
    
    let contentBlocks: any[] = [];
    
    function updateAssistantBlocks() {
      const index = messages.findIndex(m => m.id === assistantMsgId);
      if (index !== -1) {
        messages[index].blocks = [...contentBlocks.filter(Boolean)];
        messages[index].content = contentBlocks
          .filter(b => b && b.type === "text" && b.text)
          .map(b => b.text)
          .join("");
        messages[index].thinking = contentBlocks
          .filter(b => b && b.type === "thinking" && b.text)
          .map(b => b.text)
          .join("");
        messages = [...messages];
      }
    }
    
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
          const oldId = assistantMsgId;
          assistantMsgId = chunk.message?.id;
          const idx = messages.findIndex(m => m.id === oldId);
          if (idx !== -1) {
            messages[idx].id = assistantMsgId;
            messages = [...messages];
          }
          statusText = "思考中...";
          statusIndicator = "thinking";
        } else if (chunk.type === "session_created") {
          if (!activeSessionId) {
            activeSessionId = chunk.session_id;
            loadSessions();
          }
        } else if (chunk.type === "status") {
          statusText = chunk.text || "";
          statusIndicator = chunk.indicator || "thinking";
        } else if (chunk.type === "content_block_start") {
          const idx = chunk.index;
          const cb = chunk.content_block || {};
          let newBlock: any;
          if (cb.type === "tool_call") {
            newBlock = {
              type: "tool_call",
              id: cb.id,
              name: cb.name,
              input: cb.input || {},
              partialJson: ""
            };
            statusText = `正在执行工具 ${cb.name}...`;
            statusIndicator = "tool";
          } else if (cb.type === "tool_result") {
            newBlock = {
              type: "tool_result",
              tool_call_id: cb.tool_call_id,
              status: cb.status || "success",
              content: cb.content
            };
          } else if (cb.type === "text") {
            newBlock = {
              type: "text",
              text: ""
            };
            statusText = "正在生成回复...";
            statusIndicator = "thinking";
          } else if (cb.type === "thinking") {
            newBlock = {
              type: "thinking",
              text: ""
            };
            statusText = "思考中...";
            statusIndicator = "thinking";
          } else if (cb.type === "widget") {
            newBlock = {
              type: "widget",
              widget_type: cb.widget_type,
              data: cb.data
            };
          }
          contentBlocks[idx] = newBlock;
          updateAssistantBlocks();
        } else if (chunk.type === "content_block_delta") {
          const idx = chunk.index;
          const delta = chunk.delta || {};
          let block = contentBlocks[idx];
          if (!block) {
            if (delta.type === "text_delta") {
              block = { type: "text", text: "" };
            } else if (delta.type === "thinking_delta") {
              block = { type: "thinking", text: "" };
            } else if (delta.type === "input_json_delta") {
              block = { type: "tool_call", id: "", name: "", input: {}, partialJson: "" };
            }
            contentBlocks[idx] = block;
          }
          if (block) {
            if (block.type === "text" && delta.type === "text_delta") {
              block.text = (block.text || "") + (delta.text || "");
              statusText = "正在生成回复...";
              statusIndicator = "thinking";
            } else if (block.type === "thinking" && delta.type === "thinking_delta") {
              block.text = (block.text || "") + (delta.text || "");
              statusText = "思考中...";
              statusIndicator = "thinking";
            } else if (block.type === "tool_call" && delta.type === "input_json_delta") {
              block.partialJson = (block.partialJson || "") + (delta.partial_json || "");
              try {
                block.input = JSON.parse(block.partialJson);
              } catch {}
              statusText = block.name ? `正在执行工具 ${block.name}...` : "正在准备工具调用...";
              statusIndicator = "tool";
            }
            contentBlocks[idx] = block;
            updateAssistantBlocks();
          }
        } else if (chunk.type === "content_block_stop") {
          const idx = chunk.index;
          const cb = chunk.content_block || {};
          let block = contentBlocks[idx];
          if (cb.type === "tool_call") {
            block = {
              type: "tool_call",
              id: cb.id,
              name: cb.name,
              input: cb.input || {}
            };
            statusText = "思考中...";
            statusIndicator = "thinking";
          } else if (cb.type === "tool_result") {
            block = {
              type: "tool_result",
              tool_call_id: cb.tool_call_id,
              status: cb.status || "success",
              content: cb.content
            };
          } else if (cb.type === "text") {
            block = {
              type: "text",
              text: cb.text || ""
            };
            statusText = "正在生成回复...";
            statusIndicator = "thinking";
          } else if (cb.type === "thinking") {
            block = {
              type: "thinking",
              text: cb.text || ""
            };
            statusText = "思考中...";
            statusIndicator = "thinking";
          } else if (cb.type === "widget") {
            block = {
              type: "widget",
              widget_type: cb.widget_type,
              data: cb.data
            };
          }
          contentBlocks[idx] = block;
          updateAssistantBlocks();
        } else if (chunk.type === "message_end") {
          statusText = "";
        } else if (chunk.type === "error") {
          statusText = `Error: ${chunk.error?.message || "流式输出故障"}`;
          statusIndicator = "thinking";
          const idx = messages.findIndex(m => m.id === assistantMsgId);
          if (idx !== -1) {
            messages[idx].error = chunk.error?.message || "流式输出故障";
            messages = [...messages];
          }
        }
      });
    } catch (err: any) {
      console.error("Streaming error", err);
      statusText = `连接助手失败: ${err.message || "未知网络错误"}`;
      const idx = messages.findIndex(m => m.id === assistantMsgId);
      if (idx !== -1) {
        messages[idx].error = err.message || "未知网络错误";
        messages = [...messages];
      }
    } finally {
      generating = false;
      await loadSessions();
    }
  }

  // Regenerate last response
  async function regenerateLastResponse() {
    if (!activeSessionId || generating || isBlocked) return;
    
    generating = true;
    statusText = "正在重新思考...";
    statusIndicator = "loading";
    
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant") {
      messages = messages.slice(0, -1);
    }
    
    let assistantMsgId = `msg_assistant_${Date.now()}`;
    // Immediately append assistant placeholder message
    messages = [...messages, {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      thinking: "",
      blocks: []
    }];
    scrollToBottom();
    
    let contentBlocks: any[] = [];
    
    function updateAssistantBlocks() {
      const index = messages.findIndex(m => m.id === assistantMsgId);
      if (index !== -1) {
        messages[index].blocks = [...contentBlocks.filter(Boolean)];
        messages[index].content = contentBlocks
          .filter(b => b && b.type === "text" && b.text)
          .map(b => b.text)
          .join("");
        messages[index].thinking = contentBlocks
          .filter(b => b && b.type === "thinking" && b.text)
          .map(b => b.text)
          .join("");
        messages = [...messages];
      }
    }
    
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
          const oldId = assistantMsgId;
          assistantMsgId = chunk.message?.id;
          const idx = messages.findIndex(m => m.id === oldId);
          if (idx !== -1) {
            messages[idx].id = assistantMsgId;
            messages = [...messages];
          }
          statusText = "思考中...";
          statusIndicator = "thinking";
        } else if (chunk.type === "status") {
          statusText = chunk.text || "";
          statusIndicator = chunk.indicator || "thinking";
        } else if (chunk.type === "content_block_start") {
          const idx = chunk.index;
          const cb = chunk.content_block || {};
          let newBlock: any;
          if (cb.type === "tool_call") {
            newBlock = {
              type: "tool_call",
              id: cb.id,
              name: cb.name,
              input: cb.input || {},
              partialJson: ""
            };
            statusText = `正在执行工具 ${cb.name}...`;
            statusIndicator = "tool";
          } else if (cb.type === "tool_result") {
            newBlock = {
              type: "tool_result",
              tool_call_id: cb.tool_call_id,
              status: cb.status || "success",
              content: cb.content
            };
          } else if (cb.type === "text") {
            newBlock = {
              type: "text",
              text: ""
            };
            statusText = "正在生成回复...";
            statusIndicator = "thinking";
          } else if (cb.type === "thinking") {
            newBlock = {
              type: "thinking",
              text: ""
            };
            statusText = "思考中...";
            statusIndicator = "thinking";
          } else if (cb.type === "widget") {
            newBlock = {
              type: "widget",
              widget_type: cb.widget_type,
              data: cb.data
            };
          }
          contentBlocks[idx] = newBlock;
          updateAssistantBlocks();
        } else if (chunk.type === "content_block_delta") {
          const idx = chunk.index;
          const delta = chunk.delta || {};
          let block = contentBlocks[idx];
          if (!block) {
            if (delta.type === "text_delta") {
              block = { type: "text", text: "" };
            } else if (delta.type === "thinking_delta") {
              block = { type: "thinking", text: "" };
            } else if (delta.type === "input_json_delta") {
              block = { type: "tool_call", id: "", name: "", input: {}, partialJson: "" };
            }
            contentBlocks[idx] = block;
          }
          if (block) {
            if (block.type === "text" && delta.type === "text_delta") {
              block.text = (block.text || "") + (delta.text || "");
              statusText = "正在生成回复...";
              statusIndicator = "thinking";
            } else if (block.type === "thinking" && delta.type === "thinking_delta") {
              block.text = (block.text || "") + (delta.text || "");
              statusText = "思考中...";
              statusIndicator = "thinking";
            } else if (block.type === "tool_call" && delta.type === "input_json_delta") {
              block.partialJson = (block.partialJson || "") + (delta.partial_json || "");
              try {
                block.input = JSON.parse(block.partialJson);
              } catch {}
              statusText = block.name ? `正在执行工具 ${block.name}...` : "正在准备工具调用...";
              statusIndicator = "tool";
            }
            contentBlocks[idx] = block;
            updateAssistantBlocks();
          }
        } else if (chunk.type === "content_block_stop") {
          const idx = chunk.index;
          const cb = chunk.content_block || {};
          let block = contentBlocks[idx];
          if (cb.type === "tool_call") {
            block = {
              type: "tool_call",
              id: cb.id,
              name: cb.name,
              input: cb.input || {}
            };
            statusText = "思考中...";
            statusIndicator = "thinking";
          } else if (cb.type === "tool_result") {
            block = {
              type: "tool_result",
              tool_call_id: cb.tool_call_id,
              status: cb.status || "success",
              content: cb.content
            };
          } else if (cb.type === "text") {
            block = {
              type: "text",
              text: cb.text || ""
            };
            statusText = "正在生成回复...";
            statusIndicator = "thinking";
          } else if (cb.type === "thinking") {
            block = {
              type: "thinking",
              text: cb.text || ""
            };
            statusText = "思考中...";
            statusIndicator = "thinking";
          } else if (cb.type === "widget") {
            block = {
              type: "widget",
              widget_type: cb.widget_type,
              data: cb.data
            };
          }
          contentBlocks[idx] = block;
          updateAssistantBlocks();
        } else if (chunk.type === "message_end") {
          statusText = "";
        } else if (chunk.type === "error") {
          statusText = `Error: ${chunk.error?.message || "流式输出故障"}`;
          statusIndicator = "thinking";
          const idx = messages.findIndex(m => m.id === assistantMsgId);
          if (idx !== -1) {
            messages[idx].error = chunk.error?.message || "流式输出故障";
            messages = [...messages];
          }
        }
      });
    } catch (err: any) {
      console.error("Regeneration error", err);
      statusText = `重新生成回答失败: ${err.message || "未知网络错误"}`;
      const idx = messages.findIndex(m => m.id === assistantMsgId);
      if (idx !== -1) {
        messages[idx].error = err.message || "未知网络错误";
        messages = [...messages];
      }
    } finally {
      generating = false;
    }
  }

  // Copy message text to clipboard with temporary feedback
  async function copyMessage(messageId: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      copiedMessageId = messageId;
      setTimeout(() => {
        if (copiedMessageId === messageId) {
          copiedMessageId = null;
        }
      }, 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }

  // Download / Export message as Markdown
  function exportMessage(role: string, content: string) {
    const isAssistant = role === 'assistant';
    const filename = `${isAssistant ? 'assistant' : 'user'}-message-${Date.now()}.${isAssistant ? 'md' : 'txt'}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
  <!-- Closed Floating Button (Linen Stamp style with K Logo) -->
  {#if isMinimized}
    <button 
      class="floating-chat-trigger" 
      onclick={toggleMinimized} 
      title="打开智能助手"
      aria-label="打开智能助手"
    >
      <div class="trigger-ring">
        <svg class="trigger-svg" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="trigStemGrad" x1="34" y1="25" x2="58" y2="103" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#1E40AF" />
              <stop offset="1" stop-color="#1D3082" />
            </linearGradient>
            <linearGradient id="trigSpineBevel" x1="34" y1="64" x2="43" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#0F1F5C" stop-opacity="0.30" />
              <stop offset="0.42" stop-color="#142C82" stop-opacity="0.14" />
              <stop offset="1" stop-color="#142C82" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="trigSpineInnerLight" x1="54" y1="64" x2="58" y2="64" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#FFFFFF" stop-opacity="0" />
              <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.13" />
            </linearGradient>
            <linearGradient id="trigFaceTop" x1="58" y1="64" x2="102" y2="19" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#1D4FD7" />
              <stop offset="0.6" stop-color="#2D6FE8" />
              <stop offset="1" stop-color="#5B9CF5" />
            </linearGradient>
            <linearGradient id="trigFaceBot" x1="58" y1="65" x2="102" y2="109" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#0C8B7F" />
              <stop offset="0.55" stop-color="#0E9B89" />
              <stop offset="1" stop-color="#0FB87E" />
            </linearGradient>
          </defs>
          <g>
            <rect x="34" y="26" width="24" height="76" rx="1.5" fill="url(#trigStemGrad)" />
            <rect x="34.5" y="27" width="8.5" height="74" rx="1.1" fill="url(#trigSpineBevel)" />
            <rect x="53.5" y="27" width="4" height="74" rx="1.1" fill="url(#trigSpineInnerLight)" />
            <polygon points="58,64 76,28 90,28 108,42 82,64" fill="url(#trigFaceTop)" />
            <polygon points="60,60 76,30 88,30 76,48" fill="white" opacity="0.10" />
            <polygon points="58,65 82,65 108,86 90,100 76,100" fill="url(#trigFaceBot)" />
            <polygon points="60,67 76,67 84,76 68,88" fill="white" opacity="0.08" />
            <line x1="58" y1="64.5" x2="82" y2="64.5" stroke="#0F2E5C" stroke-width="1" opacity="0.20" />
          </g>
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
                  <div class="welcome-avatar-container">
                    <svg class="welcome-k-svg" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="welStemGrad" x1="34" y1="25" x2="58" y2="103" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stop-color="#1E40AF" />
                          <stop offset="1" stop-color="#1D3082" />
                        </linearGradient>
                        <linearGradient id="welSpineBevel" x1="34" y1="64" x2="43" y2="64" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stop-color="#0F1F5C" stop-opacity="0.30" />
                          <stop offset="0.42" stop-color="#142C82" stop-opacity="0.14" />
                          <stop offset="1" stop-color="#142C82" stop-opacity="0" />
                        </linearGradient>
                        <linearGradient id="welSpineInnerLight" x1="54" y1="64" x2="58" y2="64" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stop-color="#FFFFFF" stop-opacity="0" />
                          <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.13" />
                        </linearGradient>
                        <linearGradient id="welFaceTop" x1="58" y1="64" x2="102" y2="19" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stop-color="#1D4FD7" />
                          <stop offset="0.6" stop-color="#2D6FE8" />
                          <stop offset="1" stop-color="#5B9CF5" />
                        </linearGradient>
                        <linearGradient id="welFaceBot" x1="58" y1="65" x2="102" y2="109" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stop-color="#0C8B7F" />
                          <stop offset="0.55" stop-color="#0E9B89" />
                          <stop offset="1" stop-color="#0FB87E" />
                        </linearGradient>
                      </defs>
                      <g>
                        <rect x="34" y="26" width="24" height="76" rx="1.5" fill="url(#welStemGrad)" />
                        <rect x="34.5" y="27" width="8.5" height="74" rx="1.1" fill="url(#welSpineBevel)" />
                        <rect x="53.5" y="27" width="4" height="74" rx="1.1" fill="url(#welSpineInnerLight)" />
                        <polygon points="58,64 76,28 90,28 108,42 82,64" fill="url(#welFaceTop)" />
                        <polygon points="60,60 76,30 88,30 76,48" fill="white" opacity="0.10" />
                        <polygon points="58,65 82,65 108,86 90,100 76,100" fill="url(#welFaceBot)" />
                        <polygon points="60,67 76,67 84,76 68,88" fill="white" opacity="0.08" />
                        <line x1="58" y1="64.5" x2="82" y2="64.5" stroke="#0F2E5C" stroke-width="1" opacity="0.20" />
                      </g>
                    </svg>
                  </div>
                  <h3>Knovana AI 智能助手</h3>
                  <p>您可以问我关于知识库整理、Markdown 格式优化、专题归纳的任何问题，我会竭诚为您提供分析和编写服务。</p>
                </div>
              {:else}
                <div class="messages-list">
                  {#each messages as msg, index (msg.id || index)}
                    <div class="message-row {msg.role}">
                      {#if msg.role === 'user'}
                        <div class="message-content-wrapper">
                          <div class="message-bubble">
                            <p style="white-space: pre-wrap; margin: 0;">{msg.content}</p>
                          </div>
                          
                          <!-- Action Bar for Copy / Export / Regenerate -->
                          <div class="message-actions user-actions">
                            <button
                              type="button"
                              class="action-button"
                              title="复制内容"
                              onclick={() => copyMessage(msg.id, msg.content)}
                            >
                              {#if copiedMessageId === msg.id}
                                <span class="copied-feedback">✓</span>
                              {:else}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              {/if}
                            </button>
                            <button
                              type="button"
                              class="action-button"
                              title="导出消息"
                              onclick={() => exportMessage(msg.role, msg.content)}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            </button>
                            {#if index === lastUserMessageIndex && !generating}
                              <button
                                type="button"
                                class="action-button regenerate-btn"
                                title="重新生成"
                                onclick={regenerateLastResponse}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                              </button>
                            {/if}
                          </div>
                        </div>
                      {:else}
                        <div class="assistant-message-container">
                          <div class="message-header">
                            <div class="avatar assistant">
                              <svg class="avatar-k-svg" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                  <linearGradient id="avatarStemGrad" x1="34" y1="25" x2="58" y2="103" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stop-color="#1E40AF" />
                                    <stop offset="1" stop-color="#1D3082" />
                                  </linearGradient>
                                  <linearGradient id="avatarSpineBevel" x1="34" y1="64" x2="43" y2="64" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stop-color="#0F1F5C" stop-opacity="0.30" />
                                    <stop offset="0.42" stop-color="#142C82" stop-opacity="0.14" />
                                    <stop offset="1" stop-color="#142C82" stop-opacity="0" />
                                  </linearGradient>
                                  <linearGradient id="avatarSpineInnerLight" x1="54" y1="64" x2="58" y2="64" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0" />
                                    <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.13" />
                                  </linearGradient>
                                  <linearGradient id="avatarFaceTop" x1="58" y1="64" x2="102" y2="19" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stop-color="#1D4FD7" />
                                    <stop offset="0.6" stop-color="#2D6FE8" />
                                    <stop offset="1" stop-color="#5B9CF5" />
                                  </linearGradient>
                                  <linearGradient id="avatarFaceBot" x1="58" y1="65" x2="102" y2="109" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stop-color="#0C8B7F" />
                                    <stop offset="0.55" stop-color="#0E9B89" />
                                    <stop offset="1" stop-color="#0FB87E" />
                                  </linearGradient>
                                </defs>
                                <g>
                                  <rect x="34" y="26" width="24" height="76" rx="1.5" fill="url(#avatarStemGrad)" />
                                  <rect x="34.5" y="27" width="8.5" height="74" rx="1.1" fill="url(#avatarSpineBevel)" />
                                  <rect x="53.5" y="27" width="4" height="74" rx="1.1" fill="url(#avatarSpineInnerLight)" />
                                  <polygon points="58,64 76,28 90,28 108,42 82,64" fill="url(#avatarFaceTop)" />
                                  <polygon points="60,60 76,30 88,30 76,48" fill="white" opacity="0.10" />
                                  <polygon points="58,65 82,65 108,86 90,100 76,100" fill="url(#avatarFaceBot)" />
                                  <polygon points="60,67 76,67 84,76 68,88" fill="white" opacity="0.08" />
                                  <line x1="58" y1="64.5" x2="82" y2="64.5" stroke="#0F2E5C" stroke-width="1" opacity="0.20" />
                                </g>
                              </svg>
                            </div>
                            <span class="sender-name">Knovana</span>
                          </div>
                          
                          <div class="message-bubble">
                            {#if shouldShowAssistantPlaceholder(msg)}
                              <div class="assistant-placeholder" aria-label="准备中">
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                            {:else}
                              {#each (msg.blocks && msg.blocks.length > 0 ? msg.blocks : [{ type: 'text', text: msg.content || "" }]) as block, bIdx (bIdx)}
                                {#if block.type === 'text'}
                                  {#if block.text}
                                    <div class="markdown-rich-content">
                                      {@html renderMarkdown(block.text)}
                                    </div>
                                  {/if}
                                {:else}
                                  {#if block.type === 'thinking'}
                                    {#if block.text}
                                      <details class="block-thinking" open={generating && messages[messages.length-1].id === msg.id}>
                                        <summary class="thinking-header">
                                          <span class="thinking-title">
                                            <svg class="thinking-brain-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
                                              <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
                                              <path d="M12 5V4a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v1"/>
                                              <path d="M12 5v14"/>
                                              <path d="M12 19v1a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-1"/>
                                              <path d="M18 10a2 2 0 0 0 2-2h0a2 2 0 0 0-2-2"/>
                                              <path d="M6 10a2 2 0 0 1-2-2h0a2 2 0 0 1 2-2"/>
                                            </svg>
                                            <span>思考过程</span>
                                          </span>
                                          <span class="thinking-hint">
                                            <span>{(generating && messages[messages.length-1].id === msg.id) ? '思考中' : '详情'}</span>
                                            <svg class="thinking-chevron-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                              <polyline points="9 18 15 12 9 6"/>
                                            </svg>
                                          </span>
                                        </summary>
                                        <div class="thinking-content">
                                          {block.text}
                                        </div>
                                      </details>
                                    {/if}
                                  {:else if block.type === 'tool_call'}
                                    <div class="block-tool-call">
                                      <div class="tool-call-header">
                                        <svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                                        </svg>
                                        <span>执行工具: <code class="tool-name">{block.name}</code></span>
                                      </div>
                                      {#if block.input && Object.keys(block.input).length > 0}
                                        <pre class="tool-call-input kn-scrollbar"><code>{formatToolValue(block.input)}</code></pre>
                                      {:else if block.partialJson}
                                        <pre class="tool-call-input kn-scrollbar"><code>{formatToolValue(block.partialJson)}</code></pre>
                                      {/if}
                                    </div>
                                  {:else if block.type === 'tool_result'}
                                    <div class="block-tool-result" class:error={block.status === 'error'}>
                                      <div class="tool-result-header">
                                        <span class="result-icon" class:error={block.status === 'error'}>
                                          {#if block.status === 'error'}
                                            <svg class="tool-result-error-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                              <circle cx="12" cy="12" r="10"/>
                                              <path d="m15 9-6 6"/>
                                              <path d="m9 9 6 6"/>
                                            </svg>
                                          {:else}
                                            <svg class="tool-result-success-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                              <circle cx="12" cy="12" r="10"/>
                                              <path d="m9 12 2 2 4-4"/>
                                            </svg>
                                          {/if}
                                        </span>
                                        <span>工具返回结果 <span class="status-pill" class:error={block.status === 'error'}>{block.status}</span></span>
                                      </div>
                                      {#if hasToolResultContent(block.content)}
                                        <pre class="tool-result-output kn-scrollbar"><code>{formatToolValue(block.content)}</code></pre>
                                      {:else}
                                        <div class="tool-result-empty">无返回内容</div>
                                      {/if}
                                    </div>
                                  {:else if block.type === 'widget'}
                                    <div class="block-widget">
                                      <div class="widget-header">
                                        <span class="widget-icon">🧩</span>
                                        <span>组件: {block.widget_type}</span>
                                      </div>
                                      <pre class="widget-data kn-scrollbar"><code>{formatToolValue(block.data)}</code></pre>
                                    </div>
                                  {/if}
                                {/if}
                              {/each}
                            {/if}
                          </div>
                          
                          <!-- Status Tail for Error / Streaming status -->
                          {#if msg.error}
                            <div class="status-tail error">
                              <span class="error-icon">⚠️</span>
                              <span class="error-msg">{msg.error}</span>
                            </div>
                          {:else}
                            {#if msg.role === 'assistant' && generating && messages[messages.length-1].id === msg.id}
                              <div class="status-tail streaming">
                                {#if statusIndicator === 'tool'}
                                  <span class="tool-icon-spinning">⚙️</span>
                                {:else}
                                  <span class="pulse-dot"></span>
                                {/if}
                                <span>{statusText || "正在回复中..."}</span>
                              </div>
                            {/if}
                          {/if}
                          
                          <!-- Action Bar for Copy / Export -->
                          {#if msg.content || (msg.blocks && msg.blocks.length > 0)}
                            <div class="message-actions assistant-actions">
                              <button
                                type="button"
                                class="action-button"
                                title="复制内容"
                                onclick={() => copyMessage(msg.id, msg.content)}
                              >
                                {#if copiedMessageId === msg.id}
                                  <span class="copied-feedback">✓</span>
                                {:else}
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                {/if}
                              </button>
                              <button
                                type="button"
                                class="action-button"
                                title="导出消息"
                                onclick={() => exportMessage(msg.role, msg.content)}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                              </button>
                            </div>
                          {/if}
                        </div>
                      {/if}
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
                  <div class="toolbar-left"></div>
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
    border: 1px solid var(--border-fine);
    box-shadow: 
      0 4px 14px rgba(35, 33, 28, 0.06), 
      0 1px 3px rgba(35, 33, 28, 0.03);
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
    width: 28px;
    height: 28px;
    transition: transform 0.25s ease;
  }

  .floating-chat-trigger:hover {
    transform: translateY(-4px) scale(1.04);
    background: var(--bg-card);
    border-color: var(--text-ink);
    box-shadow: 
      0 6px 18px rgba(35, 33, 28, 0.12), 
      0 2px 6px rgba(35, 33, 28, 0.05);
  }

  .floating-chat-trigger:hover .trigger-ring {
    border-color: var(--text-muted);
  }

  .floating-chat-trigger:hover .trigger-svg {
    transform: rotate(5deg) scale(1.05);
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
    border: 1px solid var(--border-fine);
    border-radius: 12px;
    box-shadow: 
      0 12px 40px rgba(35, 33, 28, 0.08), 
      0 2px 10px rgba(35, 33, 28, 0.04); /* Premium layered shadow */
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

  /* Drag Header (Premium leather/card strip) */
  .widget-header {
    height: 46px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-fine);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
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
    font-size: 13px;
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
    padding: 16px; /* Balanced left and right margins */
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

  .welcome-avatar-container {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
    filter: drop-shadow(0 6px 12px rgba(28, 28, 26, 0.08));
  }

  .welcome-k-svg {
    width: 100%;
    height: 100%;
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
    gap: 10px;
    align-items: flex-start;
  }

  .message-row.user {
    flex-direction: row-reverse;
  }

  .message-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    user-select: none;
  }

  .message-avatar.user {
    background: #fdf6f0;
    border: 1px solid rgba(178, 90, 56, 0.3);
    color: var(--accent-ochre);
  }

  .message-avatar.assistant {
    background: #f4f3ee;
    border: 1px solid var(--border-fine);
    color: var(--text-ink);
  }

  .avatar-user-svg {
    width: 14px;
    height: 14px;
  }

  .avatar-k-svg {
    width: 16px;
    height: 16px;
  }

  .message-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 78%;
  }

  .message-bubble {
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13.5px;
    line-height: 1.55;
  }

  /* Refined Bubble borders and backgrounds */
  .message-row.user .message-bubble {
    background: var(--bg-card);
    color: var(--text-ink);
    border: none;
    border-radius: 14px 14px 2px 14px;
    text-align: left;
    box-shadow: none;
  }

  .message-row.assistant {
    width: 100%;
  }

  .assistant-message-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
  }

  .avatar.assistant {
    display: flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: transparent;
    color: var(--accent-ochre);
  }

  .avatar-k-svg {
    width: 14px;
    height: 14px;
  }

  .sender-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.02em;
  }

  .message-row.assistant .message-bubble {
    background: #ffffff; /* pure white card */
    color: var(--text-ink);
    border: 1px solid var(--border-fine); /* solid border */
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(28, 28, 26, 0.01);
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Tool Call Block Styles */
  .block-tool-call {
    margin: 6px 0;
    border: 1px solid var(--border-fine);
    border-radius: 8px;
    background: color-mix(in srgb, var(--accent-ochre) 3%, var(--bg-paper));
    overflow: hidden;
    width: 100%;
  }

  .tool-call-header {
    padding: 6px 10px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-ink);
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px dashed var(--border-fine);
  }

  .tool-call-header svg {
    flex: 0 0 auto;
    color: var(--accent-ochre);
    width: 13px;
    height: 13px;
  }

  .tool-name {
    font-family: monospace;
    background: var(--bg-card);
    padding: 1px 5px;
    border-radius: 4px;
    color: var(--accent-ochre);
  }

  .tool-call-input {
    display: block;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 8px 10px;
    font-size: 11px;
    background: var(--bg-card);
    max-height: 120px;
    overflow: auto;
    font-family: monospace;
    line-height: 1.6;
    tab-size: 2;
    white-space: pre;
  }

  /* Tool Result Block Styles */
  .block-tool-result {
    margin: 6px 0;
    border: 1px solid var(--border-fine);
    border-radius: 8px;
    background: color-mix(in srgb, var(--accent-ochre) 1.5%, var(--bg-paper));
    overflow: hidden;
    width: 100%;
  }

  .block-tool-result.error {
    border-color: #fca5a5;
    background: #fff5f5;
  }

  .tool-result-header {
    padding: 6px 10px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-ink);
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px dashed var(--border-fine);
  }

  .result-icon {
    display: inline-flex;
    flex: 0 0 auto;
    color: var(--accent-sage);
  }

  .result-icon.error {
    color: #ef4444;
  }

  .result-icon svg {
    width: 14px;
    height: 14px;
  }

  .status-pill {
    font-size: 9.5px;
    padding: 1px 4px;
    border-radius: 4px;
    background: rgba(178, 90, 56, 0.1);
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .status-pill.error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .tool-result-output {
    display: block;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 10px 12px 12px;
    background: var(--bg-card);
    max-height: 250px;
    overflow: auto;
    border-top: 1px dashed var(--border-fine);
    font-family: monospace;
    font-size: 11.5px;
    line-height: 1.65;
    tab-size: 2;
    white-space: pre;
  }

  .tool-result-output code,
  .tool-call-input code,
  .widget-data code {
    white-space: inherit;
  }

  .tool-result-empty {
    padding: 10px 12px;
    border-top: 1px dashed var(--border-fine);
    color: var(--text-muted);
    font-size: 12px;
  }

  /* Widget Block Styles */
  .block-widget {
    margin: 6px 0;
    border: 1px solid var(--border-fine);
    border-radius: 8px;
    background: var(--bg-card);
    overflow: hidden;
    width: 100%;
  }

  .widget-data {
    display: block;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 8px 10px;
    font-size: 11px;
    background: var(--bg-card);
    max-height: 150px;
    overflow: auto;
    font-family: monospace;
    line-height: 1.6;
    tab-size: 2;
    white-space: pre;
  }

  /* Assistant pulsing placeholder style */
  .assistant-placeholder {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    gap: 5px;
    padding: 3px 1px;
  }

  .assistant-placeholder span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-muted);
    animation: placeholderPulse 1.1s ease-in-out infinite;
  }

  .assistant-placeholder span:nth-child(2) {
    animation-delay: 120ms;
  }

  .assistant-placeholder span:nth-child(3) {
    animation-delay: 240ms;
  }

  @keyframes placeholderPulse {
    0%, 80%, 100% {
      opacity: 0.35;
      transform: translateY(0) scale(0.88);
    }
    40% {
      opacity: 0.95;
      transform: translateY(-2px) scale(1);
    }
  }

  /* Scrollbar class utility */
  .kn-scrollbar::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  .kn-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .kn-scrollbar::-webkit-scrollbar-thumb {
    background: var(--bg-card-hover);
    border-radius: 3px;
  }
  .kn-scrollbar::-webkit-scrollbar-thumb:hover {
    background: var(--accent-ochre);
  }

  /* Refined Thinking Details Accordion */

  /* Refined Thinking Details Accordion */
  .block-thinking {
    margin-bottom: 6px;
    border: 1px solid var(--border-fine);
    border-radius: 8px;
    background: var(--bg-card);
    overflow: hidden;
    width: 100%;
  }

  .thinking-header {
    min-height: 32px;
    padding: 6px 10px;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--bg-card);
    transition: background 150ms ease, color 150ms ease;
  }

  .thinking-header:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
  }

  .thinking-header::-webkit-details-marker {
    display: none;
  }

  .thinking-title,
  .thinking-hint {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .thinking-title {
    color: var(--text-ink);
  }

  .thinking-brain-svg {
    width: 13px;
    height: 13px;
    color: var(--accent-ochre);
  }

  .thinking-hint {
    color: var(--text-muted);
    font-size: 10.5px;
    font-weight: 700;
  }

  .thinking-chevron-svg {
    width: 12px;
    height: 12px;
    transition: transform 160ms ease;
  }

  .block-thinking[open] .thinking-chevron-svg {
    transform: rotate(90deg);
  }

  .thinking-content {
    padding: 10px 12px;
    font-size: 12px;
    border-top: 1px solid var(--border-fine);
    color: var(--text-muted);
    background: #ffffff;
    line-height: 1.55;
  }

  /* Markdown custom styles inside Chat message bubble */
  .markdown-rich-content {
    font-family: var(--font-sans);
  }

  .markdown-rich-content :global(h1),
  .markdown-rich-content :global(h2),
  .markdown-rich-content :global(h3) {
    font-family: var(--font-sans);
    font-size: 1.05em;
    font-weight: 700;
    margin-top: 10px;
    margin-bottom: 4px;
  }

  .markdown-rich-content :global(p) {
    margin-bottom: 6px;
  }
  .markdown-rich-content :global(p:last-child) {
    margin-bottom: 0;
  }

  .markdown-rich-content :global(ul),
  .markdown-rich-content :global(ol) {
    margin-bottom: 6px;
    padding-left: 16px;
  }

  .markdown-rich-content :global(li) {
    margin-bottom: 2px;
  }

  .markdown-rich-content :global(code) {
    font-family: monospace;
    background: var(--bg-card);
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.9em;
    border: 1px solid var(--border-fine);
  }

  .markdown-rich-content :global(pre) {
    background: #252422;
    color: #f4f3ef;
    padding: 8px 10px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 6px 0;
  }

  .markdown-rich-content :global(pre code) {
    background: transparent;
    border: none;
    padding: 0;
    font-size: 0.85em;
    color: inherit;
  }

  .markdown-rich-content :global(blockquote) {
    border-left: 2px solid var(--accent-sage);
    padding-left: 8px;
    color: var(--text-muted);
    margin: 6px 0;
    font-style: italic;
  }

  /* Streamlined Composer Card Layout (Extension-style) */
  .composer-container {
    padding: 12px 16px 16px; /* Balanced left and right margins */
    background: transparent;
    flex-shrink: 0;
    z-index: 100;
  }

  .composer-card {
    background: #ffffff;
    border: 1px solid var(--text-ink);
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

  /* Refined Message Action Rails (Extension-style) */
  .message-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    padding-left: 2px;
  }

  .message-row.user .message-actions {
    justify-content: flex-end;
    padding-left: 0;
    padding-right: 2px;
  }

  .action-button {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    padding: 3px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 150ms ease, color 150ms ease;
    outline: none;
  }

  .action-button:hover {
    background: var(--bg-card);
    color: var(--text-ink);
  }

  .action-button :global(svg) {
    width: 12px;
    height: 12px;
  }

  .action-button.regenerate-btn {
    color: var(--accent-sage);
  }

  .action-button.regenerate-btn:hover {
    background: rgba(74, 107, 93, 0.08);
    color: var(--accent-sage);
  }

  .copied-feedback {
    font-size: 11px;
    font-weight: 700;
    color: var(--accent-sage);
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
  }

  /* Status message tail/rail style under assistant bubble */
  .status-tail {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 11px;
    font-weight: 500;
  }

  .status-tail.streaming {
    color: var(--text-muted);
    padding-left: 4px;
  }

  .status-tail.error {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.15);
    border-radius: 6px;
    padding: 6px 10px;
    word-break: break-all;
    width: 100%;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--accent-ochre);
    animation: statusPulse 1.2s infinite ease-in-out;
    flex-shrink: 0;
  }

  @keyframes statusPulse {
    0%, 100% { opacity: 0.4; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.1); }
  }

  .tool-icon-spinning {
    display: inline-block;
    animation: spin 2s linear infinite;
    font-size: 11px;
    flex-shrink: 0;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
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
    padding: 10px 16px;
    border-bottom: 1px solid var(--border-fine);
    background: var(--bg-card);
  }

  .sessions-list-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
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
