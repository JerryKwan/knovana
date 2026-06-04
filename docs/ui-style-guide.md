# Knovana UI 设计系统与风格指南 (UI Style Guide)

本文档旨在梳理和规范 Knovana 浏览器扩展系统的 UI 设计语言、色彩体系、组件布局与交互微动效。开发新组件或优化现有界面时，须严格遵守此风格指南，以维护全局视觉一致性与高品质学术质感。

---

## 1. 设计核心理念 (Design Philosophy)

Knovana 的核心定位是服务于**个人知识的搜集、积累与思考**。我们的 UI 设计脱离了传统高饱和度、高对比度的“冰冷蓝绿科技风”，转而拥抱一种**温暖学术手账/精装书籍**的视觉意境。

> **品牌 Slogan：** “积累有了归处，思想才能远行”

*   **纸质暖底 (Warm Paper Backdrop)**：浅色模式下采用低饱和的暖乳白色调，模拟高档图书纸张的触感，长期使用不易造成视觉疲劳。
*   **水墨深褐 (Academic Charcoal Ink)**：将核心主色升级为水墨深褐（Ink Espresso），文字、核心按钮与激活态均如同在温暖纸张上印刷的精致油墨。
*   **物理拟真 (Physical & Tactile)**：减少生硬的黑实线，运用卡片阴影（Soft Shadows）、胶囊滑动开关（Toggle Switch）和无边框一体化容器来呈现自然、优雅的层级感。

---

## 2. 配色系统 (Color Palette Tokens)

所有色彩通过 `CSS 变量` 动态管理，支持系统级的 **Light** 与 **Dark** 双色模式。

### 2.1 浅色模式 (Light Theme)

| CSS 变量 | 默认 Hex 色值 | 视觉用途描述 |
| :--- | :--- | :--- |
| `--kn-bg` | `#faf8f4` | 页面背景色（温暖乳白纸张底色） |
| `--kn-bg-raised` | `#fdfcf9` | 悬浮卡片、对话气泡、设置卡片背景色 |
| `--kn-bg-subtle` | `#f2efe8` | 次级按钮悬浮底色、用户消息气泡背景色 |
| `--kn-field-bg` | `#f7f4ed` | 输入框、分段选择器、输入框底板色 |
| `--kn-text` | `#2c2825` | 核心正文及标题颜色（深褐炭黑） |
| `--kn-text-muted` | `#8a7f72` | 辅助文字、占位符、非激活状态文本色 |
| `--kn-border` | `#ddd8d0` | 通用浅细边框色（模拟书籍切边线） |
| `--kn-border-strong` | `#ccc7be` | 强对比线、开关未激活态轨道底色 |
| `--kn-primary` | `#3c342f` | 主色（学术水墨深褐）：应用于核心高亮、激活 Tab、主按钮 |
| `--kn-primary-ink` | `#faf8f4` | 主色之上的反白文字颜色 |
| `--kn-primary-soft` | `#f0e9df` | 主色高亮背景、激活按钮浅底色 |
| `--kn-accent` | `#a08470` | 辅助强调色（大地陶土色）：应用于图标色、成功链接文本色 |
| `--kn-warning` | `#8b6914` | 警告提示色（暗金黄） |
| `--kn-danger` | `#b94a4a` | 错误提示色（暗深红） |

### 2.2 深色模式 (Dark Theme)

在系统切换至暗黑环境或手动切换深色时，自动切换至以下暗色变量：

| CSS 变量 | 默认 Hex / RGBA 色值 | 视觉用途描述 |
| :--- | :--- | :--- |
| `--kn-bg` | `#181512` | 深色页面背景色（深墨夜色） |
| `--kn-bg-raised` | `#201c18` | 悬浮卡片、对话气泡、设置卡片背景色 |
| `--kn-bg-subtle` | `#272320` | 次级按钮悬浮底色、用户消息气泡背景色 |
| `--kn-field-bg` | `#1d1916` | 输入框、分段选择器、输入框底板色 |
| `--kn-text` | `#e8e0d8` | 核心正文及标题颜色（暖石白） |
| `--kn-text-muted` | `#8e8279` | 辅助文字、非激活状态文本色 |
| `--kn-border` | `#352f29` | 通用浅细边框色 |
| `--kn-border-strong` | `#4a433c` | 强对比线色 |
| `--kn-primary` | `#ebdcd0` | 主色（暖石褐） |
| `--kn-primary-ink` | `#181512` | 主色之上的反黑文字颜色 |
| `--kn-primary-soft` | `rgba(235, 220, 208, 0.12)` | 主色高亮半透明背景 |
| `--kn-accent` | `#b09988` | 辅助强调色（青铜褐） |

