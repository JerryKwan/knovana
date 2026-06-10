# Knovana API 接口规范

---

## 概述

Chrome 扩展与后端之间的 HTTP API 规范。

- **Base URL**: `http://localhost:8000/api`（开发）/ `https://api.knovana.com/api`（生产）
- **后端实现**: Node.js + TypeScript + Hono，Agent Runtime 使用 `claude-agent-sdk-typescript`
- **认证**: 所有接口（除 auth）需要 `Authorization: Bearer <JWT>` Header
- **流式接口**: Chat 和 Capture 使用 SSE（Server-Sent Events）
- **内容类型**: `application/json`（常规）/ `text/event-stream`（流式）

---

## 1. 认证

### POST /api/auth/register

创建新用户。

```json
// Request
{
  "username": "alice",
  "password": "secure-password"
}

// Response 201
{
  "user_id": "usr_abc123",
  "token": "eyJhbG..."
}
```

### POST /api/auth/login

登录获取 Token。

```json
// Request
{
  "username": "alice",
  "password": "secure-password"
}

// Response 200
{
  "user_id": "usr_abc123",
  "token": "eyJhbG..."
}
```

---

## 2. 对话

### POST /api/chat

流式对话。返回 SSE 事件流。

```json
// Request
{
  "message": "帮我总结一下这段内容",
  "session_id": "sess_xyz",           // 可选，不传则创建新会话
  "intent": "chat",                   // 可选：chat | knowledge_entry
  "attachment": {                     // 可选，用户上传附件
    "name": "研究报告.pdf",            // 原始展示文件名
    "size": 245000,
    "path": "attachments/研究报告.pdf" // 后端临时附件路径
  },
  "context": {                        // 可选，页面上下文
    "page_url": "https://example.com/article",
    "page_title": "Some Article",
    "selected_text": "用户选中的文字...",
    "selected_images": [
      {"src": "https://example.com/img.png", "alt": "图片描述"}
    ]
  }
}

// Response: SSE stream
data: 这是
data: AI 的
data: 流式
data: 回复
data: [DONE]
```

当 `intent` 为 `knowledge_entry` 且请求包含 `attachment` 时，后端会把该附件纳入本次知识条目保存上下文；Agent 调用 `save_to_kb` 保存条目时，附件会被归档到条目目录的 `assets/` 中，并触发 `目录/index.md` 存储形式。普通 `chat` 意图下，附件仅作为当前消息的临时附件，除非用户或 Agent 明确执行归档操作。

### GET /api/chat/sessions

获取会话列表。

```json
// Response 200
{
  "sessions": [
    {
      "id": "sess_xyz",
      "title": "关于 React 架构的讨论",
      "message_count": 12,
      "created_at": "2024-12-01T14:30:00Z",
      "updated_at": "2024-12-01T15:00:00Z"
    }
  ],
  "total": 25,
  "page": 1
}
```

### GET /api/chat/sessions/{session_id}

获取会话详情（含所有消息）。

```json
// Response 200
{
  "id": "sess_xyz",
  "title": "关于 React 架构的讨论",
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "帮我总结这段内容...",
      "created_at": "2024-12-01T14:30:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "以下是内容摘要...",
      "created_at": "2024-12-01T14:30:05Z"
    }
  ]
}
```

### DELETE /api/chat/sessions/{session_id}

删除会话。

```json
// Response 200
{ "status": "deleted" }
```

---

## 3. 内容捕获

### POST /api/capture

处理从浏览器捕获的内容。返回 SSE 事件流。

```json
// Request
{
  "action": "summarize",    // summarize | generate_doc | save
  "content": "捕获的文字内容...",
  "image_url": null,        // 图片 URL（保存图片时使用）
  "page_url": "https://example.com/article",
  "page_title": "Article Title"
}

// Response: SSE stream
data: {"type": "text", "content": "AI 处理结果..."}
data: {"type": "action", "action": "saved", "path": "inbox/2024-12-01-article.md"}
data: [DONE]
```

SSE 事件类型：

| type | 说明 |
|------|------|
| `text` | AI 生成的文本片段 |
| `action` | Agent 执行了某个操作（保存、搜索等） |
| `error` | 处理错误 |

### POST /api/v1/attachments

上传图片或文件附件。后端尽量保留原始文件名；若同一临时附件目录下已存在同名文件，则追加简洁数字后缀，例如 `研究报告.pdf`、`研究报告-2.pdf`。文件名中的路径片段、控制字符和 Windows/Markdown 不安全字符会被净化。

