# Knovana Backend — 详细设计

---

## 1. 定位与架构

Knovana Backend 是整个系统的 **核心平台**，为所有客户端产品（Chrome 扩展、Web 前端、CLI 等）提供统一的 API 服务。

### 1.1 四层架构

```
┌────────────────────────────────────────────────────────────┐
│                    API Layer (FastAPI)                       │
│                                                            │
│  路由定义 · 请求/响应 Schema · 认证中间件 · SSE 流式        │
│  不含业务逻辑，仅做路由和格式转换                             │
├────────────────────────────────────────────────────────────┤
│                    Service Layer (业务层)                    │
│                                                            │
│  ChatService · CaptureService · KnowledgeService           │
│  SearchService · UserService · TagService                  │
│                                                            │
│  业务编排 · 权限校验 · 数据组装                               │
│  纯 Python，不依赖 HTTP 框架，可独立单元测试                  │
├────────────────────────────────────────────────────────────┤
│                    Agent Layer (智能层)                      │
│                                                            │
│  Claude Agent SDK + MCP Tools                              │
│  由 Service 层按需调用，非所有操作都需要 Agent               │
├────────────────────────────────────────────────────────────┤
│                    Storage Layer (存储层)                    │
│                                                            │
│  KnowledgeRepository · UserRepository · SessionRepository  │
│  FileStorage · SQLite                                      │
│                                                            │
│  Repository 模式，隔离存储细节                               │
└────────────────────────────────────────────────────────────┘
```

### 1.2 调用关系

```
API Route
  │
  └─► Service (业务逻辑)
        │
        ├─► Storage (直接读写数据) ──── 常规 CRUD
        │
        └─► Agent (需要 AI 能力时) ──── 摘要生成/文档生成/智能检索/对话
              │
              └─► MCP Tools ─► Storage
```

**核心原则**：
- API 层调用 Service 层，绝不直接访问 Storage 或 Agent
- Service 层决定是否需要 Agent 参与
- Agent 通过 MCP Tools 间接操作 Storage
- Storage 层对上层透明，可替换底层实现

---

## 2. 项目结构

