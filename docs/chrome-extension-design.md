# Knovana Chrome Extension — 详细设计

---

## 1. 开发框架

### 1.1 WXT + Svelte

| 组件 | 说明 |
|------|------|
| **WXT** | 基于 Vite 的浏览器扩展开发框架，文件路由，自动生成 manifest |
| **Svelte** | 编译型 UI 框架，无运行时，编译产物体积小，适合扩展场景 |
| **TypeScript** | 全项目 TypeScript |
| **Tailwind CSS** | 原子化样式，适合 Side Panel 窄空间 |

### 1.2 项目结构

```
chrome-extension/
├── wxt.config.ts                 # WXT 配置
├── package.json
├── tsconfig.json
├── tailwind.config.ts
│
├── entrypoints/                  # WXT 文件路由入口
│   ├── background.ts             # Service Worker
│   ├── content.ts                # Content Script（浮动面板 + 页面提取）
│   ├── sidepanel/                # Side Panel
│   │   ├── index.html
│   │   └── App.svelte
│   └── options/                  # 设置页面
│       ├── index.html
│       └── App.svelte
│
├── components/                   # Svelte 组件
│   ├── floating/                 # 浮动面板组件
│   │   ├── FloatingBubble.svelte     # 气泡图标
│   │   ├── FloatingPanel.svelte      # 展开面板
│   │   └── QuickActions.svelte       # 快速操作按钮组
│   ├── chat/                     # 对话组件
│   │   ├── ChatView.svelte
│   │   ├── MessageBubble.svelte
│   │   ├── InputBar.svelte
│   │   └── StreamingText.svelte
│   ├── knowledge/                # 知识库组件
│   │   ├── KnowledgeList.svelte
│   │   ├── KnowledgeCard.svelte
│   │   ├── KnowledgeDetail.svelte
│   │   └── SearchBar.svelte
│   ├── capture/                  # 捕获预览组件
│   │   ├── CapturePreview.svelte
│   │   └── SourceInfo.svelte
│   └── common/                   # 通用组件
│       ├── Button.svelte
│       ├── Modal.svelte
│       ├── Toast.svelte
│       └── Loading.svelte
│
├── stores/                       # Svelte Store
│   ├── chat.ts                   # 对话状态
│   ├── knowledge.ts              # 知识库状态
│   ├── capture.ts                # 捕获状态
│   ├── settings.ts               # 设置
│   └── ui.ts                     # UI 状态（面板模式、Tab 等）
│
├── services/                     # 服务层
│   ├── api.ts                    # 后端 API 客户端
│   ├── messaging.ts              # 扩展内部消息通信
│   ├── contextMenu.ts            # 上下文菜单
│   ├── capture.ts                # 页面内容捕获
│   └── storage.ts                # chrome.storage 封装
│
├── types/                        # TypeScript 类型
│   ├── message.ts
│   ├── knowledge.ts
│   └── api.ts
│
├── styles/                       # 样式
│   ├── globals.css
│   └── floating.css              # 浮动面板样式（需 Shadow DOM 隔离）
│
└── assets/                       # 静态资源
    └── icons/
        ├── icon-16.png
        ├── icon-32.png
        ├── icon-48.png
        └── icon-128.png
```

---

## 2. 三层架构与通信

Chrome 扩展的三个执行环境彼此隔离，通过消息通信：

```
┌─────────────────────────────────────────────────────────────┐
│ Web Page                                                     │
│  ┌────────────────────────────────────┐                      │
│  │ Content Script                      │                      │
│  │                                    │                      │
│  │  ┌──────────────┐  ┌────────────┐ │                      │
│  │  │ 页面信息提取   │  │ 浮动面板    │ │                      │
│  │  │ • 选区文本     │  │ (Shadow DOM)│ │                      │
│  │  │ • 图片 URL     │  📝 生成摘要    │ │                      │
│  │  │ • 页面元数据   │  📄 生成知识文档 │ │                      │
│  │  └──────────────┘  💾 保存到知识库 │ │                      │
│  └──────────┬──────── 💬 对话...     ─┘                      │
│             │ chrome.runtime.sendMessage                      │
└─────────────┼────────────────────────────────────────────────┘
              │
   ┌──────────▼──────────┐         ┌─────────────────────────┐
   │   Service Worker     │         │     Side Panel           │
   │   (Background)       │◄───────►│     (Svelte App)         │
   │                      │ message │                          │
   │   • 上下文菜单注册    │         │  ┌───────────────────┐  │
   │   • 菜单点击处理      │         │  │ 💬 Chat │ 📚 KB   │  │
   │   • 消息路由          │         │  ├───────────────────┤  │
   │   • API 请求代理      │         │  │                   │  │
   │   • 快捷键处理        │         │  │  [内容区域]        │  │
   │                      │         │  │                   │  │
   └──────────────────────┘         │  ├───────────────────┤  │
                                    │  │  [输入栏]          │  │
                                    │  └───────────────────┘  │
                                    └─────────────────────────┘
```

