# Knovana Backend — 详细设计

---

## 1. 定位与架构

Knovana Backend 是整个系统的 **核心平台**，为 Chrome 扩展、Web 前端、CLI 等客户端提供统一的 HTTP API。后端实现从 Python FastAPI 调整为 **Node.js + TypeScript + Hono**，Agent Runtime 调整为 **claude-agent-sdk-typescript**。

实现参考：

- Hono: https://github.com/honojs/hono
- Hono Node adapter: https://github.com/honojs/node-server
- Claude Agent SDK TypeScript: https://github.com/anthropics/claude-agent-sdk-typescript
- TypeScript Agent SDK 文档: https://platform.claude.com/docs/zh-CN/agent-sdk/typescript

### 1.1 四层架构

```
┌────────────────────────────────────────────────────────────┐
│                    API Layer (Hono)                        │
│                                                            │
│  路由定义 · Zod 请求/响应 Schema · 认证中间件 · SSE 流式   │
│  不含业务逻辑，仅做路由、校验和格式转换                     │
├────────────────────────────────────────────────────────────┤
│                    Service Layer (业务层)                  │
│                                                            │
│  ChatService · CaptureService · KnowledgeService           │
│  SearchService · UserService · TagService                  │
│                                                            │
│  业务编排 · 权限校验 · 数据组装                             │
│  纯 TypeScript，不依赖 Hono Context，可独立单元测试         │
├────────────────────────────────────────────────────────────┤
│                    Agent Layer (智能层)                    │
│                                                            │
│  @anthropic-ai/claude-agent-sdk + SDK MCP Tools            │
│  由 Service 层按需调用，非所有操作都需要 Agent             │
├────────────────────────────────────────────────────────────┤
│                    Storage Layer (存储层)                  │
│                                                            │
│  KnowledgeRepository · UserRepository · SessionRepository  │
│  FileStorage · SQLite                                      │
│                                                            │
│  Repository 模式，隔离存储细节                             │
└────────────────────────────────────────────────────────────┘
```

### 1.2 调用关系

```
Hono Route
  │
  └─► Service (业务逻辑)
        │
        ├─► Storage (直接读写数据) ──── 常规 CRUD
        │
        └─► Agent (需要 AI 能力时) ──── 摘要生成/文档生成/智能检索/对话
              │
              └─► SDK MCP Tools ─► Storage
```

**核心原则**：

- API 层调用 Service 层，不直接访问 Storage 或 Agent
- Service 层不接收 Hono `Context`，只接收普通类型参数
- Agent 通过 SDK MCP Tools 间接操作知识库文件系统
- Storage 层对上层透明，可替换 SQLite、文件系统或索引实现

---

## 2. 项目结构