```
backend/
├── main.py                           # 应用入口
├── requirements.txt
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
├── .env.example
│
├── app/
│   ├── __init__.py
│   ├── config.py                     # 全局配置 (Pydantic Settings)
│   │
│   ├── api/                          # ── API Layer ──
│   │   ├── __init__.py
│   │   ├── router.py                 # 总路由注册
│   │   ├── deps.py                   # 依赖注入 (get_current_user 等)
│   │   ├── middleware.py             # CORS, 日志, 错误处理中间件
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py               # /api/auth/*
│   │       ├── chat.py               # /api/chat/*
│   │       ├── capture.py            # /api/capture/*
│   │       ├── knowledge.py          # /api/knowledge/*
│   │       ├── search.py             # /api/search
│   │       ├── tags.py               # /api/tags/*
│   │       └── settings.py           # /api/settings
│   │
│   ├── services/                     # ── Service Layer ──
│   │   ├── __init__.py
│   │   ├── chat_service.py           # 对话管理
│   │   ├── capture_service.py        # 内容捕获处理
│   │   ├── knowledge_service.py      # 知识库 CRUD
│   │   ├── search_service.py         # 搜索
│   │   ├── tag_service.py            # 标签管理
│   │   └── user_service.py           # 用户管理
│   │
│   ├── agent/                        # ── Agent Layer ──
│   │   ├── __init__.py
│   │   ├── client.py                 # Agent 客户端封装
│   │   ├── tools/                    # MCP Tools
│   │   │   ├── __init__.py
│   │   │   ├── kb_save.py
│   │   │   ├── kb_read.py
│   │   │   ├── kb_update.py
│   │   │   ├── kb_search.py
│   │   │   ├── kb_list.py
│   │   │   ├── kb_delete.py
│   │   │   ├── tag_manager.py
│   │   │   └── attachment_manager.py
│   │   └── prompts/                  # System Prompts
│   │       ├── __init__.py
│   │       ├── chat.py
│   │       ├── capture.py
│   │       └── search.py
│   │
│   ├── storage/                      # ── Storage Layer ──
│   │   ├── __init__.py
│   │   ├── database.py               # SQLite 连接管理
│   │   ├── migrations.py             # Schema 迁移
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── user_repo.py          # 用户数据存取
│   │   │   ├── session_repo.py       # 会话数据存取
│   │   │   └── message_repo.py       # 消息数据存取
│   │   └── knowledge/                # 知识库文件操作
│   │       ├── __init__.py
│   │       ├── file_ops.py           # Markdown 文件读写
│   │       ├── frontmatter.py        # YAML frontmatter 解析/生成
│   │       ├── attachment.py         # 附件管理
│   │       └── index.py              # 索引缓存管理
│   │
│   ├── models/                       # 数据模型 & Schema
│   │   ├── __init__.py
│   │   ├── user.py                   # User domain model
│   │   ├── session.py                # ChatSession domain model
│   │   ├── knowledge.py              # KnowledgeEntry domain model
│   │   └── schemas/                  # Pydantic Request/Response Schema
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── chat.py
│   │       ├── capture.py
│   │       ├── knowledge.py
│   │       └── common.py             # 分页、错误等公共 Schema
│   │
│   ├── auth/                         # 认证模块
│   │   ├── __init__.py
│   │   ├── jwt.py                    # JWT 生成/验证
│   │   └── password.py               # 密码哈希
│   │
│   └── utils/                        # 工具函数
│       ├── __init__.py
│       ├── slug.py                   # 标题 → slug 转换
│       ├── datetime.py               # 时间工具
│       └── errors.py                 # 自定义异常类
│
├── tests/                            # 测试
│   ├── __init__.py
│   ├── conftest.py                   # pytest fixtures
│   ├── test_services/                # Service 层单元测试
│   │   ├── test_knowledge_service.py
│   │   ├── test_chat_service.py
│   │   └── ...
│   ├── test_storage/                 # Storage 层测试
│   │   ├── test_file_ops.py
│   │   └── ...
│   └── test_api/                     # API 集成测试
│       ├── test_knowledge_api.py
│       └── ...
│
├── knowledge-base/                   # 知识库根目录（运行时）
│   └── {user_id}/
│
└── data/                             # 运行时数据
    └── knovana.db
```

---

## 3. Service Layer 设计

Service 层是业务逻辑的核心，纯 Python 类，不依赖 HTTP 框架。

### 3.1 KnowledgeService

知识库的 CRUD 操作 **不经过 Agent**，直接操作文件系统。

```python
# app/services/knowledge_service.py

from app.storage.knowledge.file_ops import KnowledgeFileOps
from app.storage.knowledge.index import IndexManager
from app.models.knowledge import KnowledgeEntry, KnowledgeListItem

class KnowledgeService:
    """知识库业务逻辑。"""

    def __init__(self, kb_root: str):
        self.file_ops = KnowledgeFileOps(kb_root)
        self.index = IndexManager(kb_root)

    def list_entries(
        self,
        page: int = 1,
        per_page: int = 20,
        tags: list[str] | None = None,
        category: str | None = None,
        sort_by: str = "created_at",
    ) -> tuple[list[KnowledgeListItem], int]:
        """列出知识条目（从索引缓存读取）。"""
        entries = self.index.get_entries(tags=tags, category=category, sort_by=sort_by)
        total = len(entries)
        start = (page - 1) * per_page
        return entries[start:start + per_page], total

    def get_entry(self, entry_id: str) -> KnowledgeEntry:
        """读取单条知识详情（解析 Markdown 文件）。"""
        return self.file_ops.read_entry(entry_id)

    def create_entry(self, entry: KnowledgeEntry) -> str:
        """手动创建知识条目。"""
        path = self.file_ops.save_entry(entry)
        self.index.add_entry(entry, path)
        return path

    def update_entry(self, entry_id: str, updates: dict) -> KnowledgeEntry:
        """更新知识条目。"""
        entry = self.file_ops.update_entry(entry_id, updates)
        self.index.update_entry(entry_id, entry)
        return entry

    def delete_entry(self, entry_id: str) -> None:
        """删除知识条目（含附件）。"""
        self.file_ops.delete_entry(entry_id)
        self.index.remove_entry(entry_id)

    def get_tags(self) -> list[dict]:
        """获取所有标签及其计数。"""
        return self.index.get_tags()

    def get_stats(self) -> dict:
        """获取知识库统计信息。"""
        return self.index.get_stats()

    def reindex(self) -> None:
        """重建索引缓存。"""
        self.index.rebuild()
```