### 消息协议

所有扩展内部消息使用统一格式：

```typescript
// types/message.ts

interface ExtensionMessage {
  type: MessageType;
  payload?: any;
  requestId?: string;  // 请求-响应配对
}

type MessageType =
  // Content Script → Service Worker
  | 'GET_TAB_INFO'           // 获取当前 Tab 信息
  | 'CAPTURE_SELECTION'      // 捕获选区内容
  | 'CAPTURE_IMAGE'          // 捕获图片

  // Service Worker → Side Panel / Content Script
  | 'CONTEXT_MENU_ACTION'    // 右键菜单动作
  | 'QUICK_ACTION'           // 快速操作指令

  // Side Panel → Service Worker
  | 'API_REQUEST'            // 代理 API 请求
  | 'OPEN_FLOATING_PANEL'    // 打开浮动面板
  | 'CLOSE_FLOATING_PANEL';  // 关闭浮动面板
```

---

## 3. Service Worker（background.ts）

Service Worker 是扩展的消息中枢。

### 3.1 上下文菜单

```typescript
// entrypoints/background.ts

export default defineBackground(() => {

  // ── 菜单注册 ──
  chrome.runtime.onInstalled.addListener(() => {
    const menus = [
      // 选中文本
      { id: 'summarize',       title: '📝 生成摘要',         contexts: ['selection'] },
      { id: 'generate-doc',    title: '📄 生成知识文档',     contexts: ['selection'] },
      { id: 'save-selection',   title: '💾 保存到知识库',     contexts: ['selection'] },
      // 图片
      { id: 'save-image',      title: '🖼️ 保存图片到知识库', contexts: ['image'] },
      // 链接
      { id: 'save-link',       title: '🔗 保存链接',        contexts: ['link'] },
      // 页面级
      { id: 'save-page',       title: '📄 保存当前页面',     contexts: ['page'] },
      { id: 'open-chat',       title: '💬 打开 Knovana',    contexts: ['all'] },
    ];

    // 创建父菜单
    chrome.contextMenus.create({ id: 'knovana', title: 'Knovana', contexts: ['all'] });

    // 创建子菜单
    menus.forEach(menu =>
      chrome.contextMenus.create({ ...menu, parentId: 'knovana' })
    );
  });

  // ── 菜单点击 ──
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const context = {
      action: info.menuItemId,
      selectionText: info.selectionText,
      srcUrl: info.srcUrl,
      linkUrl: info.linkUrl,
      pageUrl: tab?.url,
      pageTitle: tab?.title,
    };

    // 根据操作类型决定打开方式
    if (info.menuItemId === 'open-chat') {
      // 打开 Side Panel
      await chrome.sidePanel.open({ windowId: tab!.windowId });
    } else {
      // 快速操作 → 通知浮动面板处理
      chrome.tabs.sendMessage(tab!.id!, {
        type: 'CONTEXT_MENU_ACTION',
        payload: context,
      });
    }
  });

  // ── 快捷键 ──
  chrome.commands.onCommand.addListener(async (command) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (command === 'toggle-sidepanel') {
      chrome.sidePanel.open({ windowId: tab.windowId });
    } else if (command === 'quick-capture') {
      chrome.tabs.sendMessage(tab.id!, { type: 'QUICK_ACTION', payload: { action: 'save-selection' } });
    }
  });

  // ── 消息路由 ──
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 统一消息处理...
  });
});
```

### 3.2 快捷键配置

| 快捷键 | 功能 |
|--------|------|
| `Alt+Q` | 打开/关闭 Side Panel |
| `Ctrl+Shift+S` | 快速保存选中内容到知识库 |

---

## 4. Content Script（content.ts）

Content Script 承担两个职责：**页面信息提取** 和 **浮动面板渲染**。