```
backend/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
│
├── src/
│   ├── index.ts                    # Hono app 导出，供测试和部署复用
│   ├── server.ts                   # Node.js 入口，调用 @hono/node-server
│   ├── config.ts                   # 全局配置，解析环境变量
│   │
│   ├── api/                        # API Layer
│   │   ├── app.ts                  # basePath('/api')、中间件、路由注册
│   │   ├── env.ts                  # Hono Env/Variables 类型
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT 认证，写入 c.var.user
│   │   │   ├── error.ts            # 全局错误格式化
│   │   │   └── logger.ts           # 请求日志
│   │   └── routes/
│   │       ├── auth.ts             # /api/auth/*
│   │       ├── chat.ts             # /api/chat/*
│   │       ├── capture.ts          # /api/capture/*
│   │       ├── knowledge.ts        # /api/knowledge/*
│   │       ├── search.ts           # /api/search
│   │       ├── tags.ts             # /api/tags/*
│   │       └── settings.ts         # /api/settings
│   │
│   ├── services/                   # Service Layer
│   │   ├── chat-service.ts
│   │   ├── capture-service.ts
│   │   ├── knowledge-service.ts
│   │   ├── search-service.ts
│   │   ├── tag-service.ts
│   │   └── user-service.ts
│   │
│   ├── agent/                      # Agent Layer
│   │   ├── client.ts               # claude-agent-sdk-typescript 封装
│   │   ├── tools/
│   │   │   ├── index.ts
│   │   │   ├── kb-save.ts
│   │   │   ├── kb-read.ts
│   │   │   ├── kb-update.ts
│   │   │   ├── kb-search.ts
│   │   │   ├── kb-list.ts
│   │   │   ├── kb-delete.ts
│   │   │   ├── tag-manager.ts
│   │   │   └── attachment-manager.ts
│   │   └── prompts/
│   │       ├── chat.ts
│   │       ├── capture.ts
│   │       └── search.ts
│   │
│   ├── storage/                    # Storage Layer
│   │   ├── database.ts             # SQLite 连接管理
│   │   ├── migrations.ts           # Schema 迁移
│   │   ├── repositories/
│   │   │   ├── user-repo.ts
│   │   │   ├── session-repo.ts
│   │   │   └── message-repo.ts
│   │   └── knowledge/
│   │       ├── file-ops.ts         # Markdown 文件读写
│   │       ├── frontmatter.ts      # YAML frontmatter 解析/生成
│   │       ├── attachment.ts       # 附件管理
│   │       └── index.ts            # 索引缓存管理
│   │
│   ├── models/
│   │   ├── user.ts
│   │   ├── session.ts
│   │   ├── knowledge.ts
│   │   └── schemas/
│   │       ├── auth.ts
│   │       ├── chat.ts
│   │       ├── capture.ts
│   │       ├── knowledge.ts
│   │       └── common.ts
│   │
│   ├── auth/
│   │   ├── jwt.ts
│   │   └── password.ts
│   │
│   └── utils/
│       ├── slug.ts
│       ├── datetime.ts
│       └── errors.ts
│
├── tests/
│   ├── services/
│   ├── storage/
│   └── api/
│
├── knowledge-base/                 # 知识库根目录（运行时）
│   └── {user_id}/
│
└── data/
    └── knovana.db
```

---

## 3. Service Layer 设计

Service 层是业务逻辑核心。它使用 TypeScript class 或工厂函数组织业务，不依赖 Hono、HTTP 请求对象或响应对象。

### 3.1 KnowledgeService

知识库 CRUD 操作 **不经过 Agent**，直接操作文件系统和索引缓存。

```ts
// src/services/knowledge-service.ts

import type { KnowledgeEntry, KnowledgeListItem } from "../models/knowledge";
import { IndexManager } from "../storage/knowledge/index";
import { KnowledgeFileOps } from "../storage/knowledge/file-ops";

export type ListEntriesInput = {
  page?: number;
  perPage?: number;
  tags?: string[];
  category?: string;
  sortBy?: "created_at" | "updated_at" | "title";
};

export class KnowledgeService {
  constructor(
    private readonly fileOps: KnowledgeFileOps,
    private readonly index: IndexManager,
  ) {}

  async listEntries(input: ListEntriesInput = {}): Promise<{
    items: KnowledgeListItem[];
    total: number;
  }> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const entries = await this.index.getEntries({
      tags: input.tags,
      category: input.category,
      sortBy: input.sortBy ?? "created_at",
    });

    const start = (page - 1) * perPage;
    return {
      items: entries.slice(start, start + perPage),
      total: entries.length,
    };
  }

  async getEntry(entryId: string): Promise<KnowledgeEntry> {
    return this.fileOps.readEntry(entryId);
  }

  async createEntry(entry: KnowledgeEntry): Promise<string> {
    const path = await this.fileOps.saveEntry(entry);
    await this.index.addEntry(entry, path);
    return path;
  }

  async updateEntry(
    entryId: string,
    updates: Partial<KnowledgeEntry>,
  ): Promise<KnowledgeEntry> {
    const entry = await this.fileOps.updateEntry(entryId, updates);
    await this.index.updateEntry(entryId, entry);
    return entry;
  }

  async deleteEntry(entryId: string): Promise<void> {
    await this.fileOps.deleteEntry(entryId);
    await this.index.removeEntry(entryId);
  }

  getTags(): Promise<Array<{ name: string; count: number }>> {
    return this.index.getTags();
  }

  getStats(): Promise<Record<string, unknown>> {
    return this.index.getStats();
  }
}
```