### 3.2 CaptureService

内容捕获处理 **需要 Agent 参与**（AI 整理、打标签、总结等）。

```python
# app/services/capture_service.py

from app.agent.client import KnovanaAgent
from app.agent.prompts.capture import CAPTURE_PROMPTS
from typing import AsyncGenerator

class CaptureService:
    """内容捕获处理。需要 AI 能力，调用 Agent Layer。

    核心 AI 操作：
    - summarize: 生成摘要
    - generate_doc: 整理为 Obsidian 格式的 Markdown 文档并保存
    - save: 直接保存（Agent 自动整理格式 + 生成 frontmatter）
    """

    def __init__(self, user_id: str, kb_root: str):
        self.agent = KnovanaAgent(user_id=user_id, kb_root=kb_root)

    async def process(
        self,
        action: str,
        content: str | None = None,
        image_url: str | None = None,
        page_url: str | None = None,
        page_title: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        处理捕获的内容。返回流式文本。

        action: summarize | generate_doc | save
        """
        instruction = self._build_instruction(
            action, content, image_url, page_url, page_title
        )
        prompt = CAPTURE_PROMPTS.get(action, CAPTURE_PROMPTS["default"])

        async for chunk in self.agent.chat(instruction, prompt):
            yield chunk

    def _build_instruction(self, action, content, image_url, page_url, page_title):
        parts = [f"操作: {action}"]
        if page_url:
            parts.append(f"来源页面: {page_title} ({page_url})")
        if content:
            parts.append(f"内容:\n{content}")
        if image_url:
            parts.append(f"图片 URL: {image_url}")
        return "\n\n".join(parts)
```

### 3.3 ChatService

对话管理——会话元数据由 Service 直接管理，AI 对话通过 Agent。

```python
# app/services/chat_service.py

from app.storage.repositories.session_repo import SessionRepository
from app.storage.repositories.message_repo import MessageRepository
from app.agent.client import KnovanaAgent
from app.agent.prompts.chat import CHAT_SYSTEM_PROMPT
from typing import AsyncGenerator
import uuid

class ChatService:
    """对话管理。会话 CRUD 直接操作 DB，AI 对话通过 Agent。"""

    def __init__(self, user_id: str, kb_root: str, db):
        self.user_id = user_id
        self.session_repo = SessionRepository(db)
        self.message_repo = MessageRepository(db)
        self.agent = KnovanaAgent(user_id=user_id, kb_root=kb_root)

    async def chat(
        self,
        message: str,
        session_id: str | None = None,
        context: dict | None = None,
    ) -> AsyncGenerator[str, None]:
        """发送消息并流式返回 AI 回复。"""

        # 1. 会话管理
        if not session_id:
            session_id = str(uuid.uuid4())
            self.session_repo.create(session_id, self.user_id, context=context)

        # 2. 保存用户消息
        self.message_repo.create(session_id, role="user", content=message)

        # 3. 构建带上下文的消息
        full_message = message
        if context:
            full_message = self._inject_context(message, context)

        # 4. 调用 Agent 流式返回
        assistant_chunks = []
        async for chunk in self.agent.chat(full_message, CHAT_SYSTEM_PROMPT):
            assistant_chunks.append(chunk)
            yield chunk

        # 5. 保存 AI 回复
        full_response = "".join(assistant_chunks)
        self.message_repo.create(session_id, role="assistant", content=full_response)

        # 6. 自动生成会话标题（首次对话时）
        session = self.session_repo.get(session_id)
        if not session.title:
            title = full_response[:50].strip()
            self.session_repo.update_title(session_id, title)

    def list_sessions(self, page: int = 1, per_page: int = 20):
        return self.session_repo.list_by_user(self.user_id, page, per_page)

    def get_session(self, session_id: str):
        return self.session_repo.get_with_messages(session_id)

    def delete_session(self, session_id: str):
        self.session_repo.delete(session_id)

    def _inject_context(self, message: str, context: dict) -> str:
        parts = []
        if context.get("page_url"):
            parts.append(f"当前页面: {context.get('page_title', '')} ({context['page_url']})")
        if context.get("selected_text"):
            parts.append(f"用户选中的内容:\n{context['selected_text']}")
        if parts:
            return "\n".join(parts) + f"\n\n用户消息: {message}"
        return message
```

