# Knovana - Claude SDK 外部 Session 存储与预热池设计说明

本项目在后端接入了 `@anthropic-ai/claude-agent-sdk`，利用其官方推荐的 **External Session Storage (外部会话存储)** 技术，将 Agent 会话的上下文件与运行现场持久化至本地 SQLite 数据库。

本文档详细记录了相关的存储设计、数据库表结构及后台预热池的实现逻辑。

---

## 1. 外部 Session 存储设计背景

根据 Claude Code SDK 规范，其内部在对话过程中产生的所有状态数据（包括用户消息、助理回复、各种 Tool 调用参数和输出结果、代码变更历史、内部控制标记等）全部在 SDK 层面以增量形式输出。

在启动 SDK 对话进程时，我们可以通过传入自定义的 `SessionStore` 接口实现。SDK 会在对话进行中以大约 `100ms` 的频度，调用 store 的 `append()` 方法向后端追加数据；在冷启动会话时，SDK 会通过 `load()` 提取所有已存在的 entries 并在后台还原 JSONL 现场文件，以此实现会话继续（Resume）。

---

## 2. 数据库表结构设计

我们使用 SQLite 保存会话 entries，具体对应的表为 `claude_session_entries`。

### SQL DDL 定义
在 [migrations.ts](file:///c:/Home/MyProjects/Knovana/backend/src/storage/migrations.ts) 中定义的表结构如下：

```sql
CREATE TABLE IF NOT EXISTS claude_session_entries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_key  TEXT NOT NULL,
  session_id   TEXT NOT NULL,
  subpath      TEXT,
  entry_uuid   TEXT UNIQUE,
  data         TEXT NOT NULL,
  created_at   TEXT DEFAULT (datetime('now'))
);
```

### 字段释义

| 字段名称 | 数据类型 | 字段说明 |
| :--- | :--- | :--- |
| `id` | `INTEGER` | 主键，自增。通过 `ORDER BY id ASC` 保证读取出的历史 entries 顺序和写入顺序严格一致。 |
| `project_key` | `TEXT` | **项目隔离键**。SDK 默认采用 CWD (当前工作目录) 的名字作为 `projectKey`。为在同一工作区支持原生多用户隔离，Knovana 在 [KnovanaSessionStore](file:///c:/Home/MyProjects/Knovana/backend/src/agent/session-store.ts) 中显式重写了此字段为当前用户的 `userId`。 |
| `session_id` | `TEXT` | **会话 ID**。对应于前端传入的会话唯一 ID (`sessionId`)。 |
| `subpath` | `TEXT` | **子会话路径标识**。用于指示主会话派生的子 Agent（如 Explore 任务等）的上下文存储。 |
| `entry_uuid` | `TEXT` | **幂等排重键**。大部分 SDK 写入的 entries 都附带 UUID，我们在表中配置了 `UNIQUE` 唯一性约束。插入时若产生冲突则自动更新原有记录，保障网络抖动或重试下的幂等性。 |
| `data` | `TEXT` | **状态包载荷**。将 SDK 吐出的 `SessionStoreEntry` POJO 对象直接序列化为 JSON 字符串存储。 |
| `created_at` | `TEXT` | 记录插入的 UTC 时间。 |

### 查询索引
为了优化还原会话（Resume）冷启动时的高频加载动作，我们配置了以 `project_key` 与 `session_id` 为联合条件的索引：

```sql
CREATE INDEX IF NOT EXISTS idx_claude_entries_lookup 
ON claude_session_entries(project_key, session_id);
```

---

## 3. 会话重置与清理规则

我们会在以下两种场景下对 `claude_session_entries` 进行清理：

1. **显式删除会话/删除消息**：
   - 当用户在前端点击删除某个 Message 时，为保持 SDK 运行时状态的准确性，后端会同时执行 `DELETE FROM claude_session_entries WHERE project_key = ? AND session_id = ?` 将当前会话的所有存储条目从数据库抹除。
   - 这样在下一次会话启动时，因为 store 中的 load 结果为 `null`，SDK 将会初始化为一个干净的、包含已修正后历史数据的全新冷启动会话。
2. **删除整个会话**：
   - 物理删除 `chat_sessions` 记录的同时，也会清除相关的 entries 记录，防止数据冗余。

---

## 4. 后台会话预热池 (`SessionWarmPool`)

由于 Claude Code Agent 的进程拉起涉及 MCP 注册和环境装载，存在一定延迟，我们在 [pool.ts](file:///c:/Home/MyProjects/Knovana/backend/src/agent/pool.ts) 中实现了一个专用的预热池技术：

- **会话绑定**：我们为每个 `userId:sessionId` 的组合分配并异步在后台预热一个 `WarmQuery` 实例，它已通过 `options.resume` 提前预加载了 `claude_session_entries` 中的状态。
- **自动消亡**：为防止后台僵尸进程消耗服务器 CPU 与内存，预热好的子进程如果在 `10 分钟` 内没有接收到用户的后续提问，将会触发超时定时器，自动调用 `warmQuery.close()` 关闭进程并从预热池中清除。
- **陈旧预热释放**：如果为该用户触发了新 Session 的 `prewarm`（比如用户中途切换了聊天会话），预热池会自动检测该用户其它 session 的后台进程并予以强制释放。此举在支撑多用户的环境下能够将后台闲置的 Agent 进程数量降到最低，保证了服务器的内存安全。
