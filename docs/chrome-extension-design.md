# Knovana Chrome Extension — 详细设计

---

## 0. 阶段边界

当前实现处于 **阶段一：Side Panel + Popout 双形态主界面**。

阶段一已经覆盖：

- WXT + Svelte + TypeScript 的 Chrome MV3 基础工程。
- Background Service Worker，负责右键菜单、快捷键、Side Panel / Popout 打开、当前页面上下文采集和内部消息路由。
- Side Panel 与 Popout 独立窗口，两种形态复用同一套 `KnovanaApp`，包含对话、知识库、历史、捕获预览和设置面板。
- Options 页面作为 Chrome 标准备用入口，复用侧边栏设置面板。
- `marked` + `DOMPurify` 的 Markdown 渲染，保证 AI 输出和知识库内容先解析再清洗。

当前 Popout 指 **独立扩展窗口**，由 `chrome.windows.create({ type: 'popup', url: 'popout.html' })` 打开；不使用 Chrome `action.default_popup`，避免点击扩展图标后出现会自动关闭的小弹窗，也避免 `chrome.action.onClicked` 失效。

阶段二再增加：

- Content Script。
- 页面内浮动面板。
- Shadow DOM 样式隔离。
- 浮动面板位置和展开状态持久化。
- 更完整的 Svelte stores 与会话管理。

因此，下文凡涉及 Content Script、浮动面板、Shadow DOM 和 stores 的内容，除非明确标注为当前实现，均属于阶段二规划。

---

## 1. 开发框架

### 1.1 WXT + Svelte

| 组件             | 说明                                                        |
| ---------------- | ----------------------------------------------------------- |
| **WXT**          | 基于 Vite 的浏览器扩展开发框架，文件路由，自动生成 manifest |
| **Svelte**       | 编译型 UI 框架，无运行时，编译产物体积小，适合扩展场景      |
| **TypeScript**   | 全项目 TypeScript                                           |
| **Tailwind CSS** | 原子化样式，适合 Side Panel 窄空间                          |

### 1.2 项目结构

阶段一当前结构：

```
chrome-extension/
├── wxt.config.ts                 # WXT + manifest 配置
├── package.json                  # 前端脚本与质量验证命令
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
├── prettier.config.js
├── svelte.config.js
│
├── src/
│   ├── entrypoints/
│   │   ├── background.ts         # Service Worker
│   │   ├── sidepanel/            # Side Panel 薄入口
│   │   ├── popout/               # Popout 独立窗口薄入口
│   │   └── options/              # 设置页面
│   ├── components/
│   │   ├── app/                  # KnovanaApp，共享主界面
│   │   ├── capture/
│   │   ├── chat/
│   │   ├── common/
│   │   ├── knowledge/
│   │   └── settings/
│   ├── services/                 # API、SSE、capture、storage、messaging、theme
│   ├── styles/
│   ├── test/
│   └── types/
│
└── public/icon/
```

阶段二目标结构会在当前结构上增加 `content.ts`、`components/floating/`、`stores/` 和浮动面板相关样式：

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

阶段一当前启用 **Service Worker + Side Panel / Popout / Options**。页面上下文由 Service Worker 在需要时通过 `chrome.scripting.executeScript` 采集，Side Panel 和 Popout 都通过 `chrome.runtime.sendMessage` 与 Service Worker 通信。日常设置在主界面内完成，Options 页面仅作为 Chrome 标准备用入口。

Side Panel 和 Popout 使用同一套 Svelte 主界面组件：