### 3.4 SearchService

```python
# app/services/search_service.py

import subprocess
from app.agent.client import KnovanaAgent
from app.agent.prompts.search import SEARCH_SYSTEM_PROMPT

class SearchService:
    """搜索服务。简单搜索用 grep，智能搜索用 Agent。"""

    def __init__(self, user_id: str, kb_root: str):
        self.kb_root = kb_root
        self.agent = KnovanaAgent(user_id=user_id, kb_root=kb_root)

    def quick_search(self, query: str, max_results: int = 20) -> list[dict]:
        """快速搜索 — 纯 grep，不调用 Agent。用于知识库浏览时的筛选。"""
        result = subprocess.run(
            ["grep", "-rnil", "--include=*.md", query, self.kb_root],
            capture_output=True, text=True, timeout=10,
        )
        matches = []
        for line in result.stdout.strip().split("\n")[:max_results]:
            if line:
                matches.append(self._parse_match(line, query))
        return matches

    async def smart_search(self, query: str) -> str:
        """智能搜索 — 通过 Agent 理解语义并检索。"""
        result = await self.agent.process(
            f"在知识库中搜索与以下内容相关的知识: {query}",
            SEARCH_SYSTEM_PROMPT,
        )
        return result

    def _parse_match(self, filepath: str, query: str) -> dict:
        # 解析文件 frontmatter 获取元信息
        ...
```

---

## 4. API Layer 设计

API 路由是薄壳，只做参数接收、Service 调用、响应格式化。

### 4.1 路由注册

```python
# app/api/router.py

from fastapi import APIRouter
from app.api.routes import auth, chat, capture, knowledge, search, tags, settings

api_router = APIRouter()

api_router.include_router(auth.router,      prefix="/auth",      tags=["认证"])
api_router.include_router(chat.router,      prefix="/chat",      tags=["对话"])
api_router.include_router(capture.router,   prefix="/capture",   tags=["捕获"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["知识库"])
api_router.include_router(search.router,    prefix="/search",    tags=["搜索"])
api_router.include_router(tags.router,      prefix="/tags",      tags=["标签"])
api_router.include_router(settings.router,  prefix="/settings",  tags=["设置"])
```

### 4.2 路由示例 — Knowledge

```python
# app/api/routes/knowledge.py

from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user, get_knowledge_service
from app.models.schemas.knowledge import (
    KnowledgeListResponse,
    KnowledgeDetailResponse,
    KnowledgeUpdateRequest,
)
from app.models.schemas.common import PaginatedResponse

router = APIRouter()

@router.get("", response_model=PaginatedResponse[KnowledgeListResponse])
async def list_knowledge(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    tags: str | None = None,
    category: str | None = None,
    sort: str = "created_at",
    service=Depends(get_knowledge_service),
):
    """列出知识库条目。"""
    tag_list = tags.split(",") if tags else None
    entries, total = service.list_entries(page, per_page, tag_list, category, sort)
    return PaginatedResponse(items=entries, total=total, page=page, per_page=per_page)

@router.get("/{entry_id:path}", response_model=KnowledgeDetailResponse)
async def get_knowledge(entry_id: str, service=Depends(get_knowledge_service)):
    """获取知识条目详情。"""
    return service.get_entry(entry_id)

@router.put("/{entry_id:path}")
async def update_knowledge(
    entry_id: str,
    req: KnowledgeUpdateRequest,
    service=Depends(get_knowledge_service),
):
    """更新知识条目。"""
    return service.update_entry(entry_id, req.model_dump(exclude_unset=True))

@router.delete("/{entry_id:path}")
async def delete_knowledge(entry_id: str, service=Depends(get_knowledge_service)):
    """删除知识条目。"""
    service.delete_entry(entry_id)
    return {"status": "deleted"}
```