### 4.1 页面信息提取

```typescript
// services/capture.ts

export function getSelectionData(): CapturedContent {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    return { type: 'none' };
  }

  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();

  // 提取选区中的图片
  const images = Array.from(fragment.querySelectorAll('img'))
    .map(img => ({ src: img.src, alt: img.alt }));

  return {
    type: 'selection',
    text: selection.toString(),
    html: fragmentToHTML(fragment),
    images,
    context: {
      pageUrl: window.location.href,
      pageTitle: document.title,
      favicon: getFavicon(),
    },
  };
}

export function getPageMetadata(): PageMetadata {
  return {
    url: window.location.href,
    title: document.title,
    description: getMeta('description'),
    author: getMeta('author'),
    siteName: getMeta('og:site_name'),
    ogImage: getMeta('og:image'),
    favicon: getFavicon(),
    language: document.documentElement.lang,
  };
}
```

### 4.2 浮动面板

浮动面板通过 Content Script 注入到页面中，使用 **Shadow DOM** 隔离样式。

```
默认状态:               点击展开:
┌────┐                  ┌────────────────────┐
│ 🧠 │                  │ 🧠 Knovana    ─  × │
└────┘                  ├────────────────────┤
  ↑                     │ 📝 生成摘要         │
  右下角                 │ 📄 生成知识文档     │
  可拖动                 │ 💾 保存到知识库     │
  气泡图标               │ 💬 对话...          │
                        │                    │
                        │  ─────────────     │
                        │  [捕获内容预览]      │
                        │                    │
                        │  📌 展开完整面板     │
                        └────────────────────┘
                            ↑ 可拖动到任意位置
```

**关键实现要点**：

- 使用 `Shadow DOM` 封装，避免页面样式冲突
- 面板位置使用 `position: fixed`，`z-index` 设为极高值
- 支持鼠标拖拽移动（`mousedown` → `mousemove` → `mouseup`）
- 气泡状态记忆到 `chrome.storage.local`（位置、展开/折叠）
- 面板内 API 请求通过 `chrome.runtime.sendMessage` 代理到 Service Worker

```typescript
// entrypoints/content.ts

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',

  async main(ctx) {
    // 创建 Shadow DOM 容器
    const ui = await createShadowRootUi(ctx, {
      name: 'knovana-floating',
      position: 'overlay',
      onMount: (container) => {
        // 挂载 Svelte 浮动面板组件
        const app = new FloatingPanel({
          target: container,
        });
        return app;
      },
      onRemove: (app) => {
        app?.$destroy();
      },
    });

    ui.mount();

    // 监听 Service Worker 消息
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'CONTEXT_MENU_ACTION') {
        // 展开浮动面板并显示操作
        ui.wrapper.dispatchEvent(
          new CustomEvent('knovana:action', { detail: message.payload })
        );
      }
    });
  },
});
```

---

## 5. Side Panel（侧边栏 — 完整交互）

Side Panel 是完整的 Svelte 应用，包含三个主要视图。

### 5.1 布局结构

```
┌─────────────────────────────────┐
│ 🧠 Knovana              ⚙️  ×  │  ← Header
├─────────────────────────────────┤
│ 💬 对话  │  📚 知识库  │  🔍 搜索│  ← Tab 导航
├─────────────────────────────────┤
│                                 │
│                                 │
│      [根据 Tab 切换的内容]       │  ← 主内容区
│                                 │
│      • ChatView                 │
│      • KnowledgeView            │
│      • SearchView               │
│                                 │
│                                 │
├─────────────────────────────────┤
│ 📍 当前: example.com/article    │  ← 上下文信息栏
├─────────────────────────────────┤
│ 📎  💡 建议          [ 发送 ➤ ] │  ← 输入栏
│ 输入消息...                      │
└─────────────────────────────────┘
```

### 5.2 Chat View

- 对话消息列表，支持 Markdown 渲染
- AI 回复使用 SSE 流式渲染
- 每条 AI 消息下方有操作按钮：复制、保存到知识库、重新生成
- 空状态显示上下文感知的建议操作（基于当前页面）
- 会话历史列表（侧边抽屉或下拉）

### 5.3 Knowledge View

- 知识条目卡片列表（标题、来源、标签、摘要）
- 支持按标签筛选
- 点击展开详情（Markdown 渲染）
- 支持编辑、删除