### 3.2 CaptureService

内容捕获处理 **需要 Agent 参与**，用于摘要、文档生成、自动打标签和保存。

```ts
// src/services/capture-service.ts

import { KnovanaAgent } from "../agent/client";
import { CAPTURE_PROMPTS } from "../agent/prompts/capture";

export type CaptureInput = {
  action: "summarize" | "generate_doc" | "save";
  content?: string;
  imageUrl?: string;
  pageUrl?: string;
  pageTitle?: string;
};

export class CaptureService {
  constructor(private readonly agent: KnovanaAgent) {}

  async *process(input: CaptureInput): AsyncGenerator<string> {
    const instruction = this.buildInstruction(input);
    const prompt = CAPTURE_PROMPTS[input.action] ?? CAPTURE_PROMPTS.default;

    for await (const chunk of this.agent.chat(instruction, prompt)) {
      yield chunk;
    }
  }

  private buildInstruction(input: CaptureInput): string {
    const parts = [`操作: ${input.action}`];

    if (input.pageUrl) {
      parts.push(`来源页面: ${input.pageTitle ?? ""} (${input.pageUrl})`);
    }
    if (input.content) {
      parts.push(`内容:\n${input.content}`);
    }
    if (input.imageUrl) {
      parts.push(`图片 URL: ${input.imageUrl}`);
    }

    return parts.join("\n\n");
  }
}
```

### 3.3 ChatService

会话元数据由 Service 直接管理，AI 对话通过 Agent。

```ts
// src/services/chat-service.ts

import { randomUUID } from "node:crypto";
import { KnovanaAgent } from "../agent/client";
import { CHAT_SYSTEM_PROMPT } from "../agent/prompts/chat";
import { MessageRepository } from "../storage/repositories/message-repo";
import { SessionRepository } from "../storage/repositories/session-repo";

export type ChatInput = {
  message: string;
  sessionId?: string;
  context?: Record<string, unknown>;
};

export class ChatService {
  constructor(
    private readonly userId: string,
    private readonly sessionRepo: SessionRepository,
    private readonly messageRepo: MessageRepository,
    private readonly agent: KnovanaAgent,
  ) {}

  async *chat(input: ChatInput): AsyncGenerator<string> {
    const sessionId = input.sessionId ?? randomUUID();

    if (!input.sessionId) {
      await this.sessionRepo.create(sessionId, this.userId, input.context);
    }

    await this.messageRepo.create(sessionId, "user", input.message);

    const fullMessage = input.context
      ? this.injectContext(input.message, input.context)
      : input.message;

    const assistantChunks: string[] = [];
    for await (const chunk of this.agent.chat(
      fullMessage,
      CHAT_SYSTEM_PROMPT,
    )) {
      assistantChunks.push(chunk);
      yield chunk;
    }

    const fullResponse = assistantChunks.join("");
    await this.messageRepo.create(sessionId, "assistant", fullResponse);

    const session = await this.sessionRepo.get(sessionId);
    if (session && !session.title) {
      await this.sessionRepo.updateTitle(
        sessionId,
        fullResponse.slice(0, 50).trim(),
      );
    }
  }

  listSessions(page = 1, perPage = 20) {
    return this.sessionRepo.listByUser(this.userId, page, perPage);
  }

  getSession(sessionId: string) {
    return this.sessionRepo.getWithMessages(sessionId);
  }

  deleteSession(sessionId: string) {
    return this.sessionRepo.delete(sessionId);
  }

  private injectContext(
    message: string,
    context: Record<string, unknown>,
  ): string {
    const parts: string[] = [];
    if (context.page_url) {
      parts.push(`当前页面: ${context.page_title ?? ""} (${context.page_url})`);
    }
    if (context.selected_text) {
      parts.push(`用户选中的内容:\n${context.selected_text}`);
    }
    return parts.length > 0
      ? `${parts.join("\n")}\n\n用户消息: ${message}`
      : message;
  }
}
```