### 4.3 依赖注入

```python
# app/api/deps.py

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.jwt import verify_token
from app.config import settings
from app.services.knowledge_service import KnowledgeService
from app.services.chat_service import ChatService
from app.services.capture_service import CaptureService
from app.services.search_service import SearchService
from app.storage.database import get_db

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """验证 JWT 并返回当前用户。"""
    payload = verify_token(credentials.credentials)
    # ... 查询用户
    return user

def get_knowledge_service(user=Depends(get_current_user)) -> KnowledgeService:
    """注入 KnowledgeService。"""
    return KnowledgeService(kb_root=user.kb_path)

def get_chat_service(user=Depends(get_current_user), db=Depends(get_db)) -> ChatService:
    """注入 ChatService。"""
    return ChatService(user_id=user.id, kb_root=user.kb_path, db=db)

def get_capture_service(user=Depends(get_current_user)) -> CaptureService:
    """注入 CaptureService。"""
    return CaptureService(user_id=user.id, kb_root=user.kb_path)

def get_search_service(user=Depends(get_current_user)) -> SearchService:
    """注入 SearchService。"""
    return SearchService(user_id=user.id, kb_root=user.kb_path)
```

---

## 5. Agent Layer 设计

### 5.1 Agent 客户端

```python
# app/agent/client.py

from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, create_sdk_mcp_server
from app.agent.tools import create_tools

class KnovanaAgent:
    """Claude Agent SDK 封装。

    职责：
    - 管理 Agent 生命周期
    - 注册 MCP Tools
    - 提供流式和非流式调用接口
    """

    def __init__(self, user_id: str, kb_root: str):
        self.user_id = user_id
        self.kb_root = kb_root

    def _create_options(self, system_prompt: str) -> ClaudeAgentOptions:
        tools = create_tools(self.kb_root)
        server = create_sdk_mcp_server(
            name="knovana",
            version="1.0.0",
            tools=tools,
        )
        tool_names = [f"mcp__knovana__{t.name}" for t in tools]

        return ClaudeAgentOptions(
            system_prompt=system_prompt,
            mcp_servers={"knovana": server},
            allowed_tools=tool_names,
            cwd=self.kb_root,
        )

    async def chat(self, message: str, system_prompt: str):
        """流式对话。yield 文本片段。"""
        options = self._create_options(system_prompt)
        async with ClaudeSDKClient(options=options) as client:
            await client.query(message)
            async for msg in client.receive_response():
                if hasattr(msg, "content"):
                    for block in msg.content:
                        if hasattr(block, "text"):
                            yield block.text

    async def process(self, message: str, system_prompt: str) -> str:
        """非流式处理。返回完整文本。"""
        chunks = []
        async for chunk in self.chat(message, system_prompt):
            chunks.append(chunk)
        return "".join(chunks)
```

### 5.2 MCP Tools

每个 Tool 是一个独立模块。Tools 操作知识库文件系统，是 Agent 的「手」。

```python
# app/agent/tools/__init__.py

from .kb_save import save_to_kb
from .kb_read import read_kb
from .kb_update import update_kb
from .kb_search import search_kb
from .kb_list import list_kb
from .kb_delete import delete_kb
from .tag_manager import tag_manager
from .attachment_manager import manage_attachment

def create_tools(kb_root: str) -> list:
    """创建所有 MCP Tools。"""
    return [
        save_to_kb,
        read_kb,
        update_kb,
        search_kb,
        list_kb,
        delete_kb,
        tag_manager,
        manage_attachment,
    ]
```