- `src/components/app/KnovanaApp.svelte` 承载对话、知识库、历史、捕获预览、设置、流式输出和形态切换。
- `src/entrypoints/sidepanel/App.svelte` 与 `src/entrypoints/popout/App.svelte` 只是薄包装，分别传入 `surface="sidepanel"` 和 `surface="popout"`。
- 每个主界面实例启动时向 Service Worker 注册 `surfaceId`。流式事件会带上 `targetSurfaceId`，非目标形态必须忽略，避免两个窗口同时打开时重复写入消息。右键菜单和快捷键产生的 pending action 先持久化到 `chrome.storage.local`，再通过 `PENDING_ACTION_AVAILABLE` 通知目标形态或所有已打开形态主动消费，以兼容 MV3 Service Worker 休眠后丢失内存注册表的情况。
- Popout 窗口尺寸和位置持久化到 `chrome.storage.local`；正在进行的 UI 运行态暂存到 `chrome.storage.session`，用于形态切换时恢复消息、捕获状态和 requestId。
- 扩展图标点击时，Service Worker 使用内存中缓存的默认打开形态，不在调用 `chrome.sidePanel.open()` 前异步读取设置；这是为了满足 Chrome 对 `sidePanel.open()` 的用户手势要求。
- 右键菜单捕获动作会在菜单点击处理开始时按“右键动作后自动打开 Knovana”设置调用默认打开形态，避免在页面抽取、媒体上传或预览提交之后再打开时丢失 Chrome 用户手势。
- 从 Popout 停靠回 Side Panel 时，Popout 页面会在点击事件同步链路中直接调用 `chrome.sidePanel.open({ windowId })`。Service Worker 只在新的 Side Panel surface 注册成功后关闭 Popout，避免侧栏打开失败时窗口先消失。

阶段二加入 Content Script 后，Chrome 扩展的三个执行环境彼此隔离，通过消息通信：

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
   │   Service Worker     │         │ Side Panel / Popout      │
   │   (Background)       │◄───────►│ Shared KnovanaApp        │
   │                      │ message │                          │
   │   • 上下文菜单注册    │         │  ┌───────────────────┐  │
   │   • 菜单点击处理      │         │  │ 💬 Chat │ 📚 KB   │  │
   │   • 消息路由          │         │  ├───────────────────┤  │
   │   • API 请求代理      │         │  │                   │  │
   │   • 形态切换/聚焦     │         │  │  [内容区域]        │  │
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
  requestId?: string; // 请求-响应配对
}

type MessageType =
  // Content Script → Service Worker
  | "GET_TAB_INFO" // 获取当前 Tab 信息
  | "CAPTURE_SELECTION" // 捕获选区内容
  | "CAPTURE_IMAGE" // 捕获图片

  // Service Worker → Side Panel / Popout / Content Script
  | "CONTEXT_MENU_ACTION" // 右键菜单动作
  | "QUICK_ACTION" // 快速操作指令

  // Side Panel / Popout → Service Worker
  | "API_REQUEST" // 代理 API 请求
  | "REGISTER_SURFACE" // 注册当前 UI 形态
  | "SWITCH_SURFACE" // 在 Side Panel 和 Popout 间切换
  | "OPEN_FLOATING_PANEL" // 打开浮动面板
  | "CLOSE_FLOATING_PANEL"; // 关闭浮动面板
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
      { id: "summarize", title: "📝 生成摘要", contexts: ["selection"] },
      { id: "generate-doc", title: "📄 生成知识文档", contexts: ["selection"] },
      {
        id: "save-selection",
        title: "💾 保存到知识库",
        contexts: ["selection"],
      },
      // 媒体
      {
        id: "save-media",
        title: "🖼️ 保存媒体文件",
        contexts: ["image", "video", "audio"],
      },
      // 链接
      { id: "save-link", title: "🔗 保存链接", contexts: ["link"] },
      // 页面级
      { id: "save-page", title: "📄 保存当前页面", contexts: ["page"] },
      { id: "open-chat", title: "💬 打开 Knovana", contexts: ["all"] },
    ];

    // 创建父菜单
    chrome.contextMenus.create({
      id: "knovana",
      title: "Knovana",
      contexts: ["all"],
    });

    // 创建子菜单
    menus.forEach((menu) =>
      chrome.contextMenus.create({ ...menu, parentId: "knovana" }),
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
    if (info.menuItemId === "open-chat") {
      // 打开 Side Panel
      await chrome.sidePanel.open({ windowId: tab!.windowId });
    } else {
      // 快速操作 → 通知浮动面板处理
      chrome.tabs.sendMessage(tab!.id!, {
        type: "CONTEXT_MENU_ACTION",
        payload: context,
      });
    }
  });

  // ── 快捷键 ──
  chrome.commands.onCommand.addListener(async (command) => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (command === "toggle-sidepanel") {
      chrome.sidePanel.open({ windowId: tab.windowId });
    } else if (command === "quick-capture") {
      chrome.tabs.sendMessage(tab.id!, {
        type: "QUICK_ACTION",
        payload: { action: "save-selection" },
      });
    }
  });

  // ── 消息路由 ──
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 统一消息处理...
  });
});
```

### 3.2 快捷键配置

| 快捷键         | 功能                     |
| -------------- | ------------------------ |
| `Alt+Q`        | 打开/关闭 Side Panel     |
| `Ctrl+Shift+S` | 快速保存选中内容到知识库 |

---

## 4. Content Script（content.ts，阶段二）

Content Script 属于阶段二。它将承担两个职责：**页面信息提取** 和 **浮动面板渲染**。

### 4.1 页面信息提取

```typescript
// services/capture.ts