### 5.4 Search View

- 搜索输入框（300ms 防抖）
- 搜索结果列表
- 搜索由后端 grep + Claude 完成

---

## 6. 权限清单

```json
{
  "manifest_version": 3,
  "permissions": [
    "sidePanel",
    "contextMenus",
    "activeTab",
    "scripting",
    "storage",
    "tabs"
  ],
  "host_permissions": [
    "http://localhost:*/*",
    "https://api.knovana.com/*"
  ],
  "commands": {
    "toggle-sidepanel": {
      "suggested_key": { "default": "Alt+Q" },
      "description": "打开/关闭 Knovana 侧边栏"
    },
    "quick-capture": {
      "suggested_key": { "default": "Ctrl+Shift+S" },
      "description": "快速保存选中内容"
    }
  }
}
```

---

## 7. 状态管理

使用 Svelte 内置的 `writable` / `derived` Store：

```typescript
// stores/chat.ts
import { writable, derived } from 'svelte/store';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  sources?: { title: string; path: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  context?: { pageUrl?: string; pageTitle?: string };
  createdAt: number;
}

export const currentSession = writable<ChatSession | null>(null);
export const sessions = writable<ChatSession[]>([]);
export const isStreaming = writable(false);

export const messageCount = derived(currentSession, ($session) =>
  $session?.messages.length ?? 0
);
```

```typescript
// stores/capture.ts

interface CapturedContent {
  type: 'none' | 'selection' | 'image' | 'link' | 'page';
  text?: string;
  html?: string;
  images?: { src: string; alt: string }[];
  linkUrl?: string;
  context?: {
    pageUrl: string;
    pageTitle: string;
    favicon?: string;
  };
}

export const capturedContent = writable<CapturedContent>({ type: 'none' });
export const currentPageInfo = writable<PageMetadata | null>(null);
```

---

## 8. API 通信

Side Panel / 浮动面板不直接请求后端，而是通过 Service Worker 代理：

```typescript
// services/api.ts

class KnovanaAPI {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const settings = await getSettings();
    const response = await fetch(`${settings.backendUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.token}`,
        ...options.headers,
      },
    });
    if (!response.ok) throw new APIError(response);
    return response.json();
  }

  /** 流式对话 */
  static async *chat(message: string, sessionId?: string): AsyncGenerator<string> {
    const settings = await getSettings();
    const response = await fetch(`${settings.backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.token}`,
      },
      body: JSON.stringify({ message, session_id: sessionId }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      // 解析 SSE 格式
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
          yield line.slice(6);
        }
      }
    }
  }

  /** 保存到知识库 */
  static capture(content: CapturedContent) {
    return this.request('/api/capture', {
      method: 'POST',
      body: JSON.stringify(content),
    });
  }

  /** 搜索知识库 */
  static search(query: string) {
    return this.request<KnowledgeEntry[]>(`/api/search?q=${encodeURIComponent(query)}`);
  }

  /** 知识库 CRUD */
  static getEntries(page = 1, tags?: string[]) {
    const params = new URLSearchParams({ page: String(page) });
    if (tags?.length) params.set('tags', tags.join(','));
    return this.request<KnowledgeEntry[]>(`/api/knowledge?${params}`);
  }
}
```

---

## 9. UX 设计规范

### 9.1 设计参考

| 产品 | 借鉴 |
|------|------|
| **Gemini** | 上下文感知建议操作；持久化侧边栏 |
| **Claude** | 流式 Markdown 渲染质量；消息操作按钮 |
| **ChatGPT** | 会话管理 UI；快速操作按钮 |
| **Notion Web Clipper** | 一键保存 + 标签选择 |

### 9.2 配色

```css
:root {
  /* 主色 — 知性深蓝紫 */
  --primary: #6366F1;
  --primary-hover: #4F46E5;
  --primary-light: #EEF2FF;

  /* 暗色模式（默认跟随系统） */
  --bg-primary: #0F0F1A;
  --bg-secondary: #1A1A2E;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --border: #334155;
}
```

### 9.3 交互原则

- **SSE 流式渲染**：所有 AI 操作流式输出，首 token ≤ 300ms 感知
- **骨架屏**：加载状态使用骨架屏而非转圈
- **上下文感知**：侧边栏自动识别当前页面并提供相关操作建议
- **操作反馈**：保存成功 → Toast 提示 + 标签建议