```python
# app/agent/tools/kb_save.py

from claude_agent_sdk import tool

@tool(
    name="save_to_kb",
    description="""保存内容到知识库。创建 Obsidian 格式的 Markdown 文件。
    如果有附件（图片等），保存到 assets 子目录并在 Markdown 中引用。
    返回保存的文件路径。""",
    parameters={
        "title": str,
        "content": str,
        "tags": list,
        "source_url": str,
        "category": str,       # inbox | topics | daily
        "sub_category": str,   # topics 下的子目录（可选）
        "attachments": list,   # [{"url": "", "name": "", "description": ""}]
    },
)
async def save_to_kb(args: dict):
    # 实际文件操作逻辑
    # 1. 生成文件名 slug
    # 2. 处理附件下载
    # 3. 生成 YAML frontmatter
    # 4. 写入 Markdown 文件
    # 5. 更新索引
    ...
    return {"content": [{"type": "text", "text": f"已保存: {file_path}"}]}
```

### 5.3 System Prompts

```python
# app/agent/prompts/chat.py

CHAT_SYSTEM_PROMPT = """你是 Knovana 知识管理助手。

你可以使用以下工具来操作用户的知识库：
- save_to_kb: 保存内容到知识库
- read_kb: 读取知识条目
- search_kb: 搜索知识库
- list_kb: 列出知识条目
- tag_manager: 管理标签

知识库使用 Obsidian 格式的 Markdown 文件。每个条目包含 YAML frontmatter
（title, source, tags, captured_at, type）和 Markdown 正文。

工作原则：
1. 保存前为内容生成合适的标题和标签
2. 整理内容为结构化的 Markdown
3. 回答问题时先搜索知识库，结合已有知识回答
4. 回答中注明信息来源
5. 图片附件使用相对路径引用: ![描述](assets/filename.png)
"""
```

---

## 6. Storage Layer 设计

### 6.1 Repository 模式

```python
# app/storage/repositories/session_repo.py

import sqlite3
from app.models.session import ChatSession

class SessionRepository:
    """会话数据存取。纯数据访问，不含业务逻辑。"""

    def __init__(self, db: sqlite3.Connection):
        self.db = db

    def create(self, session_id: str, user_id: str, context: dict | None = None) -> ChatSession:
        self.db.execute(
            "INSERT INTO chat_sessions (id, user_id, context) VALUES (?, ?, ?)",
            (session_id, user_id, json.dumps(context) if context else None),
        )
        self.db.commit()
        return self.get(session_id)

    def get(self, session_id: str) -> ChatSession | None:
        row = self.db.execute(
            "SELECT * FROM chat_sessions WHERE id = ?", (session_id,)
        ).fetchone()
        return ChatSession.from_row(row) if row else None

    def list_by_user(self, user_id: str, page: int, per_page: int) -> list[ChatSession]:
        offset = (page - 1) * per_page
        rows = self.db.execute(
            "SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?",
            (user_id, per_page, offset),
        ).fetchall()
        return [ChatSession.from_row(r) for r in rows]

    def delete(self, session_id: str) -> None:
        self.db.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
        self.db.commit()
```

### 6.2 知识库文件操作

