# Knovana 数据模型设计

---

## 1. 知识库文件结构

知识库以文件系统为基础，每个用户拥有独立的知识库目录。

### 1.1 目录结构

```
knowledge-base/{user_id}/
│
├── inbox/                              # 待整理（默认保存位置）
│   ├── 2024-12-01-react-patterns.md    # 简单条目（无附件）
│   └── 2024-12-02-system-design/       # 复杂条目（含附件）
│       ├── index.md                    # 主文档
│       └── assets/                     # 附件目录
│           ├── architecture.png
│           └── performance-chart.jpg
│
├── topics/                             # 按主题分类
│   ├── frontend/
│   │   ├── react-server-components.md
│   │   └── css-grid-guide/
│   │       ├── index.md
│   │       └── assets/
│   │           └── grid-layout.png
│   ├── backend/
│   ├── ai/
│   └── ...
│
├── daily/                              # 日记 / 随笔
│   ├── 2024-12-01.md
│   └── 2024-12-02.md
│
└── .knovana/                           # 系统元数据（自动生成）
    ├── tags.json                       # 标签索引缓存
    └── index.json                      # 条目索引缓存
```

### 1.2 条目存储规则

| 场景 | 存储方式 |
|------|----------|
| 纯文本内容（无附件） | 单个 `.md` 文件 |
| 含附件内容（图片等） | 文件夹 + `index.md` + `assets/` 子目录 |

**命名规则**：
- 文件名：`{date}-{slug}.md` 或 `{date}-{slug}/index.md`
- slug 从标题生成：小写、去除特殊字符、空格转连字符
- 示例：`2024-12-01-react-server-components.md`

**附件命名规则**：
- 上传或下载附件时，系统尽量保留原始文件名的主体和扩展名，例如 `研究报告.pdf`。
- 为保证文件系统安全，路径片段、控制字符、Windows 非法字符和 Markdown 链接分隔符会被净化。
- 同一目录中出现同名附件时，使用简洁数字后缀避免覆盖，例如 `研究报告.pdf`、`研究报告-2.pdf`。
- frontmatter 的 `attachments[].name` 记录实际磁盘文件名；Markdown 正文中的 `assets/...` 引用在包含空格、中文等字符时可以使用 URL 编码形式，例如 `assets/%E7%A0%94%E7%A9%B6%20%E6%8A%A5%E5%91%8A.pdf`。

---

## 2. Markdown 文件格式

每个知识条目都是 Obsidian 兼容的 Markdown 文件，使用 YAML frontmatter 存储元数据。

### 2.1 基础格式（无附件）

```markdown
---
title: React Server Components 详解
source: https://blog.example.com/rsc
captured_at: 2024-12-01T14:30:00+08:00
tags:
  - react
  - frontend
  - ssr
type: excerpt
language: zh-CN
---

# React Server Components 详解

## 原文摘录

Server Components 允许在服务端渲染 React 组件，将数据获取逻辑
移到服务端执行，减少客户端 JavaScript 体积...

## AI 总结

React Server Components (RSC) 的核心价值在于：
1. **减少客户端 bundle 体积** — 服务端组件的代码不会发送到浏览器
2. **直接访问后端资源** — 可以直接读数据库、文件系统
3. **流式渲染** — 支持 Suspense 的流式服务端渲染
```

### 2.2 含附件格式

```markdown
---
title: 微服务架构设计笔记
source: https://conference.example.com/slides
captured_at: 2024-12-02T10:15:00+08:00
tags:
  - architecture
  - microservices
  - backend
type: note
language: zh-CN
attachments:
  - name: architecture.png
    description: 微服务整体架构图
    size: 245000
  - name: performance-chart.jpg
    description: 各服务响应时间对比
    size: 180000
---

# 微服务架构设计笔记

## 架构概览

![微服务整体架构图](assets/architecture.png)

> **AI 解读**: 该图展示了基于 API Gateway 的微服务拓扑结构，
> 采用事件驱动的异步通信模式，使用 Kafka 作为消息总线。

## 性能数据

![各服务响应时间对比](assets/performance-chart.jpg)

> **AI 解读**: 用户服务和订单服务的 P99 延迟分别为 120ms 和 250ms，
> 推荐服务延迟最高达 800ms，是优化的重点。

## 关键要点

- 服务间通信使用 gRPC（同步）和 Kafka（异步）
- 每个服务独立数据库（Database per Service）
- 使用 Circuit Breaker 模式防止级联故障

## 相关知识

- [[分布式系统基础]]
- [[API Gateway 设计模式]]
```

### 2.3 Frontmatter 字段规范

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 条目标题 |
| `source` | string | ❌ | 来源 URL |
| `captured_at` | datetime | ✅ | 捕获时间（ISO 8601） |
| `tags` | list[string] | ❌ | 标签列表 |
| `type` | string | ✅ | 条目类型（见下表） |
| `language` | string | ❌ | 内容语言（BCP 47） |
| `attachments` | list[object] | ❌ | 附件列表 |
| `updated_at` | datetime | ❌ | 最后更新时间 |
| `ai_generated` | boolean | ❌ | 内容是否由 AI 生成/整理 |