### 3.4 SearchService

快速搜索使用 `rg` 或 `grep`，智能搜索使用 Agent。

```ts
// src/services/search-service.ts

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { KnovanaAgent } from "../agent/client";
import { SEARCH_SYSTEM_PROMPT } from "../agent/prompts/search";

const execFileAsync = promisify(execFile);

export class SearchService {
  constructor(
    private readonly kbRoot: string,
    private readonly agent: KnovanaAgent,
  ) {}

  async quickSearch(
    query: string,
    maxResults = 20,
  ): Promise<Array<Record<string, unknown>>> {
    const { stdout } = await execFileAsync(
      "rg",
      ["--files-with-matches", "--glob", "*.md", query, this.kbRoot],
      { timeout: 10_000 },
    );

    return stdout
      .split("\n")
      .filter(Boolean)
      .slice(0, maxResults)
      .map((filepath) => this.parseMatch(filepath, query));
  }

  async smartSearch(queryText: string): Promise<string> {
    return this.agent.process(
      `在知识库中搜索与以下内容相关的知识: ${queryText}`,
      SEARCH_SYSTEM_PROMPT,
    );
  }

  private parseMatch(filepath: string, query: string): Record<string, unknown> {
    // 解析文件 frontmatter 获取元信息
    return { filepath, query };
  }
}
```

---

## 4. API Layer 设计

API 路由是薄壳，只做参数接收、校验、Service 调用和响应格式化。

### 4.1 应用入口和路由注册

```ts
// src/api/app.ts

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./env";
import { errorHandler } from "./middleware/error";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { chatRoutes } from "./routes/chat";
import { captureRoutes } from "./routes/capture";
import { knowledgeRoutes } from "./routes/knowledge";
import { searchRoutes } from "./routes/search";
import { settingsRoutes } from "./routes/settings";
import { tagsRoutes } from "./routes/tags";

export function createApp() {
  const app = new Hono<AppEnv>().basePath("/api");

  app.onError(errorHandler);
  app.use("*", cors());

  app.route("/auth", authRoutes);

  app.use("*", authMiddleware);
  app.route("/chat", chatRoutes);
  app.route("/capture", captureRoutes);
  app.route("/knowledge", knowledgeRoutes);
  app.route("/search", searchRoutes);
  app.route("/tags", tagsRoutes);
  app.route("/settings", settingsRoutes);

  return app;
}
```

```ts
// src/server.ts

import { serve } from "@hono/node-server";
import { config } from "./config";
import { createApp } from "./api/app";

const app = createApp();

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`Knovana API listening on http://localhost:${info.port}`);
  },
);
```

### 4.2 路由示例：Knowledge

```ts
// src/api/routes/knowledge.ts

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AppEnv } from "../env";
import {
  knowledgeListQuerySchema,
  knowledgeUpdateSchema,
} from "../../models/schemas/knowledge";
import { createKnowledgeService } from "../services";

export const knowledgeRoutes = new Hono<AppEnv>();

knowledgeRoutes.get(
  "/",
  zValidator("query", knowledgeListQuerySchema),
  async (c) => {
    const query = c.req.valid("query");
    const service = createKnowledgeService(c.var.user);
    const { items, total } = await service.listEntries({
      page: query.page,
      perPage: query.per_page,
      tags: query.tags?.split(","),
      category: query.category,
      sortBy: query.sort,
    });

    return c.json({
      entries: items,
      total,
      page: query.page,
      per_page: query.per_page,
    });
  },
);

knowledgeRoutes.get("/:entryId", async (c) => {
  const service = createKnowledgeService(c.var.user);
  const entryId = decodeURIComponent(c.req.param("entryId"));
  return c.json(await service.getEntry(entryId));
});

knowledgeRoutes.put(
  "/:entryId",
  zValidator("json", knowledgeUpdateSchema),
  async (c) => {
    const service = createKnowledgeService(c.var.user);
    const entryId = decodeURIComponent(c.req.param("entryId"));
    const updates = c.req.valid("json");
    const entry = await service.updateEntry(entryId, updates);
    return c.json({ id: entry.id, status: "updated" });
  },
);

