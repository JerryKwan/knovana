# Knovana 开发者指南 (Knovana Development Guide)

本文档旨在为 Knovana 项目的开发者提供完整的本地开发、配置、编译和调试指南。项目包含三个主要模块：
1. **`backend`**：后端服务，基于 Node.js + TypeScript + Hono + SQLite 构建，提供知识管理 API 和 AI Agent 能力。
2. **`dashboard`**：控制台前端，基于 Svelte 5 + Vite 构建，用于账户注册、激活审批、API 密钥管理及知识库查阅。
3. **`chrome-extension`**：浏览器捕获扩展，基于 WXT (Web Extension Framework) + Svelte 构建，用于高亮划词、页面剪辑捕获并发送至后端。

---

## 1. 基础开发环境要求

- **Node.js**: 建议使用 `v20.x` 或更新的 LTS 版本。
- **pnpm**: 本项目统一采用 `pnpm` 作为包管理器（推荐使用 `v8.x` 或 `v9.x`）。
- **OS 环境**: 本指南命令与运行习惯均适配 **Windows PowerShell**，其他类 Unix 系统（Mac/Linux）基本通用。

---

## 2. 核心模块开发指南

### 2.1 后端服务 (`backend`)

后端是项目的核心数据与逻辑枢纽，负责与 SQLite 数据库交互，并通过 AI SDK 对接大语言模型（如 Claude）。

#### 2.1.1 配置文件与初始化

首次运行时，需复制并配置环境变量文件：
1. 复制模板：
   ```powershell
   cd backend
   Copy-Item .env.example .env
   ```
2. 编辑 `.env` 文件，根据本地实际情况配置参数：
   - **大模型 API Key**：配置 `ANTHROPIC_API_KEY` 以启用 AI 智能体功能。
   - **管理员账号（配置同步）**：
     ```env
     KNOVANA_ADMIN_USERNAME=admin
     KNOVANA_ADMIN_PASSWORD=admin-password-123456
     ```
     *注：系统在启动时（数据库执行 Migrations 阶段）会自动将该管理员账户同步至 SQLite 数据库中。若修改了此配置，下次启动时数据库中的管理员密码将自动通过 bcrypt 重新哈希对齐。*

#### 2.1.2 编译与运行

在 `backend` 目录下：
- **开发运行（热重载）**：
  ```powershell
  pnpm dev
  ```
  该命令会启动 `tsx watch` 监听后端 `src/` 源码更改。默认服务监听在 `http://127.0.0.1:8000`。
- **项目一键构建**：
  ```powershell
  pnpm build
  ```
  该命令是一个**组合脚本**（业界最佳实践），它会先编译前端 `dashboard` 模块，并将其制品拷贝到后端的静态托管目录 `backend/public/dashboard` 下，随后通过 `tsc` 将后端的 TypeScript 代码编译为 JavaScript 存放在 `backend/dist` 中。
- **启动生产服务**：
  ```powershell
  pnpm start
  ```

#### 2.1.3 调试与测试

- **执行单元与集成测试**：
  ```powershell
  pnpm test
  ```
  后端采用 `vitest` 进行测试。包含 `dashboard-integration.test.ts` 全流程集成测试（覆盖注册、待激活阻断、管理员激活、密钥管理等）。
- **代码格式化**：
  ```powershell
  pnpm format
  ```
- **Lint 校验**：
  ```powershell
  pnpm lint
  ```
- **类型检查**：
  ```powershell
  pnpm check
  ```

---

### 2.2 控制台前端 (`dashboard`)

控制台是为普通用户与管理员设计的 Web 管理台。主要功能包括：注册登录、审批（管理员激活用户）、密钥管理、知识库查阅。

#### 2.2.1 架构设计

- **框架**：**Svelte 5** 响应式框架，代码逻辑高度聚合，状态控制使用全新的 Runes 机制（`$state`、`$derived`、`$props`）。
- **主题风格**：**高端拟物纸质风格（Premium Paper-like）**。底色采用象牙白/暖米黄（`#fbfaf7`），搭配炭墨黑文字，辅以 Lora/Georgia Serif 衬线体标题与 Sage/Ochre 矿物点缀色。
- **路由**：使用哈希路由（`#/login`、`#/keys` 等），完全免除后端路由配置的烦恼。
- **本地开发代理**：开发环境会自动侦测运行状态，向 `http://127.0.0.1:8000` 的后端 API 发送请求；生产打包后则通过相对路径直接请求同源 API。

#### 2.2.2 编译与运行

在 `dashboard` 目录下：
- **启动本地热重载开发服务器**：
  ```powershell
  pnpm dev
  ```
  访问地址一般为 `http://localhost:5173`。
- **打包编译**：
  ```powershell
  pnpm build
  ```
  编译出的制品会自动写入 `backend/public/dashboard`。
- **TypeScript & Svelte 类型检查**：
  ```powershell
  pnpm check
  ```

#### 2.2.3 本地开发调试与跨域联调 (CORS)

由于控制台前端在开发环境 (`pnpm dev`) 下运行在 Vite 开发服务器的 `http://localhost:5173` 端口上，而后端服务运行在 `http://localhost:8000`，跨端口请求属于**跨域请求**。Knovana 通过以下机制实现了无缝的本地跨域调试：

