# Chrome Extension Dev Guide

本文档说明 `chrome-extension/` 在开发环境下如何编译、加载和测试。命令默认在 Windows PowerShell 中执行。

## 环境准备

进入前端目录并安装依赖：

```powershell
cd chrome-extension
pnpm install
```

首次安装后，`postinstall` 会执行 `wxt prepare`，生成 WXT 所需的本地类型和临时配置。

## 开发环境编译

启动 WXT 开发编译：

```powershell
pnpm dev
```

该命令会监听源码变化，并输出 Chrome MV3 开发产物到：

```text
chrome-extension\.output\chrome-mv3
```

在 Chrome 中加载开发产物：

1. 打开 `chrome://extensions/`。
2. 开启开发者模式。
3. 点击“加载已解压的扩展程序”。
4. 选择 `chrome-extension\.output\chrome-mv3`。

## 打开和使用扩展

当前阶段是 **侧边栏优先**，没有浏览器 popup，也没有页面内浮动面板。因此加载扩展后，普通网页里不会自动出现可见入口。

可以通过以下方式打开：

1. 点击 Chrome 工具栏右侧的扩展图标按钮，找到 Knovana，并将它固定到工具栏。
2. 点击工具栏上的 Knovana 图标，打开 Chrome Side Panel。
3. 在网页中选中文本、右键页面/链接/图片，使用右键菜单中的 Knovana 动作。
4. 使用快捷键 `Alt+Q` 打开侧边栏；如果快捷键没有生效，到 `chrome://extensions/shortcuts` 检查是否被 Chrome 分配或被其他扩展占用。

设置入口：

1. 打开 Knovana Side Panel。
2. 点击右上角设置按钮，在侧边栏内配置后端地址、访问令牌、主题和自动打开侧栏。

Chrome 仍保留标准扩展选项入口，作为侧边栏之外的备用设置页：

1. 打开 `chrome://extensions/`。
2. 找到 Knovana。
3. 点击“详情”。
4. 点击“扩展程序选项”。

修改 Svelte 组件、样式或服务代码后，WXT 会自动重新编译。修改 `wxt.config.ts`、manifest 权限、background 入口或静态资源后，建议在 `chrome://extensions/` 中手动重新加载扩展。

## 生产构建

生成生产构建：

```powershell
pnpm build
```

构建产物同样位于：

```text
chrome-extension\.output\chrome-mv3
```

如需打包成扩展发布包：

```powershell
pnpm zip
```

Firefox 目标浏览器暂保留脚本入口：

```powershell
pnpm dev:firefox
pnpm build:firefox
pnpm zip:firefox
```

## 测试与检查

一次性运行单元测试：

```powershell
pnpm test:unit -- --run
```

开发时 watch 模式运行单元测试：

```powershell
pnpm test:unit
```

格式化当前前端项目：

```powershell
pnpm format
```

运行轻量 lint：

```powershell
pnpm lint
```

`lint` 当前包含 `prettier --check .` 和轻量 ESLint 推荐规则，不启用 type-aware lint。类型和 Svelte diagnostics 由 `check` 负责。

运行 Svelte/TypeScript 类型检查：

```powershell
pnpm check
```

建议提交前按以下顺序完整验证：

```powershell
pnpm test:unit -- --run
pnpm format
pnpm lint
pnpm check
pnpm build
```

如果 `pnpm format` 写入了修改，需要重新查看 diff，并根据修改内容重新运行相关测试。