```
// Request: multipart/form-data
file: <binary file data>

// Response 200
{
  "url": "/api/v1/attachments/usr_abc123/%E7%A0%94%E7%A9%B6%E6%8A%A5%E5%91%8A.pdf",
  "filename": "研究报告.pdf"
}
```

---

## 4. 知识库

### GET /api/knowledge

列出知识库条目。

```
// Query Parameters
?page=1
&per_page=20
&tags=react,frontend     // 可选，按标签筛选
&category=topics          // 可选，按分类筛选
&sort=updated_at          // 排序：created_at | updated_at | title

// Response 200
{
  "entries": [
    {
      "id": "topics/frontend/react-server-components",  // 文件路径作为 ID
      "title": "React Server Components",
      "summary": "前 200 字摘要...",
      "tags": ["react", "frontend", "ssr"],
      "source_url": "https://blog.example.com/rsc",
      "has_attachments": true,
      "attachment_count": 2,
      "created_at": "2024-12-01T14:30:00Z",
      "updated_at": "2024-12-01T14:30:00Z"
    }
  ],
  "total": 342,
  "page": 1,
  "per_page": 20
}
```

### GET /api/knowledge/{entry_id}

获取知识条目详情。`entry_id` 是 URL 编码的相对路径。

```json
// Response 200
{
  "id": "topics/frontend/react-server-components",
  "title": "React Server Components",
  "content": "完整 Markdown 正文...",
  "tags": ["react", "frontend", "ssr"],
  "source_url": "https://blog.example.com/rsc",
  "attachments": [
    {
      "name": "architecture.png",
      "description": "架构图",
      "path": "assets/architecture.png",
      "size_bytes": 245000
    }
  ],
  "created_at": "2024-12-01T14:30:00Z",
  "updated_at": "2024-12-01T14:30:00Z"
}
```

### PUT /api/knowledge/{entry_id}

更新知识条目。

```json
// Request
{
  "title": "React Server Components 详解",  // 可选
  "content": "更新后的 Markdown...",          // 可选
  "tags": ["react", "frontend"]              // 可选
}

// Response 200
{
  "id": "topics/frontend/react-server-components",
  "status": "updated"
}
```

### DELETE /api/knowledge/{entry_id}

删除知识条目（含附件）。

```json
// Response 200
{ "status": "deleted" }
```

### GET /api/knowledge/tags

获取所有标签列表。

```json
// Response 200
{
  "tags": [
    { "name": "react", "count": 15 },
    { "name": "frontend", "count": 23 },
    { "name": "architecture", "count": 8 }
  ]
}
```

### GET /api/knowledge/stats

知识库统计。

```json
// Response 200
{
  "total_entries": 342,
  "total_tags": 45,
  "total_sources": 89,
  "total_attachments": 56,
  "storage_bytes": 52428800,
  "entries_this_week": 12,
  "categories": {
    "inbox": 23,
    "topics": 280,
    "daily": 39
  }
}
```

---

## 5. 搜索

### GET /api/search

搜索知识库。

```
// Query Parameters
?q=react server components
&tags=frontend            // 可选，限定标签
&category=topics          // 可选，限定分类
&max_results=20           // 可选，默认 20

// Response 200
{
  "query": "react server components",
  "results": [
    {
      "id": "topics/frontend/react-server-components",
      "title": "React Server Components",
      "snippet": "...匹配的上下文片段...",
      "relevance": "high",
      "tags": ["react", "frontend"],
      "source_url": "https://blog.example.com/rsc"
    }
  ],
  "total": 3
}
```

---

## 6. 设置

### GET /api/settings

获取用户设置。

```json
// Response 200
{
  "default_category": "inbox",
  "default_language": "zh-CN",
  "auto_tag": true,
  "theme": "system"
}
```

### PUT /api/settings

更新用户设置。

```json
// Request
{
  "default_category": "inbox",
  "auto_tag": true
}

// Response 200
{ "status": "updated" }
```

---

## 7. 错误格式

所有错误使用统一格式：

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

常见错误码：

| HTTP Status | Code | 说明 |
|-------------|------|------|
| 400 | `BAD_REQUEST` | 请求参数错误 |
| 401 | `UNAUTHORIZED` | 未认证或 Token 过期 |
| 403 | `FORBIDDEN` | 无权访问 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |
| 503 | `AGENT_ERROR` | Claude Agent SDK TypeScript 处理失败 |