knowledgeRoutes.delete("/:entryId", async (c) => {
  const service = createKnowledgeService(c.var.user);
  const entryId = decodeURIComponent(c.req.param("entryId"));
  await service.deleteEntry(entryId);
  return c.json({ status: "deleted" });
});
```

### 4.3 SSE 路由示例

```ts
// src/api/routes/chat.ts

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import type { AppEnv } from "../env";
import { chatRequestSchema } from "../../models/schemas/chat";
import { createChatService } from "../services";

export const chatRoutes = new Hono<AppEnv>();

chatRoutes.post("/", zValidator("json", chatRequestSchema), async (c) => {
  const input = c.req.valid("json");
  const service = createChatService(c.var.user);

  return streamSSE(c, async (stream) => {
    for await (const chunk of service.chat(input)) {
      await stream.writeSSE({ data: chunk });
    }
    await stream.writeSSE({ data: "[DONE]" });
  });
});
```

### 4.4 认证中间件

```ts
// src/api/middleware/auth.ts

import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { AuthError } from "../../utils/errors";
import { verifyToken } from "../../auth/jwt";
import { UserRepository } from "../../storage/repositories/user-repo";

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authorization = c.req.header("Authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;

  if (!token) {
    throw new AuthError("Missing bearer token");
  }

  const payload = await verifyToken(token);
  const user = await new UserRepository().findById(payload.sub);

  if (!user) {
    throw new AuthError("Invalid token user");
  }

  c.set("user", user);
  await next();
});
```

---

## 5. Agent Layer 设计

### 5.1 Agent 客户端

TypeScript Agent SDK 使用 `query()` 创建异步生成器，并通过 `createSdkMcpServer()` 在同一进程中注册 SDK MCP Tools。

```ts
// src/agent/client.ts

import {
  createSdkMcpServer,
  query,
  type SDKMessage,
} from "@anthropic-ai/claude-agent-sdk";
import { createTools } from "./tools";

export class KnovanaAgent {
  constructor(
    private readonly userId: string,
    private readonly kbRoot: string,
  ) {}

  async *chat(message: string, systemPrompt: string): AsyncGenerator<string> {
    const tools = createTools({ userId: this.userId, kbRoot: this.kbRoot });
    const mcpServer = createSdkMcpServer({
      name: "knovana",
      version: "1.0.0",
      tools,
    });

    const toolNames = tools.map((toolDef) => `mcp__knovana__${toolDef.name}`);

    const result = query({
      prompt: message,
      options: {
        cwd: this.kbRoot,
        systemPrompt,
        mcpServers: { knovana: mcpServer },
        allowedTools: toolNames,
        includePartialMessages: true,
        settingSources: [],
      },
    });

    for await (const msg of result) {
      for (const text of extractText(msg)) {
        yield text;
      }
    }
  }

  async process(message: string, systemPrompt: string): Promise<string> {
    const chunks: string[] = [];
    for await (const chunk of this.chat(message, systemPrompt)) {
      chunks.push(chunk);
    }
    return chunks.join("");
  }
}

function extractText(msg: SDKMessage): string[] {
  if (msg.type === "assistant") {
    return msg.message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text);
  }

  if (
    msg.type === "stream_event" &&
    msg.event.type === "content_block_delta" &&
    msg.event.delta.type === "text_delta"
  ) {
    return [msg.event.delta.text];
  }

  return [];
}
```

### 5.2 SDK MCP Tools

每个 Tool 是一个独立模块。Tools 操作知识库文件系统，是 Agent 的工具能力边界。

附件读取必须通过 `read_attachment` 形成受限预览，而不是让 Agent 直接全文解析上传文件。该工具对文本附件限制返回字符数；对 PDF、Word、PowerPoint、Excel 等文档附件使用 LiteParse 解析时固定只取前 3 页，用于知识条目摘要整理。限制只作用于暴露给 Agent 的文本预览，原始附件仍由 `save_to_kb` 完整归档到条目的 `assets/` 目录。

上传接口返回的 `path` 是后续流程唯一可信的临时附件路径，例如 `attachments/image-2.jpg`。客户端不得根据原始 URL 或原始文件名自行推断路径，因为后端会按真实文件系统冲突追加数字后缀。`ChatService` 在启动 Agent 前必须校验 `attachment` / `attachments[]` 中每个 `attachments/...` 文件都存在于当前用户的临时附件目录；`save_to_kb` 保存前也必须校验声明附件存在，避免生成断链知识条目。若 `save_to_kb` 已经把临时附件移动到目标条目的 `assets/`，后续对同一文件的 `attachment_manager import` 应视为幂等成功。

```ts
// src/agent/tools/index.ts