1. **前端 API 地址动态切换**：
   - 核心代码位于 [api.ts](file:///c:/Home/MyProjects/Knovana/dashboard/src/lib/api.ts) 中：
     ```typescript
     const DEV_API_URL = "http://localhost:8000";
     export const getBaseUrl = (): string => {
       if (import.meta.env.DEV) {
         return DEV_API_URL; // 开发环境下自动指向后端端口 8000
       }
       return window.location.origin; // 生产环境同源托管，通过 /dashboard/ 访问
     };
     ```
   - 当我们在 `dashboard` 下运行 `pnpm dev` 进行前端调试时，Vite 的 `import.meta.env.DEV` 变量为 `true`，所有的 API 请求会自动定向到本地后端服务。

2. **后端默认开启本地 CORS 信任**：
   - 后端 [config.ts](file:///c:/Home/MyProjects/Knovana/backend/src/config.ts) 中，环境变量 `KNOVANA_CORS_ORIGINS` 默认配置为：
     `chrome-extension://*,http://localhost:*,http://127.0.0.1:*`
   - 当启动后端时，Hono CORS 中间件会自动允许来自本地任意端口的跨域请求。因此，无需在 Vite 中配置复杂的代理服务（Proxy），直接启动后端服务（`port: 8000`）和前端开发服务（`port: 5173`），即可在浏览器开发者工具中直接进行网络联调与断点调试。

---

### 2.3 浏览器插件 (`chrome-extension`)

插件用于在日常阅读和工作网页时快速摘录、保存内容。

#### 2.3.1 架构设计

- **框架**：**WXT (Web Extension Framework) + Svelte**。
- **特性**：
  - 采用 **Side Panel (侧边栏) 优先** 策略，替代传统的弹窗 (Popup)。
  - 右键菜单联动，用户在网页内划词右键，能一键触发发送动作。
  - 通过 API 密钥与后端进行鉴权。

#### 2.3.2 编译与调试

在 `chrome-extension` 目录下：
- **启动开发模式**：
  ```powershell
  pnpm dev
  ```
  该命令会启动 WXT 开发环境并监听代码修改，生成用于开发的 Chrome MV3 产物至 `chrome-extension/.output/chrome-mv3`。
- **在 Chrome 浏览器中调试加载**：
  1. 访问 Chrome 插件页 `chrome://extensions/`。
  2. 开启右上角的 **开发者模式 (Developer mode)**。
  3. 点击 **加载已解压的扩展程序 (Load unpacked)**。
  4. 选择文件夹 `chrome-extension/.output/chrome-mv3` 加载插件。
  5. 可以在网页中按快捷键 `Alt + Q` 唤起侧边栏，或点击扩展栏中的 Knovana 图标进行侧栏配置与使用。
- **打包构建**：
  - 生成生产包：`pnpm build`
  - 自动打包成 `.zip` 压缩包：`pnpm zip`

#### 2.3.3 验证与测试

- **单元测试**：`pnpm test:unit`
- **代码校验与格式化**：
  ```powershell
  pnpm lint
  pnpm check
  pnpm format
  ```

---

## 3. 全局联合开发与典型调试链路

### 3.1 跨模块依赖自动安装
为了极佳的开发体验，在 `backend` 目录下执行依赖安装时，已配置了 `postinstall` 钩子：
```powershell
# 在 backend/ 目录下执行一次安装即可
pnpm install
```
这会**自动安装** `dashboard` 的依赖，无需手动进入 dashboard 进行重复安装。

### 3.2 账户权限调试全流程

本地联合调试账户体系及审批流时，推荐采用以下路径：

1. **环境就绪**：
   - 确保 `backend/.env` 中正确配置了管理员 `KNOVANA_ADMIN_USERNAME` 和 `KNOVANA_ADMIN_PASSWORD`。
   - 运行后端：`cd backend && pnpm dev`。
2. **注册普通账户**：
   - 访问控制台 `http://localhost:8000/dashboard/`。
   - 点击“注册新账号”，输入用户名（例如 `bob`）和密码注册。
   - 注册成功后返回登录，由于普通账号默认是 **未激活 (inactive)** 状态，系统将友好阻断并提示“账户待激活”。此时 Bob 无法浏览知识库和申请密钥。
3. **管理员激活审批**：
   - 使用配置的管理员账号登录控制台。
   - 管理员登录后，左侧菜单会多出“用户管理”一栏，点击进入。
   - 找到 Bob，点击“激活账户”按钮将状态更改为 `active`。
4. **用户正常使用**：
   - 切换登录回 Bob 的账户，此时阻断解除，可以正常查阅知识库。
   - 点击左侧“管理密钥”，生成一个新的 API Key，点击“复制密钥”妥善保存（注：明文密钥只会显示一次，刷新消失）。
5. **插件连通性测试**：
   - 加载编译好的浏览器插件，点击侧栏右上角“设置”按钮。
   - 后端 API 地址填写 `http://localhost:8000`，访问密钥填入上一步 Bob 复制的 API Key。
   - 划词保存，验证在控制台页面中可以实时拉取和显示该条笔记。
