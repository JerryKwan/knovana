# 任务列表 (TODO List)

用于跟踪知识库编辑、新建与全局悬浮智能对话助手的实施进度。

- [ ] 后端：修改 `KnowledgeService` 支持新建与附件归档
  - [ ] 在 `KnowledgeService` 构造函数中保存 `userId` 属性
  - [ ] 升级 `updateEntry` 方法，捕获 `ENOENT` 异常以支持新建文档 (PUT-to-create)
  - [ ] 实现附件检测与自动迁移：若检测到全局 `attachments/` 中的临时附件，自动使用 `moveFileUnique` 迁移至笔记专用的 `assets/` 物理目录
  - [ ] 实现正文路径改写：自动全局替换 Markdown 内容中的 `attachments/文件名` 引用路径为 `assets/文件名`
- [ ] 前端：封装 SSE 流式数据请求与 API
  - [ ] 在 `dashboard/src/lib/api.ts` 中移植 `readSseStream` 流式帧解析函数
  - [ ] 导出 `requestStream` 函数，支持在 fetch 时发送 `Authorization` Token 和 JSON Body
- [ ] 前端：实现新建笔记模态框
  - [ ] 在 `dashboard/src/components/Knowledge.svelte` 列表上方添加“+ 新建”按钮
  - [ ] 编写分类目录（inbox / daily / topics）和标题的输入模态框
  - [ ] 实现生成唯一物理路径（基于分类、日期及时间戳）并通过 `PUT` 请求后端创建笔记
- [ ] 前端：实现实时预览 Markdown 编辑器与附件操作
  - [ ] 扩展选中笔记时的版面，支持“编辑/双栏分屏/预览”版式
  - [ ] 实时双向绑定正文内容，利用 `marked` 和 `dompurify` 实现右侧秒级实时渲染预览
  - [ ] 在编辑器下方实现“附件上传区域”，支持文件选择/上传，调用 `POST /api/v1/attachments`
  - [ ] 附件卡片增加“插入”按钮，支持在 Textarea 当前光标位置（`selectionStart/End`）插入 `![描述](attachments/文件名)`
  - [ ] 支持在元数据列表中移除特定附件
- [ ] 前端：开发自包含智能悬浮组件 (Chat Widget) 与独立编译流水线
  - [ ] 创建 `dashboard/vite.widget.config.ts` 以配置 Custom Element 编译属性与 IIFE 输出格式
  - [ ] 创建 `dashboard/src/widget-entry.ts` 作为独立挂件入口
  - [ ] 在 `dashboard/package.json` 中配置 `"build:widget": "vite build --config vite.widget.config.ts"` 构建命令
  - [ ] 创建 `dashboard/src/components/ChatWidget.svelte` 并声明 `<svelte:options customElement="knovana-chat-widget" />`
  - [ ] 封装组件的全部 CSS 样式（包括排版、代码块高亮、气泡以及滚动条等），保证全局隔离与自包含
  - [ ] 对外暴露 `api-url` 和 `token` 属性作为配置属性
  - [ ] 实现 Header 拖动（Movable）与边缘/左下角缩放（Resizable）的鼠标交互
  - [ ] 窗体内设计两态切换：会话列表（Session List）与当前聊天（Active Chat），支持从列表加载历史对话与删除会话
  - [ ] 实现聊天输入与 SSE 流解析渲染，并折叠显示 AI 的推理思考（thinking）过程，支持 Regenerate 重新回答，以及随时发起新对话 (New Session)
- [ ] 前端：全局挂载与联调
  - [ ] 在 `dashboard/src/App.svelte` 底部挂载 `<knovana-chat-widget>` 并传入 API URL 与 Token
  - [ ] 运行 `pnpm check` 验证 Svelte 类型安全
  - [ ] 运行 `pnpm build` 和 `pnpm build:widget` 测试 Vite 打包并确认无误