import type { SdkMcpToolDefinition } from "@anthropic-ai/claude-agent-sdk";
import { createDeleteKbTool } from "./kb-delete";
import { createListKbTool } from "./kb-list";
import { createReadKbTool } from "./kb-read";
import { createSaveToKbTool } from "./kb-save";
import { createSearchKbTool } from "./kb-search";
import { createUpdateKbTool } from "./kb-update";
import { createAttachmentManagerTool } from "./attachment-manager";
import { createTagManagerTool } from "./tag-manager";

export type ToolContext = {
  userId: string;
  kbRoot: string;
};

export function createTools(ctx: ToolContext): SdkMcpToolDefinition<any>[] {
  return [
    createSaveToKbTool(ctx),
    createReadKbTool(ctx),
    createUpdateKbTool(ctx),
    createSearchKbTool(ctx),
    createListKbTool(ctx),
    createDeleteKbTool(ctx),
    createTagManagerTool(ctx),
    createAttachmentManagerTool(ctx),
  ];
}
```

```ts
// src/agent/tools/kb-save.ts

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import type { ToolContext } from "./index";
import { KnowledgeFileOps } from "../../storage/knowledge/file-ops";

export function createSaveToKbTool(ctx: ToolContext) {
  return tool(
    "save_to_kb",
    "保存内容到知识库，创建 Obsidian 格式 Markdown 文件并更新索引。",
    {
      title: z.string(),
      content: z.string(),
      tags: z.array(z.string()).default([]),
      source_url: z.string().optional(),
      category: z.enum(["inbox", "topics", "daily"]).default("inbox"),
      sub_category: z.string().optional(),
      attachments: z
        .array(
          z.object({
            url: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
          }),
        )
        .default([]),
    },
    async (args) => {
      const fileOps = new KnowledgeFileOps(ctx.kbRoot);
      const filePath = await fileOps.saveGeneratedEntry(args);

      return {
        content: [
          {
            type: "text",
            text: `已保存: ${filePath}`,
          },
        ],
      };
    },
  );
}
```

### 5.3 System Prompts

```ts
// src/agent/prompts/chat.ts

export const CHAT_SYSTEM_PROMPT = `你是 Knovana 知识管理助手。

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
5. 附件使用条目本地相对路径引用: ![描述](assets/filename.png)。文件系统中尽量保留原始附件名；同名冲突使用 -2、-3 等数字后缀；Markdown 正文中包含空格或中文的附件路径可以使用 URL 编码形式。
`;
```

---

## 6. Storage Layer 设计

### 6.1 Repository 模式

```ts
// src/storage/repositories/session-repo.ts

import type Database from "better-sqlite3";
import type { ChatSession } from "../../models/session";

export class SessionRepository {
  constructor(private readonly db: Database.Database) {}

  create(
    sessionId: string,
    userId: string,
    context?: Record<string, unknown>,
  ): ChatSession {
    this.db
      .prepare(
        "INSERT INTO chat_sessions (id, user_id, context) VALUES (?, ?, ?)",
      )
      .run(sessionId, userId, context ? JSON.stringify(context) : null);

    return this.get(sessionId)!;
  }

  get(sessionId: string): ChatSession | null {
    const row = this.db
      .prepare("SELECT * FROM chat_sessions WHERE id = ?")
      .get(sessionId);

    return row ? toChatSession(row) : null;
  }