export function getSelectionData(): CapturedContent {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    return { type: "none" };
  }

  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();

  // 提取选区中的图片
  const images = Array.from(fragment.querySelectorAll("img")).map((img) => ({
    src: img.src,
    alt: img.alt,
  }));

  return {
    type: "selection",
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
    description: getMeta("description"),
    author: getMeta("author"),
    siteName: getMeta("og:site_name"),
    ogImage: getMeta("og:image"),
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
  matches: ["<all_urls>"],
  runAt: "document_idle",
  cssInjectionMode: "ui",

  async main(ctx) {
    // 创建 Shadow DOM 容器
    const ui = await createShadowRootUi(ctx, {
      name: "knovana-floating",
      position: "overlay",
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
      if (message.type === "CONTEXT_MENU_ACTION") {
        // 展开浮动面板并显示操作
        ui.wrapper.dispatchEvent(
          new CustomEvent("knovana:action", { detail: message.payload }),
        );
      }
    });
  },
});
```

---

## 5. 主界面双形态（Side Panel + Popout，阶段一）

Side Panel 和 Popout 是阶段一的两个主要用户界面形态。二者复用同一个 `KnovanaApp`，当前包含对话、知识库、历史和设置视图，并在对话区上方承载右键/快捷键触发的捕获预览。

两种形态的差异只在外层承载方式：

- **Side Panel**：使用 Chrome `side_panel.default_path = "sidepanel.html"`，适合边浏览边长期停靠。
- **Popout**：使用 `chrome.windows.create({ type: "popup", url: "popout.html" })` 打开独立扩展窗口，适合多任务、拖到副屏或需要更宽空间的场景。
- 顶栏提供图标化形态切换：Side Panel 可弹出为独立窗口，Popout 可停靠回 Side Panel。
- 设置面板提供默认打开方式：扩展图标、快捷键和右键动作自动打开时都遵循该偏好。

### 5.1 布局结构

```
┌─────────────────────────────────┐
│  K  Knovana              ↗  ⚙   │  ← Header
├─────────────────────────────────┤
│ 对话      知识库      历史       │  ← Tab 导航
├─────────────────────────────────┤
│                                 │
│                                 │
│      [根据 Tab 切换的内容]       │  ← 主内容区
│                                 │
│      • ChatView                 │
│      • KnowledgeView            │
│      • HistoryView              │
│                                 │
│                                 │
├─────────────────────────────────┤
│ 建议操作                 [发送] │  ← 输入栏
│ 输入消息...                      │
└─────────────────────────────────┘
```

点击 Header 设置按钮时，主内容区切换为 `SettingsPanel`，不再调用 Chrome 的 `openOptionsPage()` 打开扩展管理页弹窗。

### 5.1.1 形态切换和单活跃面板

每个 `KnovanaApp` 实例生成独立 `surfaceId` 并在 mount 时注册到 Service Worker。Service Worker 保存当前活跃 surface，并按事件类型采用不同投递策略：

- 右键菜单和快捷键产生的 pending action 先写入 `chrome.storage.local`，再发送 `PENDING_ACTION_AVAILABLE`。目标 surface 或已打开 surface 收到通知后调用 `CONSUME_PENDING_ACTION` 消费；Service Worker 通过单次消费保护避免 Side Panel 和 Popout 同时执行同一任务。
- 对话和捕获产生的 `STREAM_EVENT` 带上 `targetSurfaceId`，只投递给当前负责该 requestId 的 surface。

非目标 surface 收到定向消息时直接忽略。收到 pending action 的 surface 会回发 `ACK_PENDING_ACTION`；由于 pending action 本身已经由 `CONSUME_PENDING_ACTION` 移除，该 ACK 主要作为兼容兜底清理。

切换形态时会先保存当前运行态，再打开目标形态。若没有流式请求，旧形态可以被关闭；若仍在流式输出中，后台会优先保持旧形态直到新形态注册并接管 requestId，避免中途丢 chunk。

### 5.2 Chat View

- 对话消息列表，支持 Markdown 渲染
- Markdown 使用 `marked` 解析、`DOMPurify` 清洗，避免直接渲染不可信 HTML
- AI 回复使用 SSE 流式渲染
- 每条 AI 消息下方有操作按钮：复制
- Chat 输入栏支持单个附件上传；附件随当前消息或快捷操作提示词一起发送给后端。上传后 UI 展示原始文件名，后端临时存储尽量保留原始文件名，并以 `-2`、`-3` 等数字后缀处理同名冲突。
- Chat 快捷操作打开后直接展示可编辑的知识条目整理提示词草稿，用户可在同一面板上传附件、修改提示词并发送；该入口不再展示网页来源、附加引导词、批注备注或折叠式预览。
- 当快捷操作用于生成知识条目或原样保存并带有附件时，前端会向后端声明 `knowledge_entry` 意图。该意图与右键菜单捕获共享同一条知识条目保存语义：附件必须作为条目附件归档，最终条目采用 `目录/index.md + assets/` 结构，而不是仅保留在临时 `attachments/` 目录。后端用于摘要整理的附件读取是受限预览：文档附件默认只解析前 3 页，原始文件仍完整保存和归档。
- 右键菜单仍负责网页/选区/媒体捕获，并使用页面内可编辑预览浮层处理来源上下文。“保存媒体文件”和正文图片捕获都由浏览器扩展先下载源媒体并上传到后端附件接口；只有全部媒体下载并上传成功后，才会把正文中的原媒体 URL 替换为后端响应中的真实 `attachments/...` 路径并生成 prompt。由于后端会处理同名冲突并返回带 `-2`、`-3` 等后缀的真实落盘文件名，前端不得自行拼接或猜测附件路径。上传不完整时，捕获流程中止，不发送 chat。
- `extract-page` 页面正文抽取优先走站点适配器，再回退到通用正文抽取。当前已对 `x.com` / `twitter.com` 的 status/article 页面做专用适配：定位当前 URL 对应的主帖或长文 `article[data-testid="tweet"]`，只抽正文和正文图片，不包含评论；图片会从 `tweetPhoto`、`/photo/`、`/media/` 链接、`pbs.twimg.com/media/` 节点以及 X 常用的 `background-image` 兜底图中去重收集，并把 X 的 `name=small` 等尺寸参数规范为 `name=large`。
- 空状态显示上下文感知的建议操作（基于当前页面）

### 5.3 Knowledge View

- 知识条目卡片列表（标题、来源、标签、摘要）
- 支持刷新、详情展开、来源跳转和删除
- “全部存档”列表按 `page=1&per_page=20` 首屏加载，底部通过“加载更多”按钮继续追加下一页，避免一次性拉取完整知识库。
- 顶部搜索框用于知识库问答/检索，输入后进入搜索模式；搜索结果不与“全部存档”的分页列表混用。
- 按标签筛选属于后续增强
- 点击展开详情（Markdown 渲染）
- 编辑属于后续增强

### 5.4 History View

- 历史 Tab 展示聊天会话列表（标题、消息数、最后更新时间）。
- 会话列表按 `page=1&per_page=20` 首屏加载，底部通过“加载更多”按钮继续追加下一页，避免一次性拉取全部历史。
- 最后更新时间使用浏览器本地时区格式化；今天展示本地时间，昨天展示“昨天 + 时间”，更早记录展示本地日期时间。
- 支持选择历史会话恢复到 Chat View、新建会话、刷新列表和删除会话。
- 历史搜索暂未实现。后续如增加，应优先由后端支持对会话标题、消息正文和时间范围进行分页检索，避免仅搜索当前已加载列表造成误导。

### 5.5 Search Behavior

- 搜索输入框（300ms 防抖）
- 搜索结果列表
- 搜索由后端 grep + Claude 完成

### 5.6 Settings View

- `SettingsPanel` 同时服务主界面内设置视图和 Chrome Options 备用页面
- 支持后端 URL、Access Token、主题、默认打开方式和右键动作后自动打开 Knovana
- 支持测试后端连接，保存后立即应用主题并刷新侧栏 Token 状态
- 主界面内设置是主入口，避免 Chrome options 弹窗与日常工作界面割裂

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
  "host_permissions": ["http://localhost:*/*", "https://api.knovana.com/*"],
  "commands": {
    "toggle-sidepanel": {
      "suggested_key": { "default": "Alt+Q" },
      "description": "打开 Knovana 默认形态"
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

阶段一先使用组件局部状态承载主界面当前交互，避免在功能边界还未稳定时过早抽象。为支持 Side Panel 与 Popout 灵活切换，当前已经额外使用两类扩展存储：

- `chrome.storage.local`：保存长期偏好和恢复信息，例如后端地址、访问凭据、主题、默认打开形态、右键动作自动打开开关、当前会话 ID、输入草稿和 Popout 窗口尺寸/位置。
- `chrome.storage.session`：保存短期运行态，例如当前消息列表、流式 requestId、捕获输出和活跃 Tab，用于形态切换时恢复 UI 现场；浏览器会话结束后不作为长期数据源。

阶段二在加入页面内浮动面板、会话历史和更复杂跨页面状态后，再评估是否引入 Svelte 内置的 `writable` / `derived` Store：

当前主界面会把最近活跃的聊天会话 ID 保存到 `chrome.storage.local` 的 `knovana.currentChatSessionId`。用户关闭并重新打开扩展时，Chat 页会读取该会话 ID，并通过后端 `GET /api/v1/chat/sessions/{id}` 恢复当前会话消息；长期历史仍以后端会话存储为准。用户点击“新对话”或删除当前会话时会清理该本地指针和临时运行态。

```typescript
// stores/chat.ts
import { writable, derived } from "svelte/store";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
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