```python
# app/storage/knowledge/file_ops.py

from pathlib import Path
from app.storage.knowledge.frontmatter import parse_frontmatter, generate_frontmatter
from app.models.knowledge import KnowledgeEntry

class KnowledgeFileOps:
    """知识库文件系统操作。"""

    def __init__(self, kb_root: str):
        self.root = Path(kb_root)

    def save_entry(self, entry: KnowledgeEntry) -> str:
        """保存知识条目为 Markdown 文件。"""
        dir_path = self.root / entry.category
        if entry.attachments:
            # 有附件：创建目录 + index.md + assets/
            entry_dir = dir_path / entry.slug
            entry_dir.mkdir(parents=True, exist_ok=True)
            (entry_dir / "assets").mkdir(exist_ok=True)
            file_path = entry_dir / "index.md"
        else:
            # 无附件：单文件
            dir_path.mkdir(parents=True, exist_ok=True)
            file_path = dir_path / f"{entry.slug}.md"

        content = generate_frontmatter(entry) + "\n" + entry.content
        file_path.write_text(content, encoding="utf-8")
        return str(file_path.relative_to(self.root))

    def read_entry(self, entry_id: str) -> KnowledgeEntry:
        """读取知识条目。entry_id 是相对路径。"""
        path = self.root / entry_id
        if path.is_dir():
            path = path / "index.md"
        elif not path.suffix:
            path = path.with_suffix(".md")

        text = path.read_text(encoding="utf-8")
        meta, content = parse_frontmatter(text)
        return KnowledgeEntry.from_parsed(entry_id, meta, content, path)

    def delete_entry(self, entry_id: str) -> None:
        """删除知识条目（含附件目录）。"""
        path = self.root / entry_id
        if path.is_dir():
            import shutil
            shutil.rmtree(path)
        else:
            md_path = path.with_suffix(".md") if not path.suffix else path
            md_path.unlink(missing_ok=True)
```

---

## 7. 错误处理

```python
# app/utils/errors.py

class KnovanaError(Exception):
    """基础异常。"""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status: int = 500):
        self.message = message
        self.code = code
        self.status = status

class NotFoundError(KnovanaError):
    def __init__(self, resource: str, id: str):
        super().__init__(f"{resource} not found: {id}", "NOT_FOUND", 404)

class AuthError(KnovanaError):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, "UNAUTHORIZED", 401)

class AgentError(KnovanaError):
    def __init__(self, message: str):
        super().__init__(message, "AGENT_ERROR", 503)
```

```python
# app/api/middleware.py — 全局异常处理

from fastapi import Request
from fastapi.responses import JSONResponse
from app.utils.errors import KnovanaError

async def error_handler(request: Request, exc: KnovanaError):
    return JSONResponse(
        status_code=exc.status,
        content={"error": {"code": exc.code, "message": exc.message}},
    )
```

---

## 8. 配置管理

```python
# app/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ── 应用 ──
    app_name: str = "Knovana"
    debug: bool = False

    # ── 服务 ──
    host: str = "0.0.0.0"
    port: int = 8000

    # ── 认证 ──
    jwt_secret: str = "change-me-in-production"
    jwt_expire_days: int = 30

    # ── 数据库 ──
    db_path: str = "data/knovana.db"

    # ── 知识库 ──
    kb_root: str = "knowledge-base"

    # ── Claude Agent ──
    anthropic_api_key: str = ""

    # ── CORS ──
    cors_origins: list[str] = [
        "chrome-extension://*",
        "http://localhost:*",
        "http://localhost:3000",    # 未来 Web 前端
    ]

    class Config:
        env_file = ".env"
        env_prefix = "KNOVANA_"

settings = Settings()
```

---

## 9. 部署

### 9.1 本地开发

```bash
# 安装依赖
pip install -r requirements.txt

# 配置
cp .env.example .env
# 编辑 .env 填入 ANTHROPIC_API_KEY

# 启动
python main.py
# 或
uvicorn main:app --reload --port 8000
```

### 9.2 Docker

```dockerfile
FROM python:3.12-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends grep && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/data /app/knowledge-base

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml

services:
  knovana:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./knowledge-base:/app/knowledge-base
    env_file:
      - .env
    restart: unless-stopped
```

---

## 10. 可扩展性考量

| 扩展场景 | 实现方式 |
|----------|----------|
| **新增 API 端点** | 在 `api/routes/` 下新增路由文件，在 `router.py` 注册 |
| **新增业务逻辑** | 在 `services/` 下新增 Service 类，通过依赖注入提供给 API |
| **新增 AI 能力** | 在 `agent/tools/` 下新增 MCP Tool |
| **新增客户端** | 直接消费现有 API，无需改后端 |
| **替换数据库** | 只需替换 `storage/repositories/` 下的实现 |
| **替换 LLM** | 修改 `agent/client.py`，Service 层无感知 |
| **新增存储后端** | 在 `storage/` 下新增实现，Repository 接口不变 |