  listByUser(userId: string, page: number, perPage: number): ChatSession[] {
    const offset = (page - 1) * perPage;
    const rows = this.db
      .prepare(
        "SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?",
      )
      .all(userId, perPage, offset);

    return rows.map(toChatSession);
  }

  delete(sessionId: string): void {
    this.db.prepare("DELETE FROM chat_sessions WHERE id = ?").run(sessionId);
  }
}
```

### 6.2 知识库文件操作

```ts
// src/storage/knowledge/file-ops.ts

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import type { KnowledgeEntry } from "../../models/knowledge";
import { generateFrontmatter, parseFrontmatter } from "./frontmatter";

export class KnowledgeFileOps {
  constructor(private readonly root: string) {}

  async saveEntry(entry: KnowledgeEntry): Promise<string> {
    const baseDir = join(this.root, entry.category);
    const filePath = entry.attachments?.length
      ? join(baseDir, entry.slug, "index.md")
      : join(baseDir, `${entry.slug}.md`);

    await mkdir(dirname(filePath), { recursive: true });
    if (entry.attachments?.length) {
      await mkdir(join(dirname(filePath), "assets"), { recursive: true });
    }

    await writeFile(
      filePath,
      `${generateFrontmatter(entry)}\n${entry.content}`,
      "utf8",
    );

    return relative(this.root, filePath);
  }

  async readEntry(entryId: string): Promise<KnowledgeEntry> {
    const filePath = this.resolveEntryPath(entryId);
    const text = await readFile(filePath, "utf8");
    const { meta, content } = parseFrontmatter(text);
    return KnowledgeEntry.fromParsed(entryId, meta, content, filePath);
  }

  async deleteEntry(entryId: string): Promise<void> {
    await rm(this.resolveEntryPath(entryId), {
      recursive: true,
      force: true,
    });
  }

  private resolveEntryPath(entryId: string): string {
    return entryId.endsWith(".md")
      ? join(this.root, entryId)
      : join(this.root, `${entryId}.md`);
  }
}
```

---

## 7. 错误处理

```ts
// src/utils/errors.ts

export class KnovanaError extends Error {
  constructor(
    message: string,
    public readonly code = "INTERNAL_ERROR",
    public readonly status = 500,
  ) {
    super(message);
  }
}

export class NotFoundError extends KnovanaError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "NOT_FOUND", 404);
  }
}

export class AuthError extends KnovanaError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class AgentError extends KnovanaError {
  constructor(message: string) {
    super(message, "AGENT_ERROR", 503);
  }
}
```

```ts
// src/api/middleware/error.ts