---

## 3. 字体与排版规范 (Typography)

*   **字体族 (Font Family)**：
    ```css
    font-family: 'Aptos', 'Inter', 'Segoe UI', ui-sans-serif, system-ui, sans-serif;
    ```
    优先使用具有人文气息、边角圆润的 Aptos 字体或高清晰度 Inter 字体。
*   **基础字号 (Base Size)**：正文推荐为 `13.5px`，以匹配浏览器侧边栏（Sidepanel）的精细阅读。
*   **阅读行高 (Line Height)**：普通正文统一采用 `1.6`（或对话文本 `leading-6`），提供呼吸感更强的段落行距。
*   **文字渲染 (Text Rendering)**：
    ```css
    text-rendering: geometricPrecision;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    letter-spacing: -0.008em;
    ```
    开启抗锯齿并微调字间距，确保窄屏下多文字阅读的清晰度和舒适感。

---

## 4. 核心组件设计标准 (Component Standards)

### 4.1 顶部 Tab 导航 (Navigation Tabs)
*   **容器样式**：背景采用 `--kn-field-bg`，有极细的 `--kn-border` 框线保护，并具有 `border-radius: 10px` 圆角。
*   **激活状态**：滑块滑移激活时，背景呈现为白色的 `--kn-bg-raised`，字体变为深褐主色 `var(--kn-primary)`，并配有极微弱的阴影 `var(--kn-shadow-soft)`。

### 4.2 聊天输入框 (Composer Card)
*   **一体化无分割线**：取消输入区与下部按钮栏之间的灰色横线，通过 `gap: 8px` 的弹性布局进行物理间隙排布，使容器在视觉上更加浑然一体。
*   **容器规格**：`border-radius: 16px`，聚焦时边框变更为 `var(--kn-primary)` 并提供微弱的淡深褐阴影环绕效果。

### 4.3 消息气泡与动作按钮 (Messages & Action Toolbars)
*   **头像方案**：助手回复使用专属折面晶体 [BrandMark.svelte](file:///c:/Home/MyProjects/Knovana/chrome-extension/src/components/common/BrandMark.svelte) 图标，突出品牌符号。
*   **极简动作按钮**：气泡底部的快捷操作（如复制、重新生成）**不直接显示文本**。
    *   统一采用 `24x24px` 的精致正方形图标按钮 (`.copy-button`)，内置 `12px` 微型图标。
    *   鼠标悬停时自动显示黑色原生 HTML `title` 气泡提示（如“复制”、“重新生成”），并触发淡大地灰背景过渡。

### 4.4 设置组件与 iOS 风格滑动开关 (Settings & Switches)
*   **卡片式分组**：不同配置项使用 rounded `12px` 的白色面板（`.settings-card`）进行物理划分，告别散乱平铺。
*   **居右逻辑**：卡片内部的交互按钮（如“测试连接”）统一靠右对齐，确保右侧留白规整。
*   **滑动开关 (Switch Toggle)**：
    *   使用纯 CSS 设计的胶囊型滑动开关取代简陋的系统复选框。
    *   轨道关闭状态为 `--kn-border-strong` 灰色，激活时平滑滑动过渡为主色 `var(--kn-primary)`。
    *   拖拽圆形钮内置微投影，具备立体按下反馈，且支持点击文本整行切换。

---

## 5. 交互微动效与反馈 (Micro-interactions)

*   **通用过渡过渡时间 (Transitions)**：凡涉及背景、文字颜色、边框的变化，统一配置 `150ms` ~ `200ms` 的平滑过渡。
    ```css
    transition: background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
    ```
*   **加载动画 (Spin)**：
    ```css
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .spin { animation: spin 900ms linear infinite; }
    ```
*   **按钮轻量缩放 (Scale Feedback)**：核心发送按钮等，在 hover 状态下会有小幅度的放大动画，以给予用户物理反馈：
    ```css
    .send-btn:hover:not(:disabled) {
      transform: scale(1.05);
    }
    ```

---

## 6. 开发一致性约束 (Development Guardrails)

1.  **首选 CSS 变量**：在任何组件内严禁直接书写如 `#2e5436` 等具体色值，必须一律引用 `var(--kn-*)` 变量，以保证在暗色模式、大局升级色彩时能够一呼百应。
2.  **注重侧栏局促空间**：Knovana 主界面常驻在 `Side Panel`，宽度受限，设计组件时应随时考虑自适应窄屏，避免使用过宽的固定 padding，快捷键和次要信息应多采用悬浮提示 (Tooltip) 和精简图标设计。
