# Prism Stream Protocol (PSP) v1

> 前后端流式通信协议规范 — 模型无关、可扩展、基于 SSE

---

## 1. 概述

PSP 定义了 Prism 系统中前后端之间的流式消息协议。协议基于 **Server-Sent Events (SSE)** 标准，借鉴 Claude API 的事件生命周期模型，同时针对 Prism 的 Agent 场景（服务端工具执行、结构化 UI 组件、瞬态状态提示）做了扩展。

**核心特性**

- **模型无关**：不引用任何特定 LLM 的私有概念，后端负责将各模型原始事件转换为统一 PSP 事件
- **统一生命周期**：所有内容块均遵循 `start → [delta × N] → stop` 生命周期；`stop` 始终携带完整内容块，`delta` 仅用于打字机等视觉增强效果
- **开放扩展**：新增内容类型只需定义新的 `content_block.type`；UI 组件通过 `widget` block + `widget_type` 无限扩展

```
┌──────────┐   POST /chat         ┌──────────┐
│  Client   │ ──────────────────→  │  Server  │
│ (Browser) │ ←── SSE Stream ───  │ (FastAPI)│
└──────────┘                      └──────────┘
```

---

## 2. 传输层

### Endpoint

```
POST {apiBaseUrl}/chat
```

### Request

```
Content-Type: application/json
```