import type { ErrorHandler } from "hono";
import { KnovanaError } from "../../utils/errors";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof KnovanaError) {
    return c.json(
      { error: { code: err.code, message: err.message } },
      err.status as never,
    );
  }

  console.error(err);
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    500,
  );
};
```

---

## 8. 配置管理

```ts
// src/config.ts

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  KNOVANA_HOST: z.string().default("0.0.0.0"),
  KNOVANA_PORT: z.coerce.number().int().positive().default(8000),
  KNOVANA_JWT_SECRET: z.string().default("change-me-in-production"),
  KNOVANA_JWT_EXPIRE_DAYS: z.coerce.number().int().positive().default(30),
  KNOVANA_DB_PATH: z.string().default("data/knovana.db"),
  KNOVANA_KB_ROOT: z.string().default("knowledge-base"),
  ANTHROPIC_API_KEY: z.string().optional(),
  KNOVANA_CORS_ORIGINS: z
    .string()
    .default("chrome-extension://*,http://localhost:*"),
});

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  host: env.KNOVANA_HOST,
  port: env.KNOVANA_PORT,
  jwtSecret: env.KNOVANA_JWT_SECRET,
  jwtExpireDays: env.KNOVANA_JWT_EXPIRE_DAYS,
  dbPath: env.KNOVANA_DB_PATH,
  kbRoot: env.KNOVANA_KB_ROOT,
  anthropicApiKey: env.ANTHROPIC_API_KEY,
  corsOrigins: env.KNOVANA_CORS_ORIGINS.split(",").map((origin) =>
    origin.trim(),
  ),
};
```

### 8.1 核心环境变量设置说明

以下是 `Knovana` 后端系统两个关键安全配置环境变量的详细设置与配置指引：

#### 1. `KNOVANA_JWT_SECRET` — JWT 签名秘钥

- **用途**: 用于对用户身份认证 Token (JSON Web Token) 进行签名与校验，防止客户端篡改凭证。
- **开发环境默认值**: `knovana-dev-local-secret-jwt-token-key-change-it`
- **生产环境要求**: **必须**更改为一个高强度的随机密钥。切勿将开发密钥提交到生产配置文件中。
- **推荐的密钥生成方式**:
  在终端中运行以下命令生成一个强随机的 Base64 字符串：
  ```bash
  # 在任何支持 OpenSSL 的系统中运行：
  openssl rand -base64 32
  ```
  将生成的输出值配置到 `.env` 中：
  ```env
  KNOVANA_JWT_SECRET=生成的超强密钥字符串
  ```

#### 2. `KNOVANA_CORS_ORIGINS` — 跨域源授权列表

- **用途**: 控制哪些前端域名或客户端环境可以跨域发起 API 请求，确保接口不会被非法第三方网页调用。
- **默认值**: `chrome-extension://*,http://localhost:*`
- **配置格式**: 以英文逗号 `,` 分隔的多个域名模式。支持使用星号 `*` 通配符。
- **具体配置场景**:
  - **浏览器扩展**: Chrome Extension 发起请求时会携带形如 `chrome-extension://<EXTENSION_ID>` 的 Origin。开发阶段为了兼容临时打包的 ID，可以使用 `chrome-extension://*` 进行授权。在上线生产前，应明确指明真实的扩展 ID：
    ```env
    KNOVANA_CORS_ORIGINS=chrome-extension://pblgijpdkmclfdh...
    ```
  - **Web/移动端调试**: 如果需要允许本地前端页面跨域调试，可以在后面追加本地调试端口：
    ```env
    KNOVANA_CORS_ORIGINS=chrome-extension://真实ID,http://localhost:5173,http://127.0.0.1:5173
    ```
  - **通用说明**: 跨域过滤器会自动解析并使用正则模糊匹配带 `*` 通配符的域名（如 `http://localhost:*` 将自动允许本地任意端口的 Web 服务跨域调用）。

---

## 9. 部署

### 9.1 本地开发

```bash
# 安装依赖
pnpm install

# 配置
cp .env.example .env
# 编辑 .env 填入 ANTHROPIC_API_KEY

# 启动
pnpm dev
```

推荐脚本：

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "test": "vitest run",
    "lint": "eslint ."
  }
}
```

核心依赖：

```bash
pnpm add hono @hono/node-server @hono/zod-validator zod @anthropic-ai/claude-agent-sdk better-sqlite3 gray-matter
pnpm add -D typescript tsx vitest @types/node
```

### 9.2 Docker

```dockerfile
FROM node:22-slim AS deps

WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-slim AS build

WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-slim AS runtime

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ripgrep \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN mkdir -p /app/data /app/knowledge-base

EXPOSE 8000
CMD ["node", "dist/server.js"]
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

| 扩展场景                   | 实现方式                                                      |
| -------------------------- | ------------------------------------------------------------- |
| **新增 API 端点**          | 在 `src/api/routes/` 下新增路由文件，在 `src/api/app.ts` 注册 |
| **新增业务逻辑**           | 在 `src/services/` 下新增 Service，保持不依赖 Hono Context    |
| **新增 AI 能力**           | 在 `src/agent/tools/` 下新增 SDK MCP Tool                     |
| **新增客户端**             | 直接消费现有 REST API，无需改后端                             |
| **替换数据库**             | 替换 `src/storage/repositories/` 下的实现                     |
| **替换 LLM/Agent Runtime** | 修改 `src/agent/client.ts`，Service 层无感知                  |
| **新增存储后端**           | 在 `src/storage/` 下新增实现，Repository 接口不变             |
