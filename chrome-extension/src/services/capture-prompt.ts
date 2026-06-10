import type { CaptureAction, PageSnapshot } from '../types/capture';

interface KnowledgeEntryPromptOptions {
  preserveOriginal?: boolean;
}

export function generateKnowledgeEntryPrompt(options: KnowledgeEntryPromptOptions = {}): string {
  const contentMode = options.preserveOriginal
    ? '请尽量保留资料原文，不要改写核心表述；只补充必要的标题、摘要、标签和检索线索。'
    : '请理解资料中的核心观点，整理为结构清晰、层次分明的 Markdown 知识条目。';

  return `请基于我上传、粘贴或补充的资料，整理一条完整的知识库条目。

【资料处理】
- 如果本次消息包含上传附件，请先使用 \`read_attachment\` 工具读取附件摘要预览；读取时使用附件本地路径中 \`attachments/\` 后面的文件名作为参数。
- 读取上传文档附件时，后端会默认只解析前 3 页并限制返回字符数，用于摘要整理；不要要求 agent 绕过该限制做全文解析。
- 如果附件是无法直接读取的二进制文件，请结合文件名、元数据和我在下方补充的说明整理。
- 保存最终知识条目时，必须在 \`save_to_kb\` 的 attachments 参数中声明需要归档的附件；新建条目不要只把附件留在临时 \`attachments/\` 目录。
- \`attachment_manager\` 的 \`import\` 动作主要用于给已经存在的知识条目补充附件。

【我补充的重点或原始内容】
"""
在这里填写希望重点整理的内容、背景、约束，或直接粘贴资料。
"""

【整理方式】
${contentMode}

【输出与保存要求】
1. 提炼清晰标题、摘要、关键观点和便于后续检索的标签。
2. 使用 \`obsidian-markdown\` 技能规范，生成符合 Obsidian Flavored Markdown (OFM) 的条目，包含 YAML frontmatter、必要的 [[Wikilinks]]、Callouts 和高亮。
3. 保留原资料使用的语言，不要无故翻译。
4. 使用 \`save_to_kb\` 工具保存到知识库，category 默认使用 'inbox'。
5. 回复中展示整理后的笔记概要，并告知保存的相对路径。`;
}