export const messageCount = derived(
  currentSession,
  ($session) => $session?.messages.length ?? 0,
);
```

```typescript
// stores/capture.ts

interface CapturedContent {
  type: "none" | "selection" | "image" | "link" | "page";
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

export const capturedContent = writable<CapturedContent>({ type: "none" });
export const currentPageInfo = writable<PageMetadata | null>(null);
```

---

## 8. API 通信

阶段一当前由 Side Panel / Popout 通过 Service Worker 代理对话、捕获、知识库和搜索请求；`SettingsPanel` 直接测试后端连接。阶段二引入页面内浮动面板后，应统一 API 客户端、错误格式、超时/取消和认证头处理。

目标 API 通信方式：

```typescript
// services/api.ts

class KnovanaAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const settings = await getSettings();
    const response = await fetch(`${settings.backendUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.token}`,
        ...options.headers,
      },
    });
    if (!response.ok) throw new APIError(response);
    return response.json();
  }

  /** 流式对话 */
  static async *chat(
    message: string,
    sessionId?: string,
  ): AsyncGenerator<string> {
    const settings = await getSettings();
    const response = await fetch(`${settings.backendUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.token}`,
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
      for (const line of text.split("\n")) {
        if (line.startsWith("data: ")) {
          yield line.slice(6);
        }
      }
    }
  }

  /** 保存到知识库 */
  static capture(content: CapturedContent) {
    return this.request("/api/capture", {
      method: "POST",
      body: JSON.stringify(content),
    });
  }

  /** 搜索知识库 */
  static search(query: string) {
    return this.request<KnowledgeEntry[]>(
      `/api/search?q=${encodeURIComponent(query)}`,
    );
  }

  /** 知识库 CRUD */
  static getEntries(page = 1, tags?: string[]) {
    const params = new URLSearchParams({ page: String(page) });
    if (tags?.length) params.set("tags", tags.join(","));
    return this.request<KnowledgeEntry[]>(`/api/knowledge?${params}`);
  }
}
```

---

## 9. UX 设计规范

### 9.1 设计参考

| 产品                   | 借鉴                                                             |
| ---------------------- | ---------------------------------------------------------------- |
| **Gemini**             | 上下文感知建议操作；持久化侧边栏；白底中心符号的工具栏图标可读性 |
| **Claude**             | 流式 Markdown 渲染质量；消息操作按钮                             |
| **ChatGPT**            | 会话管理 UI；快速操作按钮                                        |
| **Notion Web Clipper** | 一键保存 + 标签选择                                              |

### 9.2 配色与设计系统

Knovana 已全面升级为**学术水墨暖纸风格**，详细规范请参阅独立的 [UI 设计系统与风格指南](file:///c:/Home/MyProjects/Knovana/docs/ui-style-guide.md)。

核心浅色模式变量简述：

```css
:root {
  --kn-bg: #faf8f4; /* 温暖乳白纸张底色 */
  --kn-bg-raised: #fdfcf9; /* 卡片背景 */
  --kn-text: #2c2825; /* 水墨深褐炭黑文字 */
  --kn-border: #ddd8d0; /* 模拟切边线 */
  --kn-primary: #3c342f; /* 水墨深褐主色 */
  --kn-primary-soft: #f0e9df; /* 纸质软灰 */
  --kn-accent: #a08470; /* 陶土色 */
}
```

图标采用透明背景 + 晶体折面 K 的视觉语言，保留 `public/icon/source.svg` 作为源文件，并输出 Chrome 所需的 `16/32/48/96/128.png` 尺寸组。

### 9.3 交互原则

- **SSE 流式渲染**：所有 AI 操作流式输出，首 token ≤ 300ms 感知。
- **骨架屏**：加载状态使用骨架屏而非转圈。
- **上下文感知**：侧边栏自动识别当前页面并提供相关操作建议。
- **极简化消息动作**：会话消息下方的操作按钮（如复制、重新生成）完全图标化，尺寸收窄为 `24x24px`，仅在鼠标悬停时浮现功能 Tooltip 提示，保持版面规整简洁。
- **物理滑动反馈**：设置面板中的开关采用 iOS 胶囊样式的纯 CSS 滑块（Switch Toggle），替换原生 Checkbox，提供优秀的物理滑动动效。
