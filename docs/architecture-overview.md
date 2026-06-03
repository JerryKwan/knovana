# Knovana — 系统架构设计

> **Knovana**: "Kno-" 取自 Knowledge，"vana" 联想 Nirvana，寓意知识管理带来的升华体验。

---

## 1. 项目愿景

Knovana 是一个 **个人知识管理平台**。以后端服务为核心，通过多种客户端产品形态（浏览器扩展、Web 应用、CLI 等），帮助用户便捷地采集、整理、存储和检索知识。

### 核心能力

| 能力 | 说明 |
|------|------|
| **知识采集** | 从多种来源（网页、剪贴板、API、文件上传）捕获信息 |
| **AI 摘要** | Claude Agent 从原始内容中提炼要点，生成结构化摘要 |
| **文档生成** | 将采集的内容整理为 Obsidian 格式的 Markdown 文档（含 frontmatter、标签、附件引用） |
| **知识检索** | grep + LLM 跳读，自然语言语义搜索 |
| **对话交互** | 基于知识库上下文的 AI 对话 |
| **知识存储** | 以 Obsidian 格式 Markdown + 附件存储，开放、可移植、可版本控制 |

### 产品形态

```
                    ┌─────────────────────────────────────────────┐
                    │          Knovana Platform (Backend)          │
                    │                                             │
                    │  FastAPI + Claude Agent SDK + MCP Tools     │
                    │  SQLite + Obsidian Markdown 文件系统          │
                    │                                             │
                    └──────────┬──────────┬──────────┬────────────┘
                               │          │          │
                    ┌──────────▼──┐ ┌─────▼──────┐ ┌▼───────────┐
                    │ Chrome 扩展  │ │ Web 前端    │ │  其他客户端  │
                    │             │ │ (未来)      │ │  CLI/API   │
                    │ • 信息采集   │ │             │ │  (未来)     │
                    │ • 快速操作   │ │ • 知识库管理 │ │            │
                    │ • 对话      │ │ • 全文编辑   │ │ • 批量导入  │
                    │ • 快捷搜索   │ │ • 可视化    │ │ • 自动化    │
                    └─────────────┘ │ • 标签管理   │ └────────────┘
                                    │ • 统计分析   │
                                    └─────────────┘
```

**Chrome 扩展** 是第一个客户端，专注于浏览器场景下的信息采集和快速交互。
**Web 前端** 是后续的完整知识库管理界面。
后端 API 设计为 **客户端无关**，所有产品形态共享同一套 API。

---

## 2. 系统架构

```
                         ┌─ Chrome Extension (WXT + Svelte)
                         │
   Clients ──────────────┼─ Web Frontend (未来)
                         │
                         └─ CLI / 其他 (未来)
                         │
                  ───── HTTPS / REST ─────
                         │
              ┌──────────▼──────────────────────────────┐
              │              Knovana Platform             │
              │                                          │
              │  ┌────────────────────────────────────┐  │
              │  │         API Layer (FastAPI)         │  │
              │  │                                    │  │
              │  │  路由 · 认证 · 参数校验 · SSE 流式   │  │
              │  │  客户端无关，RESTful 设计             │  │
              │  └──────────────┬─────────────────────┘  │
              │                 │                         │
              │  ┌──────────────▼─────────────────────┐  │
              │  │       Service Layer (业务层)         │  │
              │  │                                    │  │
              │  │  ChatService · CaptureService       │  │
              │  │  KnowledgeService · SearchService    │  │
              │  │  UserService · TagService            │  │
              │  │                                    │  │
              │  │  (纯 Python 业务逻辑，可独立测试)     │  │
              │  └──────────────┬─────────────────────┘  │
              │                 │                         │
              │  ┌──────────────▼─────────────────────┐  │
              │  │       Agent Layer (智能层)           │  │
              │  │                                    │  │
              │  │  Claude Agent SDK + MCP Tools       │  │
              │  │  Service 层按需调用 Agent 处理       │  │
              │  │  非所有操作都需要 Agent              │  │
              │  └──────────────┬─────────────────────┘  │
              │                 │                         │
              │  ┌──────────────▼─────────────────────┐  │
              │  │       Storage Layer (存储层)         │  │
              │  │                                    │  │
              │  │  SQLite (用户/会话/配置)             │  │
              │  │  File System (Markdown + 附件)      │  │
              │  └────────────────────────────────────┘  │
              └──────────────────────────────────────────┘
```

### 分层职责

| 层 | 职责 | 原则 |
|----|------|------|
| **API Layer** | HTTP 路由、认证鉴权、请求校验、响应格式化 | 薄壳，不含业务逻辑 |
| **Service Layer** | 业务逻辑编排、数据组装、权限校验 | 纯 Python，可独立单元测试，不依赖 HTTP |
| **Agent Layer** | AI 能力（摘要生成、文档生成、智能检索、对话） | 由 Service 层按需调用，非所有操作都经 Agent |
| **Storage Layer** | 数据读写（DB + 文件系统） | Repository 模式，可替换底层实现 |