export function generateCapturePrompt(
  action: CaptureAction,
  context: PageSnapshot & { mediaUrl?: string; mediaLocalPath?: string },
  mediaLocalPath: string,
  imagesSection: string,
): string {
  const selectedText = context.selectedText || '';
  const selectedHtml = context.selectedHtml || '';
  const rawCaptureContent = selectedText.trim() || selectedHtml.trim();
  const captureContent = hasMeaningfulTextContent(rawCaptureContent)
    ? rawCaptureContent
    : buildFallbackCaptureContent(context, imagesSection, rawCaptureContent);
  const uploadedMediaPath = mediaLocalPath || context.mediaLocalPath || '';
  if (action === 'generate-doc' || action === 'extract-page') {
    const isSelection = action === 'generate-doc';
    const header = isSelection
      ? '【网页捕获：整理成知识条目】'
      : '【网页捕获：整理网页正文为知识条目】';
    const contentDesc = isSelection ? '选区内容' : '网页正文内容';
    return `${header}
请根据以下${contentDesc}整理出一篇结构清晰、层次分明的 Markdown 知识条目。

**原始来源**：
- 页面标题：${context.pageTitle}
- 页面链接：${context.pageUrl}

**整理内容**：
"""
${captureContent}
"""${imagesSection}

**具体要求**：
1. 提炼核心观点与关键知识，使用 \`obsidian-markdown\` 技能规范，形成符合 Obsidian Flavored Markdown (OFM) 格式的笔记（包含 YAML frontmatter、双链 [[Wikilinks]]、必要时使用 [!note] 等 Callouts 块以及高亮 ==text== 等）。
2. 保持专业度和可读性，剔除页面无关信息。
3. **必须保留原文所使用的撰写语言，绝对禁止进行翻译（例如：英文原文必须整理成英文条目，中文原文则整理成中文条目）。**
4. **必须完整保留“整理内容”中嵌入的所有图片引用（即形如 \`![image](attachments/...)\` 的本地图片语法），这些引用已经按原网页上下文位置插入；整理时必须保留在相邻段落附近，不要统一移动到文末。**
5. 请务必使用 \`save_to_kb\` 工具将整理后的条目保存到 Obsidian 知识库中（category 默认设为 'inbox'，title 应当精炼醒目）。
6. 在回答中向我展示整理后的笔记，并告知文件保存的相对路径。`;
  } else if (action === 'save-selection') {
    return `【网页捕获：原样保存并标注】
请将以下捕获的网页内容原封不动保存到知识库中，并为其分析和提取 2-5 个便于后续分类和检索的标签（tags）。

**原始来源**：
- 页面标题：${context.pageTitle}
- 页面链接：${context.pageUrl}

**保存内容**：
"""
${captureContent}
"""${imagesSection}

**具体要求**：
1. 请勿修改、重写或润色“保存内容”里的文本，确保原汁原味。
2. 针对内容主题进行分析，提取出 2-5 个便于后续检索分类的标签。
3. **务必完整保留“保存内容”中的所有图片引用（形如 \`![image](attachments/...)\`），并保留它们相对文本段落的位置，不要统一移动到文末。**
4. 务必使用 \`obsidian-markdown\` 技能规范（生成 YAML frontmatter 等）和 \`save_to_kb\` 工具保存该条目（category 默认使用 'inbox'）。
5. 在回答中向我展示保存的内容与提取的标签，并告知文件保存的相对路径。`;
  } else if (action === 'save-media') {
    if (!uploadedMediaPath) {
      return '';
    }

    let notesSection = '';
    if (selectedText.trim()) {
      notesSection = `\n**附加说明/备注**：\n"""\n${selectedText.trim()}\n"""\n`;
    }
    const mediaPathLine = `- 浏览器扩展已下载并上传媒体文件：${uploadedMediaPath}`;
    const mediaEmbedExample = `![media](${uploadedMediaPath})`;
    return `【网页捕获：保存媒体文件】
请保存以下已由浏览器扩展下载并上传的网页媒体文件，并为其自动分析并提取分类标签。

**原始来源**：
- 页面标题：${context.pageTitle}
- 页面链接：${context.pageUrl}
${mediaPathLine}
${notesSection}
**具体要求**：
1. 结合页面上下文和文件名，以及用户提供的附加说明（如有），提取 2-5 个便于后续分类和检索的标签。
2. **只使用上面的本地保存路径，不要调用后端或 Agent 工具从网页媒体 URL 再次下载文件；如果没有明确的 \`attachments/...\` 路径，请停止并提示用户重新捕获。**
3. 务必使用 \`obsidian-markdown\` 技能规范（生成 YAML frontmatter 等）和 \`save_to_kb\` 工具将此条目保存到 Obsidian 知识库中。请在 content 中以 Markdown 图片语法引用的形式嵌入本地保存路径（如 \`${mediaEmbedExample}\`）。如果用户提供了附加说明/备注，请将该备注以文本段落形式保存在图片引用下方。
4. 在回答中向我展示生成的标签，并告知文件保存的相对路径。`;
  }
  return '';
}

function buildFallbackCaptureContent(
  context: PageSnapshot & { mediaUrl?: string; mediaLocalPath?: string },
  imagesSection: string,
  existingContent = '',
): string {
  const lines = [
    `页面标题：${context.pageTitle || '未命名页面'}`,
    context.description ? `页面描述：${context.description}` : '',
    context.pageUrl ? `页面链接：${context.pageUrl}` : '',
    existingContent.trim(),
    imagesSection.trim() ? '已捕获到媒体附件，见下方媒体文件列表。' : '',
  ].filter(Boolean);

  return lines.join('\n');
}

function hasMeaningfulTextContent(value: string): boolean {
  const withoutImages = value
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/\s+/g, '');
  return withoutImages.length > 0;
}