```json
{
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" },
    { "role": "user", "content": "分析最近的销售数据" }
  ],
  "userId": "user_12345"
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `messages` | `Array<Message>` | Yes | 完整自然语言对话历史；不得由前端追加审批、问题回答或 Widget 动作 |
| `userId` | `string` | Yes | 用户唯一标识 |

### Response

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

每个 SSE 帧格式：

```
event: <event_type>\n
data: <json_object>\n
\n
```

`data` 中的 JSON 对象始终包含 `type` 字段，值与 SSE `event` 名称一致，便于序列化/反序列化时自描述。

---

## 3. 事件生命周期

```
message_start                                ← 消息开始，分配 ID
│
├── ping                                     ← 心跳（任意位置）
├── status                                   ← 瞬态状态提示（任意位置）
│
├── content_block_start     (index: 0)       ← 内容块开始（骨架/类型声明）
│   ├── content_block_delta (index: 0) × N   ← 增量数据（可选，用于打字机效果）
│   └── content_block_stop  (index: 0)       ← 内容块结束（携带完整内容）
│
├── content_block_start     (index: 1)
│   └── content_block_stop  (index: 1)       ← 无 delta 的块（如工具结果、Widget）
│
├── ...更多内容块...
│
├── message_delta                            ← 消息级元数据（stop_reason, usage）
└── message_end                              ← 消息结束，流关闭
```

---

## 4. 内容块生命周期

所有内容块均遵循统一的三阶段生命周期：**`start → [delta × N] → stop`**。

```
start  →  "一个内容块来了，类型是 X"     →  初始化 UI 占位
delta  →  "增量片段，用于打字机效果"      →  实时更新 UI（可选消费）
stop   →  "完整内容，权威终版"           →  用 stop.content_block 渲染最终结果
```

**关键设计决策**：

- **`content_block_stop` 始终携带完整的 `content_block` 对象**，无论该块是否经历了 delta 阶段
- **`delta` 是纯视觉增强**：客户端可以完全不消费 delta（忽略打字机效果），仅靠 `start` + `stop` 即可获得完整的对话内容
- 流式块与非流式块的唯一区别是**是否存在 delta 事件**，客户端处理逻辑完全一致

### 4.1 `content_block_start` — 内容块开始

携带内容块的**骨架信息**（类型和关键元数据），用于前端初始化占位 UI。

```json
{
  "type": "content_block_start",
  "index": 0,
  "content_block": { "type": "<block_type>", ... }
}
```

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `index` | `number` | 该 block 在 `message.content[]` 数组中的位置 |
| `content_block.type` | `string` | 内容块类型（详见第 5 节） |

### 4.2 `content_block_delta` — 增量更新（可选）

仅在需要打字机效果时出现，可出现零次或多次。

```json
{
  "type": "content_block_delta",
  "index": 0,
  "delta": { "type": "<delta_type>", ... }
}
```

Delta 类型：

| `delta.type` | 对应内容块 | 字段 |
|:-------------|:----------|:-----|
| `text_delta` | `text` | `text: string` |
| `thinking_delta` | `thinking` | `text: string` |
| `input_json_delta` | `tool_call` | `partial_json: string` |

### 4.3 `content_block_stop` — 内容块结束

**始终携带完整的 `content_block` 对象**，这是该内容块的权威终版。

```json
{
  "type": "content_block_stop",
  "index": 0,
  "content_block": { "type": "<block_type>", ... }
}
```

客户端应以 `stop.content_block` 为最终数据源，而非 delta 的累积结果。

### 4.4 流式块 vs 非流式块

两者使用完全相同的事件结构，区别仅在于是否有 delta：

**流式块**（文本回复，带打字机效果）：

```
event: content_block_start
data: {"type":"content_block_start","index":0,
       "content_block":{"type":"text"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,
       "delta":{"type":"text_delta","text":"Based on"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,
       "delta":{"type":"text_delta","text":" the analysis..."}}

event: content_block_stop
data: {"type":"content_block_stop","index":0,
       "content_block":{"type":"text","text":"Based on the analysis..."}}
```

**非流式块**（工具结果，start 后直接 stop）：

```
event: content_block_start
data: {"type":"content_block_start","index":1,
       "content_block":{"type":"tool_result","tool_call_id":"tc_01"}}

event: content_block_stop
data: {"type":"content_block_stop","index":1,
       "content_block":{"type":"tool_result","tool_call_id":"tc_01",
         "status":"success","content":"Found 42 records..."}}
```

**客户端处理逻辑完全一致，无需区分两者。**

---

## 5. 内容块类型

### 5.1 `text` — 文本内容

最终文本回复，支持 Markdown。通常流式交付以实现打字机效果。

**`start` 骨架**：

```json
{ "type": "text" }
```

**`stop` 完整内容**：

```json
{ "type": "text", "text": "Based on the analysis, here are the key findings:\n\n1. **Revenue** increased by 15%..." }
```

**Delta**：`{"type": "text_delta", "text": "增量文本片段"}`

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `text` | `string` | Markdown 格式文本 |

---

### 5.2 `thinking` — 推理/思考

模型内部的推理过程，前端展示为可折叠的思考区域。可流式（实时转发模型 thinking）或非流式（后端汇总后推送）。

**`start` 骨架**：

```json
{ "type": "thinking" }
```

**`stop` 完整内容**：

```json
{ "type": "thinking", "text": "The user is asking about sales data. I should query the database for recent records." }
```

**Delta**：`{"type": "thinking_delta", "text": "增量文本片段"}`

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `text` | `string` | 思考过程文本 |

---

### 5.3 `tool_call` — 工具调用

Agent 发起的工具调用。可流式（参数逐步构建）或非流式（参数一次性给出）。

**`start` 骨架**：

```json
{ "type": "tool_call", "id": "tc_001", "name": "search_db", "input": {} }
```

**`stop` 完整内容**：

```json
{ "type": "tool_call", "id": "tc_001", "name": "search_db", "input": { "query": "sales Q4 2025" } }
```

**Delta**：`{"type": "input_json_delta", "partial_json": "{\"query\":"}`

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `id` | `string` | 工具调用唯一标识，用于与 `tool_result` 关联 |
| `name` | `string` | 工具名称 |
| `input` | `object` | 工具输入参数 |

---

### 5.4 `tool_result` — 工具执行结果

工具在服务端执行后的返回结果。通常非流式（start 后直接 stop）。

**`start` 骨架**：

```json
{ "type": "tool_result", "tool_call_id": "tc_001" }
```

**`stop` 完整内容**：

```json
{ "type": "tool_result", "tool_call_id": "tc_001", "status": "success", "content": "Found 42 records matching the query..." }
```

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `tool_call_id` | `string` | 对应的 `tool_call.id` |
| `status` | `"success" \| "error"` | 执行状态 |
| `content` | `string \| object` | 执行结果（字符串或结构化数据） |

---

### 5.5 `widget` — 结构化 UI 组件

开放的富内容容器，通过 `widget_type` 扩展。通常非流式。

**`start` 骨架**：

```json
{ "type": "widget", "widget_type": "chart" }
```

**`stop` 完整内容**：

```json
{
  "type": "widget",
  "widget_type": "chart",
  "data": {
    "chart_type": "bar",
    "title": "月度产量趋势",
    "chart_data": { ... }
  }
}
```

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `widget_type` | `string` | 组件类型标识，前端据此查找对应渲染器 |
| `data` | `object` | 渲染所需数据，结构由 `widget_type` 定义 |

协议不约束 `data` 的内部 schema，各 `widget_type` 自行定义。前端维护一个渲染器注册表，未知类型优雅降级为 JSON 展示。

#### `chart` — 数据图表

```json
{
  "type": "widget",
  "widget_type": "chart",
  "data": {
    "chart_type": "bar",
    "title": "月度产量趋势",
    "chart_data": {
      "categories": ["1月", "2月", "3月", "4月", "5月", "6月"],
      "series": [
        { "name": "纯碱", "data": [1200, 1350, 1280, 1420, 1380, 1450] },
        { "name": "烧碱", "data": [800, 920, 870, 950, 910, 980] }
      ]
    },
    "echarts_option": null
  }
}
```

Chart `data` 字段：

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `chart_type` | `string` | Yes | `"bar"` / `"line"` / `"pie"` / `"scatter"` / ... |
| `title` | `string` | No | 图表标题 |
| `chart_data` | `object` | No | 结构化数据（与 `echarts_option` 二选一） |
| `chart_data.categories` | `string[]` | No | X 轴类目（bar/line 必填，pie 不需要） |
| `chart_data.series` | `Array<Series>` | No | 数据系列 |
| `echarts_option` | `object` | No | 完整 ECharts option（优先级高于 `chart_data`） |

Series 对象：

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `name` | `string` | 系列名称 |
| `data` | `number[] \| Array<{name, value}>` | 数据。bar/line 用 `number[]`，pie 用 `{name, value}[]` |
| `type` | `string?` | 可选，覆盖系列级别图表类型（混合图表） |

饼图示例：

```json
{
  "type": "widget",
  "widget_type": "chart",
  "data": {
    "chart_type": "pie",
    "title": "产品结构占比",
    "chart_data": {
      "series": [{
        "name": "产品",
        "data": [
          { "name": "纯碱", "value": 45 },
          { "name": "烧碱", "value": 28 },
          { "name": "氯化铵", "value": 15 }
        ]
      }]
    }
  }
}
```

#### `svg` — 矢量图形

```json
{
  "type": "widget",
  "widget_type": "svg",
  "data": {
    "content": "<svg viewBox='0 0 400 300' xmlns='http://www.w3.org/2000/svg'>...</svg>",
    "alt": "流程示意图",
    "width": 400,
    "height": 300
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `content` | `string` | Yes | SVG 标记文本 |
| `alt` | `string` | No | 可访问性描述 |
| `width` | `number` | No | 建议渲染宽度（px） |
| `height` | `number` | No | 建议渲染高度（px） |

#### `table` — 结构化表格

```json
{
  "type": "widget",
  "widget_type": "table",
  "data": {
    "title": "Q4 销售明细",
    "columns": [
      { "key": "product", "label": "产品" },
      { "key": "amount",  "label": "销量", "align": "right" },
      { "key": "growth",  "label": "增长率", "align": "right" }
    ],
    "rows": [
      { "product": "纯碱", "amount": 1200, "growth": "15%" },
      { "product": "烧碱", "amount": 980,  "growth": "8%" }
    ]
  }
}
```

#### `image` — 图片引用

```json
{
  "type": "widget",
  "widget_type": "image",
  "data": {
    "url": "https://example.com/chart.png",
    "alt": "分析结果截图",
    "width": 600
  }
}
```

#### `confirm_modal` — 业务二次确认

业务 widget 内的简单二次确认面板。前端通过 `onAction(payload)` 交给外层 Chat 页面封装为 `control.widget_action`；不使用 `control.approval_response`。Agent 工具 / 命令执行审批统一使用 `approval_request`。

```json
{
  "type": "widget",
  "widget_type": "confirm_modal",
  "data": {
    "widget_id": "w_0a3c",
    "title": "重启 3 号空压机",
    "description": "该操作会短暂中断 AC-03 服务，并触发下游负载切换。",
    "risk_level": "high",
    "confirm_label": "确认重启",
    "cancel_label": "取消",
    "tool_call_id": "tc_001",
    "payload": { "device_id": "AC-03", "operation": "restart" },
    "expires_at": "2026-05-01T10:45:00"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `widget_id` | `string` | No | 组件实例 ID；缺省时前端可派生稳定 ID |
| `title` | `string` | Yes | 面向用户的确认标题 |
| `description` | `string` | Yes | 操作影响说明 |
| `risk_level` | `"low" \| "medium" \| "high"` | No | 风险等级，默认 `medium` |
| `confirm_label` | `string` | No | 批准按钮文案，默认“批准” |
| `cancel_label` | `string` | No | 拒绝按钮文案，默认“拒绝” |
| `tool_call_id` | `string` | No | 对应的 pending tool call |
| `payload` | `object` | No | 回传给 Agent Hook 的业务载荷 |
| `expires_at` | `string` | No | 服务器本地时间的 ISO 8601 字符串（naive，不带 `Z` / 时区后缀）；到期后前端触发 `timeout` 动作并关闭按钮 |

#### `approval_request` — 工具审批请求

标准 HITL（Human-in-the-Loop）审批组件，用于承载 Agent SDK `can_use_tool` 触发的工具审批请求。ActPilot 首版前端渲染为 `ApprovalRequestCard`，回传字段必须保持一致。

```json
{
  "type": "widget",
  "widget_type": "approval_request",
  "data": {
    "request_id": "apr_01",
    "tool_name": "Bash",
    "tool_input": {
      "command": "rm -rf /tmp/demo"
    },
    "risk_level": "high",
    "description": "Claude wants to run a shell command.",
    "suggestions": [
      {
        "type": "permission_update",
        "label": "本次会话内允许类似只读 Bash"
      }
    ],
    "expires_at": "2026-04-02T10:45:00"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `request_id` | `string` | Yes | 本次审批请求 ID，用于客户端回传与服务端续跑 |
| `tool_name` | `string` | Yes | Agent 请求调用的工具名称 |
| `tool_input` | `object` | Yes | 原始工具输入参数；前端展示时可做敏感字段遮蔽 |
| `risk_level` | `"low" \| "medium" \| "high"` | No | 风险等级，默认由后端策略决定 |
| `description` | `string` | No | 面向用户的审批说明 |
| `suggestions` | `Array<object>` | No | SDK 或权限策略给出的后续权限建议 |
| `expires_at` | `string` | No | 服务器本地时间的 ISO 8601 字符串（naive，不带 `Z` / 时区后缀）；过期后回传应返回错误 |

用户批准 / 拒绝不通过 SSE 返回，也不追加进 `messages[]`，而是通过 `PUT /api/v1/runs/{run_id}/interruptions/{request_id}/decision` 提交 `approval_response`，见 §11。

#### `question_request` — Agent 澄清问题

标准用户输入组件，用于承载 Claude Agent SDK `AskUserQuestion`。它与普通对话不同：Agent 当前执行暂停，等待用户选择或输入答案后续跑。

```json
{
  "type": "widget",
  "widget_type": "question_request",
  "data": {
    "request_id": "qus_01",
    "questions": [
      {
        "question_id": "format",
        "question": "How should I format the output?",
        "header": "Format",
        "options": [
          {
            "label": "Summary",
            "description": "Brief overview"
          },
          {
            "label": "Detailed",
            "description": "Full explanation"
          }
        ],
        "multiSelect": false,
        "allow_custom": true,
        "custom_placeholder": "Describe a different format",
        "allow_skip": true,
        "submit_label": "Submit",
        "skip_label": "Skip"
      }
    ]
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `request_id` | `string` | Yes | 本次提问请求 ID，用于客户端回传与服务端续跑 |
| `questions` | `Array<Question>` | Yes | 1–4 个问题，结构与 Agent SDK `AskUserQuestion` 对齐 |
| `questions[].question_id` | `string` | No | 稳定问题 ID；缺省时前端可回落使用 `question` 文本，但新实现应优先提供 |
| `questions[].question` | `string` | Yes | 完整问题文本 |
| `questions[].header` | `string` | No | 短标题，建议不超过 12 个字符 |
| `questions[].options` | `Array<Option>` | Yes | 2–4 个候选项 |
| `questions[].options[].label` | `string` | Yes | 候选项标签，回传时作为答案值 |
| `questions[].options[].description` | `string` | No | 候选项说明 |
| `questions[].options[].preview` | `string` | No | 可选预览内容，格式由后端配置决定（如 Markdown / HTML 片段） |
| `questions[].multiSelect` | `boolean` | No | 是否允许多选，默认 `false` |
| `questions[].allow_custom` | `boolean` | No | 是否允许用户输入自定义答案，默认 `false` |
| `questions[].custom_placeholder` | `string` | No | 自定义输入占位文本 |
| `questions[].allow_skip` | `boolean` | No | 是否允许跳过本次提问，默认 `false` |
| `questions[].submit_label` | `string` | No | 提交按钮文案，默认“提交” |
| `questions[].skip_label` | `string` | No | 跳过按钮文案，默认“跳过” |
| `questions[].preview` | `string` | No | 问题级预览内容，前端可按组件能力选择展示或忽略 |

客户端可额外提供“其它”自由文本输入。回传时使用用户输入的实际文本，不回传“其它”这个标签。

#### `info_card` — 信息卡片

用于承载简短结论、状态摘要、告警说明或只读业务提示。它不表达跳转，也不表达可执行审批；若卡片内有按钮，统一走 `control.widget_action`。

```json
{
  "type": "widget",
  "widget_type": "info_card",
  "data": {
    "widget_id": "info_01",
    "title": "巡检结果",
    "summary": "3 个站点存在待处理告警。",
    "severity": "warning",
    "fields": [
      { "label": "最高级别", "value": "二级告警" },
      { "label": "更新时间", "value": "2026-05-01 10:30" }
    ]
  }
}
```

#### `link_card` — 受控跳转卡片

用于展示“可打开其它系统 / 其它页面”的结果。前端必须显式展示目标系统名与域名；外部 URL 必须是 HTTPS 且通过部署侧 allowlist 校验。内部 ActPilot 路由使用 SPA 导航，外部系统由用户点击后离开或打开新上下文，禁止自动跳转。

```json
{
  "type": "widget",
  "widget_type": "link_card",
  "data": {
    "widget_id": "link_01",
    "title": "查看工单详情",
    "description": "跳转到 ITSM 查看完整处理记录。",
    "target": {
      "kind": "external_url",
      "system": "ITSM",
      "url": "https://itsm.example.com/tickets/INC-1024",
      "display_host": "itsm.example.com"
    },
    "action_label": "打开 ITSM"
  }
}
```

#### `entity_card` — 业务实体卡片

中性的状态型业务对象卡片。不要使用 `device_card` 这类限定场景的命名；设备、工单、客户、合同、告警、报表对象等都通过 `entity_type` 区分。实体卡只展示对象状态和可选动作，动作统一走 `control.widget_action`。

```json
{
  "type": "widget",
  "widget_type": "entity_card",
  "data": {
    "widget_id": "ent_01",
    "entity_type": "device",
    "entity_id": "AC-03",
    "title": "3 号空压机",
    "subtitle": "一厂 · 空压站",
    "status": {
      "label": "告警",
      "tone": "warning"
    },
    "metrics": [
      { "label": "压力", "value": "0.72 MPa" },
      { "label": "温度", "value": "68°C" }
    ],
    "actions": [
      { "id": "view_detail", "label": "查看详情" },
      { "id": "create_ticket", "label": "创建工单" }
    ]
  }
}
```

#### 扩展新 Widget 类型

新增 Widget 类型无需修改协议，只需：

1. **后端**：在 content block 中使用新的 `widget_type` 值和对应的 `data` 结构
2. **前端**：在渲染器注册表中注册新的 Renderer 组件

```
Widget Renderer Registry
┌─────────────────────────────────┐
│  "chart"  →  ChartRenderer     │
│  "svg"    →  SvgRenderer       │
│  "table"  →  TableRenderer     │
│  "image"  →  ImageRenderer     │
│  "confirm_modal" → ConfirmModal │
│  "approval_request" → ApprovalRequestCard │
│  "question_request" → QuestionRequestCard │
│  "info_card" → InfoCard         │
│  "link_card" → LinkCard         │
│  "entity_card" → EntityCard     │
│  "*"      →  FallbackRenderer  │  ← 未知类型降级为 JSON
└─────────────────────────────────┘
```

---

## 6. 消息级事件

### 6.1 `message_start` — 消息开始

```json
{
  "type": "message_start",
  "message": {
    "id": "msg_a1b2c3d4",
    "run_id": "run_9z8y7x",
    "role": "assistant",
    "model": "claude-sonnet-4-20250514",
    "content": [],
    "created_at": "2026-04-02T10:30:00"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `message.id` | `string` | Yes | 服务端生成的消息唯一 ID |
| `message.run_id` | `string` | No | 本轮 Agent 运行 ID，用于后续取消、续跑、补充输入等控制操作 |
| `message.role` | `string` | Yes | 固定为 `"assistant"` |
| `message.model` | `string` | No | 实际使用的模型标识 |
| `message.content` | `[]` | Yes | 初始为空数组，由后续 content block 填充 |
| `message.created_at` | `string` | No | 服务器本地时间的 ISO 8601 字符串（naive，不带 `Z` / 时区后缀） |

### 6.2 `message_delta` — 消息级元数据

```json
{
  "type": "message_delta",
  "delta": {
    "stop_reason": "end_turn"
  },
  "usage": {
    "input_tokens": 256,
    "output_tokens": 1024
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `delta.stop_reason` | `string` | Yes | 开放字符串，推荐值见下表 |
| `usage` | `object` | No | Token 用量统计 |

推荐 `stop_reason`：

| 值 | 含义 |
|:---|:-----|
| `end_turn` | 正常完成本轮回复 |
| `max_tokens` | 触达模型输出 token 上限 |
| `error` | Agent 或后端执行异常 |
| `requires_approval` | 工具调用等待用户审批 |
| `requires_input` | Agent 等待用户补充结构化输入或澄清问题 |
| `cancelled` | 用户主动取消本轮运行 |
| `permission_denied` | 权限策略拒绝继续执行 |
| `max_turns` | Agent loop 达到最大轮次 |

### 6.3 `message_end` — 消息结束

```json
{
  "type": "message_end"
}
```

收到此事件后前端关闭流，将 `isGenerating` 置为 `false`。

---

## 7. 带外信号

带外事件不属于消息内容，用于 UI 提示和连接管理。

### 7.1 `status` — 瞬态状态提示

```json
{
  "type": "status",
  "text": "Thinking...",
  "indicator": "thinking"
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `text` | `string` | Yes | 状态描述文本 |
| `indicator` | `string` | No | UI 提示类别：`"thinking"` / `"tool"` / `"loading"` |

新 status 替换旧 status。`status` 属于**带外运行状态**，不是 `message.content` 的一部分；客户端可在内存中保留最近一条 status，直到收到下一条 status、`message_end`、`error`、主动取消或连接关闭。对于 assistant 消息，推荐将其呈现为贴附消息底边的弱化 `status rail`，避免与正文内容混淆；当用户已可读到稳定正文内容时，UI 可将 rail 短暂保留后自动淡出，待下一条 status 到来时再重新显示。

### 7.2 `error` — 结构化错误

`error` 对象通过 `type` 字段标识错误类别，便于客户端按类型做差异化处理。

```json
{
  "type": "error",
  "error": {
    "type": "agent_error",
    "message": "Connection timeout to database"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `error.type` | `string` | Yes | 错误类型标识（见下表） |
| `error.message` | `string` | Yes | 可读的错误描述 |
| `error.retryable` | `boolean` | No | 是否建议客户端重试，未提供时客户端按 `error.type` 自行判断 |

**预定义错误类型**

| `error.type` | 含义 | 默认 retryable |
|:-------------|:-----|:--------------:|
| `overloaded_error` | 服务过载 | Yes |
| `rate_limit_error` | 请求频率超限 | Yes |
| `auth_error` | 认证失败 | No |
| `agent_error` | Agent 执行异常（工具失败、上下文超限等） | No |
| `internal_error` | 服务端内部错误 | No |
| `timeout_error` | 请求或工具调用超时 | Yes |

实现约束：

- `error.message` 面向上层应用与最终用户，必须是稳定、可读、可本地化的文案；
- 后端日志可保留底层异常细节（如 SDK 超时、网络栈错误、第三方服务报错），但**不得**将原始异常字符串直接透传为 `error.message`；
- 对 Claude/模型运行时、工具执行器、数据库驱动等内部异常，服务端应先映射为合适的 `error.type` 与通用提示，再发给客户端。

客户端应能处理未知的 `error.type`，按通用错误展示。

### 7.3 `ping` — 心跳

```json
{
  "type": "ping"
}
```

---

## 8. 完整交互示例

### 8.1 典型 Agent 流程

```
Client                                                Server
  │                                                     │
  │  POST /api/chat                                     │
  │  { messages: [...], userId: "U-123" }               │
  │ ──────────────────────────────────────────────────→  │
  │                                                     │
  │  ← event: message_start                             │
  │    {message: {id:"msg_x7k", role:"assistant"}}      │
  │                                                     │
  │  ← event: status                                    │
  │    {text: "Thinking...", indicator: "thinking"}      │
  │                                                     │
  │  ← event: content_block_start  (index: 0)           │  ← 思考块（流式）
  │    {content_block: {type: "thinking"}}               │
  │  ← event: content_block_delta  (index: 0)  × N      │
  │    {delta: {type: "thinking_delta",                  │
  │      text: "Analyzing user request..."}}             │
  │  ← event: content_block_stop   (index: 0)           │
  │    {content_block: {type: "thinking",                │
  │      text: "Analyzing user request for..."}}         │
  │                                                     │
  │  ← event: status                                    │
  │    {text: "Calling search_db...", indicator: "tool"} │
  │                                                     │
  │  ← event: content_block_start  (index: 1)           │  ← 工具调用（非流式）
  │    {content_block: {type: "tool_call",               │
  │      id: "tc_01", name: "search_db", input: {}}}    │
  │  ← event: content_block_stop   (index: 1)           │
  │    {content_block: {type: "tool_call",               │
  │      id: "tc_01", name: "search_db",                │
  │      input: {query: "sales Q4 2025"}}}               │
  │                                                     │
  │  ← event: content_block_start  (index: 2)           │  ← 工具结果（非流式）
  │    {content_block: {type: "tool_result",             │
  │      tool_call_id: "tc_01"}}                         │
  │  ← event: content_block_stop   (index: 2)           │
  │    {content_block: {type: "tool_result",             │
  │      tool_call_id: "tc_01", status: "success",      │
  │      content: "Found 42 records..."}}                │
  │                                                     │
  │  ← event: content_block_start  (index: 3)           │  ← 图表 Widget（非流式）
  │    {content_block: {type: "widget",                  │
  │      widget_type: "chart"}}                          │
  │  ← event: content_block_stop   (index: 3)           │
  │    {content_block: {type: "widget",                  │
  │      widget_type: "chart",                           │
  │      data: {chart_type: "bar", ...}}}                │
  │                                                     │
  │  ← event: content_block_start  (index: 4)           │  ← 文本回复（流式打字机）
  │    {content_block: {type: "text"}}                   │
  │  ← event: content_block_delta  (index: 4)  × N      │
  │    {delta: {type: "text_delta",                      │
  │      text: "Based on the analysis..."}}              │
  │  ← event: content_block_stop   (index: 4)           │
  │    {content_block: {type: "text",                    │
  │      text: "Based on the analysis, here are..."}}    │
  │                                                     │
  │  ← event: message_delta                             │
  │    {delta: {stop_reason: "end_turn"},                │
  │     usage: {input_tokens: 256, output_tokens: 1024}}│
  │                                                     │
  │  ← event: message_end                               │
  │                                                     │
  │  [SSE connection closes]                            │
```

### 8.2 多轮工具调用

Agent 可进行多轮推理 + 工具调用，content block 按实际顺序递增 index：

```
message_start
  → thinking(0)     start → delta × N → stop   ← 初步分析
  → tool_call(1)    start → stop                ← 第一次工具调用
  → tool_result(2)  start → stop                ← 第一次结果
  → widget(3)       start → stop                ← 结果图表
  → thinking(4)     start → delta × N → stop   ← 进一步推理
  → tool_call(5)    start → stop                ← 第二次工具调用
  → tool_result(6)  start → stop                ← 第二次结果
  → widget(7)       start → stop                ← 新图表
  → text(8)         start → delta × N → stop   ← 最终回复（打字机）
message_delta
message_end
```

### 8.3 简单问答（无工具调用）

```
message_start
  → status("Thinking...")
  → text(0)         start → delta × N → stop   ← 直接流式输出回复
message_delta
message_end
```

### 8.4 错误场景

```
message_start
  → status("Thinking...")
  → thinking(0)     start → delta × N → stop
  → tool_call(1)    start → stop
  → error
    {error: {type: "agent_error", message: "Database timeout"}}
message_delta
  {stop_reason: "error"}
message_end
```

---

## 9. 客户端状态机

```
[idle]
  → message_start                    → [streaming]  创建空 assistant 消息

[streaming]
  → status                           → 更新 assistant 的带外状态提示（status rail）
  → content_block_start              → 按 type 初始化占位 UI
  → content_block_delta              → 追加增量到对应 block（打字机效果，可选）
  → content_block_stop               → 用 content_block 渲染最终内容
  → message_delta                    → 记录 stop_reason、usage
  → message_end                      → [idle]  isGenerating = false
  → error                            → 展示错误 UI，按 retryable 决定是否提供重试
  → ping                             → 重置超时计时器
```

---

## 10. 客户端实现参考

```javascript
function handleSSE(event) {
  const data = JSON.parse(event.data);

  switch (data.type) {
    // ── 消息生命周期 ──
    case 'message_start':
      createMessage(data.message);
      break;
    case 'message_delta':
      updateMeta(data.delta, data.usage);
      break;
    case 'message_end':
      finalizeMessage();
      break;

    // ── 内容块生命周期 ──
    case 'content_block_start':
      initPlaceholder(data.index, data.content_block.type);
      break;
    case 'content_block_delta':
      appendDelta(data.index, data.delta);       // 打字机效果（可选消费）
      break;
    case 'content_block_stop':
      renderFinalBlock(data.index, data.content_block);  // 权威终版
      break;

    // ── 带外信号 ──
    case 'status':
      showStatus(data.text, data.indicator);
      break;
    case 'error':
      handleError(data.error);
      break;
    case 'ping':
      resetTimeout();
      break;
  }
}
```

**最简客户端**（不需要打字机效果时，忽略 delta 即可）：

```javascript
function handleSSEMinimal(event) {
  const data = JSON.parse(event.data);
  if (data.type === 'content_block_stop') {
    renderFinalBlock(data.index, data.content_block);
  } else if (data.type === 'message_end') {
    finalizeMessage();
  }
}
```

---

## 11. 扩展性说明

### 新增内容块类型

定义新的 `content_block.type`（如 `"citation"`、`"file"`），前端通过 type 分发到对应渲染组件。未知 type 优雅降级为文本/JSON 展示。

### 新增 Widget 类型

在 `widget` block 下新增 `widget_type`，前端在渲染器注册表中注册对应组件。协议框架零改动。

### 多模态内容

图片、音频、视频等可通过新的 content block type 或 widget type 承载，`data` 中携带 URL 引用。

### 客户端控制回传与双向交互

PSP v1 的主通道仍是 `POST /chat` + SSE 单向响应。用户审批、问题回答、Widget 动作等客户端 → 服务端交互，不复用 `/chat`，而是通过独立的 run decision API 单向提交：

```text
PUT /api/v1/runs/{run_id}/interruptions/{request_id}/decision
```

`messages[]` 只承载自然语言对话历史；前端不得把审批、问题回答或 Widget 动作追加为新的 user message。后端收到 decision 后必须先从 Redis pending 上下文校验 `run_id`、`request_id`、会话、用户、TTL 与一次性消费语义，再唤醒原始 Agent run，并由后端生成历史展示 / PG 审计记录。

#### `control.approval_response`

对应 `widget(approval_request)`。

```json
{
  "approval_response": {
    "request_id": "apr_01",
    "approved": true,
    "updated_input": {
      "command": "ls /tmp/demo"
    },
    "message": "仅允许改为只读命令"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `request_id` | `string` | Yes | 对应 `approval_request.data.request_id` |
| `approved` | `boolean` | Yes | 是否批准执行 |
| `updated_input` | `object` | No | 批准时可替换工具输入；未提供则使用原始输入 |
| `message` | `string` | No | 拒绝原因或补充说明，Agent 可据此调整方案 |

#### `control.question_response`

对应 `widget(question_request)`。

```json
{
  "question_response": {
    "request_id": "qus_01",
    "answers": {
      "format": "Summary"
    },
    "skipped": false
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|:-----|:-----|:----:|:-----|
| `request_id` | `string` | Yes | 对应 `question_request.data.request_id` |
| `answers` | `Record<string, string \| string[]>` | No | key 优先为 `question_id`，缺省兼容原始 `question` 文本；value 为选择的 `label`、多选 label 数组或用户自由输入 |
| `skipped` | `boolean` | No | 用户是否跳过本次提问；为 `true` 时 `answers` 可为空 |

#### `control.widget_action`

业务 Widget 的通用动作回传，例如按钮点击、表单提交、卡片操作。它不承担 Agent SDK 原生审批 / 提问语义；后者应优先使用 `approval_response` / `question_response`。

```json
{
  "widget_action": {
    "widget_id": "wdg_01",
    "action": "submit",
    "payload": {
      "field": "value"
    }
  }
}
```

#### 运行中输入与控制

运行级控制基于 `message_start.message.run_id`。M0 已实现取消运行；追加输入保留协议草案，后续在支持 resumable run 后落地。

```text
POST /api/v1/runs/{run_id}/input
POST /api/v1/chat/runs/{run_id}/cancel
```

`POST /api/v1/chat/runs/{run_id}/cancel` 无请求体。后端在当前 worker 的 active run 表中按 `run_id` 与当前用户查找运行，找到后设置取消信号，底层 Claude SDK 收到 `interrupt`；响应：

```json
{ "status": "accepted" }
```

找不到运行、运行已结束、用户不匹配或跨 worker 不在本进程时返回 `404`。客户端收到 `accepted` 后可把本地 assistant turn 标记为 `cancelled`，原 `/chat` SSE 可能随后正常关闭或产出 `message_delta(stop_reason="cancelled")`，前端必须忽略已取消 turn 的迟到回调。

`POST /api/v1/runs/{run_id}/input` 预留用于运行中追加上下文或改方向，建议 payload：

```json
{
  "input": {
    "type": "text",
    "text": "改为只读检查，不执行写操作"
  },
  "mode": "append"
}
```

M0 不实现 append input。恢复语义：若原 `/chat` SSE 仍连接，输入应进入同一 Agent run；若连接已断开或 run 不在当前 worker，应返回 `404/409` 并要求客户端以新 `/chat` 轮次重发完整上下文。

---

## 12. 连接管理

| 行为 | 实现方式 |
|:-----|:---------|
| 取消请求 | `AbortController.abort()` → 后端检测断开后终止流 |
| 超时处理 | 客户端配置超时时间，结合 `ping` 心跳重置计时器 |
| 重连 | 无自动重连，用户可通过重新发送消息触发 |
| 错误恢复 | 收到 `error` 事件后按 `retryable` 决定是否重试 |

---

## 13. 版本管理

- 协议版本通过响应 Header `X-PSP-Version: 1` 标识
- 新增事件类型不视为破坏性变更，客户端应忽略未知事件
- 删除或修改已有事件结构视为破坏性变更，需递增主版本号
