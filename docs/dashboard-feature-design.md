# 知识库编辑（含附件管理）、新建与智能悬浮组件设计方案

根据最新的讨论与反馈，本方案进行了针对性的设计升级：
1. **打包与编译设计**：支持通过 Vite 将智能悬浮助手编译为**独立的单个 JS 文件**，便于第三方系统导入。我们将采用行业最佳实践（双重 Vite 配置与 IIFE 格式）。
2. **Chat Widget 功能完备性**：支持历史会话加载、流式对话、推理展示，以及在挂件内发起新会话。
3. **编辑状态下的附件管理**：支持上传、一键插入 Markdown 源码至当前光标位置、在元数据列表中删除附件关联，并在后端保存时自动迁移临时附件到笔记本地目录。

---

## 1. 目标与非目标

### 目标
- **编译级智能悬浮助手 (Shadow DOM Web Component)**：
  - 设计为完全自包含的 Svelte 组件，未来可通过 `pnpm build:widget` 编译为单个 `.js` 文件。
  - **样式完全隔离**：所有视觉样式全部封装在组件的 `<style>` 标签中，通过浏览器原生 Shadow DOM 隔离，防止干扰第三方宿主页面。
  - **属性可配置 (Props as Attributes)**：对外暴露 `api-url`、`token` 等配置项属性，方便导入时直接设置。
  - **交互体验**：拖拽移动 (Movable)、边缘缩放 (Resizable)、单栏导航切换。
  - **会话与历史管理**：支持发起新会话 (`POST /api/v1/chat/sessions`)，在单栏菜单中切换历史会话 (`GET /api/v1/chat/sessions`)，并以时间倒序和消息数清晰排列。
- **带附件操作的实时 Markdown 编辑器**：
  - **新增上传**：编辑器中提供附件拖拽/上传区域，文件通过 `POST /api/v1/attachments` 异步上传至用户临时目录，获得 `attachments/[filename]` 路径。
  - **一键插入**：用户可以点击附件列表中的“插入”，自动在编辑器当前光标位置生成 Markdown 引用链接（如 `![文件名](attachments/文件名)`）。
  - **删除关联**：支持在附件列表中移除附件关联。
  - **保存时自动归档迁移 (Backend Asset Migration)**：更新后端 `KnowledgeService.updateEntry`，支持将新增的临时附件从用户全局 `attachments/` 自动搬移至笔记对应的 `assets/` 物理目录，并改写正文中的 Markdown 引用路径。
- **新建笔记功能**：在笔记列表顶部提供“+ 新建”按钮，弹窗选择分类并生成唯一路径，通过 `PUT` 新建并直接打开编辑器。

---

## 2. 影响范围

### 前端 (Dashboard)
- **[NEW]** `dashboard/src/components/ChatWidget.svelte`：自包含的 Web Component 悬浮助手组件。
- **[NEW]** `dashboard/vite.widget.config.ts`：独立用于打包编译 Standalone Widget 的 Vite 配置文件。
- **[NEW]** `dashboard/src/widget-entry.ts`：独立 JS 打包的入口文件。
- **[MODIFY]** `dashboard/src/lib/api.ts`：导出 `readSseStream` 流式请求辅助方法。
- **[MODIFY]** `dashboard/src/components/Knowledge.svelte`：引入分屏编辑器、新建笔记模态框、附件上传管理区（含插入/删除交互）。
- **[MODIFY]** `dashboard/src/App.svelte`：在底部全局挂载挂件。
- **[MODIFY]** `dashboard/package.json`：新增 `build:widget` 构建指令。
- **[MODIFY]** `dashboard/src/app.css`：优化编辑器排版。

### 后端 (Backend)
- **[MODIFY]** `backend/src/services/knowledge-service.ts`：
  - 构造函数存储 `userId` 属性。
  - 升级 `updateEntry` 方法：1) 捕获读取异常以支持 `PUT` 新建文件；2) 自动将新附件从全局 `attachments/` 移入笔记本地 `assets/`，并执行 Markdown 路径自动替换。

---

## 3. 核心设计细节

### A. 悬浮组件独立发布编译方案 (Vite 最佳实践)
1. **多目标构建架构**：
   - 默认的 `vite.config.ts` 仍然按常规方式打包 Dashboard 单页应用，`ChatWidget.svelte` 被编译为标准的 Svelte 组件引入（Vite 忽略 `<svelte:options customElement="..." />`）。
   - 新增 `vite.widget.config.ts`，开启编译器的 `customElement: true` 参数。在该模式下，Svelte 将组件转换为标准的 Web Component，并自动把 styles 渲染进 Shadow Root。
2. **Vite 挂件配置文件 (`vite.widget.config.ts`)**：
   ```typescript
   import { defineConfig } from 'vite';
   import { svelte } from '@sveltejs/vite-plugin-svelte';
   import { resolve } from 'path';

   export default defineConfig({
     plugins: [
       svelte({
         compilerOptions: { customElement: true }
       })
     ],
     build: {
       lib: {
         entry: resolve(__dirname, 'src/widget-entry.ts'),
         name: 'KnovanaChatWidget',
         fileName: 'knovana-chat-widget',
         formats: ['iife'] // IIFE 格式最适合在第三方网站直接以 <script> 引入
       },
       outDir: '../backend/public/widget',
       emptyOutDir: true
     }
   });
   ```
3. **入口文件 `src/widget-entry.ts`**：
   ```typescript
   import ChatWidget from './components/ChatWidget.svelte';
   // 挂载和注册由 Svelte 自行处理：
   // Svelte 在 customElement 编译选项下，引入 ChatWidget.svelte 时会读取 options 中的标签名自动执行 customElements.define()。
   ```

### B. Chat Widget 功能与交互
- **历史记录拉取**：挂件启动或切换至列表视图时，请求 `GET /api/v1/chat/sessions`。
- **发起新对话**：列表顶部提供“+ 新对话”按钮，点击调用 `POST /api/v1/chat/sessions` 并清空对话视窗。
- **样式隔离**：将对话界面所有的 CSS 定义直接编写于 `ChatWidget.svelte` 的 `<style>` 标签中。包括了自定义 Markdown 段落、预排版代码块 `pre code`、推理状态 `details` 标签、圆角输入框等，确保脱离 `app.css` 后在任何外部网页仍能以相同的精致古典风格渲染。

### C. 编辑状态下的附件管理与迁移
1. **前端交互**：
   - 上传完的附件在列表中渲染。
   - 点击“插入正文”按钮：
     ```typescript
     const textarea = document.getElementById("note-editor-textarea") as HTMLTextAreaElement;
     const start = textarea.selectionStart;
     const end = textarea.selectionEnd;
     const text = textarea.value;
     const insertText = isImage(att.name) ? `![${att.name}](attachments/${att.name})` : `[${att.name}](attachments/${att.name})`;
     textarea.value = text.substring(0, start) + insertText + text.substring(end);
     // 更新内容状态
     content = textarea.value;
     ```
2. **后端归档逻辑**：
   - 客户端发送的 `PUT` Body 包含最新整理的 `attachments` 列表。
   - 后端 `updateEntry` 检查其中存在于全局 `attachments/` 的文件，调用 `moveFileUnique` 移至笔记专属 `assets/` 下。
   - 匹配 Markdown 正文中的所有 `attachments/文件名` 引用（包括 URL 编码的引用），将其全局改写为 `assets/文件名` 并保存，保证预览正常且不产生路径死链。