**条目类型（type）**：

| 值 | 说明 |
|----|------|
| `excerpt` | 摘录（从网页选取的片段） |
| `note` | 笔记（用户撰写或 AI 整理） |
| `page` | 整页保存 |
| `image` | 以图片为主的条目 |
| `link` | 链接收藏（主要保存 URL 和简要说明） |
| `chat` | 对话记录导出 |

**附件对象格式**：

```yaml
attachments:
  - name: filename.png        # 实际附件文件名，尽量保留原始名称
    description: 图片说明       # 描述
    size: 245000               # 字节数
    mime_type: image/png       # MIME 类型（可选）
    ai_description: AI 分析... # AI 对图片内容的解读（可选）
```

---

## 3. SQLite 数据模型

SQLite 仅用于存储用户信息和对话历史，知识内容完全在文件系统中。

### 3.1 ER 关系

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    users     │       │  chat_sessions   │       │  chat_messages   │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)      │──1:N─►│ id (PK)          │──1:N─►│ id (PK)          │
│ username     │       │ user_id (FK)     │       │ session_id (FK)  │
│ password_hash│       │ title            │       │ role             │
│ kb_path      │       │ context (JSON)   │       │ content          │
│ settings(JSON│       │ created_at       │       │ metadata (JSON)  │
│ created_at   │       │ updated_at       │       │ created_at       │
└──────────────┘       └──────────────────┘       └──────────────────┘
```

### 3.2 完整 Schema

```sql
-- 用户表
CREATE TABLE users (
    id          TEXT PRIMARY KEY,              -- UUID
    username    TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    kb_path     TEXT NOT NULL,                 -- 知识库相对路径
    settings    TEXT DEFAULT '{}',             -- JSON: 用户设置
    created_at  TEXT DEFAULT (datetime('now'))
);

-- 对话会话表
CREATE TABLE chat_sessions (
    id          TEXT PRIMARY KEY,              -- UUID
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT,                          -- 会话标题（首条消息自动生成）
    context     TEXT,                          -- JSON: 关联页面上下文
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_sessions_updated ON chat_sessions(updated_at DESC);

-- 对话消息表
CREATE TABLE chat_messages (
    id          TEXT PRIMARY KEY,              -- UUID
    session_id  TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    metadata    TEXT,                          -- JSON: token 用量、模型等
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_messages_session ON chat_messages(session_id);
```

---

## 4. 索引缓存

为了快速列出知识库条目和标签，后端维护一个轻量级的索引缓存文件。

### 4.1 tags.json

```json
{
  "tags": {
    "react": { "count": 15, "entries": ["inbox/2024-12-01-react-patterns", "topics/frontend/rsc"] },
    "frontend": { "count": 23, "entries": ["..."] },
    "architecture": { "count": 8, "entries": ["..."] }
  },
  "updated_at": "2024-12-01T15:00:00Z"
}
```

### 4.2 index.json

```json
{
  "entries": [
    {
      "id": "inbox/2024-12-01-react-patterns",
      "title": "React Patterns",
      "tags": ["react", "frontend"],
      "type": "excerpt",
      "has_attachments": false,
      "created_at": "2024-12-01T14:30:00Z"
    }
  ],
  "total": 342,
  "updated_at": "2024-12-01T15:00:00Z"
}
```

**索引重建触发时机**：
- 通过 API 新增/修改/删除条目后自动更新
- 手动触发：`GET /api/knowledge/reindex`
- 启动时如果索引文件不存在则全量构建

---

## 5. 数据流转示意

### 5.1 捕获保存流程

```
用户选中文字 + 图片
       │
       ▼
Chrome 扩展组装 CaptureRequest
  {
    action: "save",
    content: "选中的文字...",
    image_url: "https://example.com/img.png",
    page_url: "...",
    page_title: "..."
  }
       │
       ▼
POST /api/capture → Hono 路由
       │
       ▼
claude-agent-sdk-typescript Agent 接收指令：
  "用户从 {page_url} 捕获了以下内容，请整理后保存到知识库:
   {content}
   附件图片: {image_url}"
       │
       ▼
Agent 自主决策，调用 MCP Tools:
  1. 下载图片 → manage_attachment("download", image_url)
  2. 整理内容 → 生成标题、标签、Markdown 正文
  3. 保存 → save_to_kb(title, content, tags, attachments)
       │
       ▼
文件系统生成:
  inbox/2024-12-01-react-patterns/
  ├── index.md        ← 含 frontmatter + 正文 + 图片引用
  └── assets/
      └── img.png     ← 下载的图片
       │
       ▼
更新 .knovana/index.json 索引缓存
       │
       ▼
SSE 返回结果给扩展:
  data: {"type": "action", "action": "saved", "path": "inbox/2024-12-01-react-patterns"}
```