> **关键区分**：知识库的 CRUD 操作（列表、读取、删除）直接由 Service Layer 完成，**不需要** 经过 Agent。只有需要 AI 能力的操作（摘要生成、Obsidian 文档生成、智能检索、对话）才调用 Agent Layer。

---

## 3. 技术选型

### 后端平台（核心）

| 组件 | 选型 | 理由 |
|------|------|------|
| API 框架 | **FastAPI** | 异步、SSE 流式、自动 OpenAPI 文档、依赖注入 |
| 业务层 | **纯 Python Service 类** | 解耦 HTTP，可独立测试，可被多种入口调用 |
| AI 引擎 | **Claude Agent SDK** | Agent Runtime + MCP Tools，AI 能力可扩展 |
| 数据库 | **SQLite** | 轻量，个人使用足够；多用户时可每用户独立 DB |
| 知识存储 | **Obsidian Markdown + 文件系统** | 开放格式，可移植，可 Git 版本控制 |
| 检索 | **grep + LLM** | 初期简单高效，不引入向量数据库 |
| 认证 | **JWT** | 无状态，多用户预留 |
| 部署 | **直接运行 → Docker** | 渐进式 |

### Chrome Extension（第一个客户端）

| 组件 | 选型 | 理由 |
|------|------|------|
| 扩展框架 | **WXT** | Vite 驱动，文件路由，活跃维护 |
| UI 框架 | **Svelte** | 编译型，无运行时，包体积小 |
| 交互形态 | **浮动面板 + Side Panel** | 快操作 + 深度交互双模式 |
| 样式 | **Tailwind CSS** | 原子化，窄空间灵活 |
| 状态管理 | **Svelte Store** | 内置方案，无额外依赖 |

---

## 4. 设计原则

### 系统层面

| 原则 | 说明 |
|------|------|
| **平台思维** | 后端是核心平台，客户端只是 API 的消费者，API 设计客户端无关 |
| **分层清晰** | API → Service → Agent → Storage，各层职责明确，可独立测试 |
| **知识即文件** | 所有知识以 Markdown 文件存储，不锁定在数据库中 |
| **Agent 按需** | 只有需要 AI 能力的操作才调用 Agent，CRUD 直接由 Service 完成 |
| **可扩展** | 新增 Service/Tool 不影响已有功能，新增客户端不需要改后端 |
| **可维护** | 模块化、类型标注、文档齐全、自动化测试 |

### 风格层面

| 原则 | 说明 |
|------|------|
| **简洁** | 代码简洁，API 简洁，UI 简洁，不过度设计 |
| **专业** | 规范的项目结构、错误处理、日志记录、配置管理 |
| **美观** | UI 设计精致、现代、富有设计感，拒绝粗糙 |
| **一致** | 统一的命名规范、API 风格、代码风格、UI 风格 |

---

## 5. 文档索引

| 文档 | 说明 |
|------|------|
| [architecture-overview.md](architecture-overview.md) | 本文档：系统架构总览 |
| [chrome-extension-design.md](chrome-extension-design.md) | Chrome 扩展客户端设计 |
| [backend-service-design.md](backend-service-design.md) | 后端平台详细设计 |
| [api-specification.md](api-specification.md) | RESTful API 接口规范 |
| [data-model.md](data-model.md) | 数据模型与知识库格式 |

---

## 6. 里程碑

### Phase 1 — MVP 核心闭环

**目标**：跑通「采集 → AI 处理 → 保存 → 查询」完整流程

**后端**：
- [ ] FastAPI 骨架 + 分层架构搭建
- [ ] Claude Agent SDK 集成 + 基础 MCP Tools
- [ ] 知识条目保存/读取（Markdown 文件操作）
- [ ] Chat API（SSE 流式响应）
- [ ] 基础用户认证（JWT）

**Chrome 扩展**：
- [ ] WXT + Svelte 项目骨架
- [ ] 右键菜单 + 浮动面板基础 UI
- [ ] 文本/链接/图片捕获
- [ ] 与后端 API 对接

### Phase 2 — 功能完善

**后端**：
- [ ] 完整知识库 CRUD API
- [ ] 标签管理 Service
- [ ] 搜索能力增强
- [ ] 图片/附件处理
- [ ] 会话历史管理
- [ ] Docker 部署配置

**Chrome 扩展**：
- [ ] Side Panel 完整 UI
- [ ] 知识库浏览/搜索
- [ ] 会话管理
- [ ] 设置页面

### Phase 3 — 平台扩展

- [ ] Web 前端应用（知识库全功能管理）
- [ ] 知识关联（Obsidian 双链）
- [ ] 批量导入（PDF、网页全文）
- [ ] 更多 MCP Tools
- [ ] 知识库统计与可视化
