import type { CaptureAction, PageSnapshot } from '../types/capture';

export function generateCapturePrompt(
  action: CaptureAction,
  context: PageSnapshot & { mediaUrl?: string },
  mediaLocalPath: string,
  imagesSection: string,
): string {
  const selectedText = context.selectedText || '';
  const selectedHtml = context.selectedHtml || '';
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
${selectedText || selectedHtml}
"""${imagesSection}

**具体要求**：
1. 提炼核心观点与关键知识，使用 \`obsidian-markdown\` 技能规范，形成符合 Obsidian Flavored Markdown (OFM) 格式的笔记（包含 YAML frontmatter、双链 [[Wikilinks]]、必要时使用 [!note] 等 Callouts 块以及高亮 ==text== 等）。
2. 保持专业度和可读性，剔除页面无关信息。
3. **必须保留原文所使用的撰写语言，绝对禁止进行翻译（例如：英文原文必须整理成英文条目，中文原文则整理成中文条目）。**
4. **必须完整保留正文内容中嵌入的所有图片引用（即形如 \`![image](attachments/...)\` 的本地图片语法），将它们嵌入到整理后条目的对应上下文位置中，绝对不能遗漏、遗失或丢弃这些图片。**
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
${selectedText || selectedHtml}
"""${imagesSection}

**具体要求**：
1. 请勿修改、重写或润色“保存内容”里的文本，确保原汁原味。
2. 针对内容主题进行分析，提取出 2-5 个便于后续检索分类的标签。
3. **务必完整保留保存内容中的所有图片引用（形如 \`![image](attachments/...)\`）。**
4. 务必使用 \`obsidian-markdown\` 技能规范（生成 YAML frontmatter 等）和 \`save_to_kb\` 工具保存该条目（category 默认使用 'inbox'）。
5. 在回答中向我展示保存的内容与提取的标签，并告知文件保存的相对路径。`;
  } else if (action === 'save-media') {
    let notesSection = '';
    if (selectedText.trim()) {
      notesSection = `\n**附加说明/备注**：\n"""\n${selectedText.trim()}\n"""\n`;
    }
    return `【网页捕获：保存媒体文件】
请保存以下网页媒体文件，并为其自动分析并提取分类标签。

**原始来源**：
- 页面标题：${context.pageTitle}
- 页面链接：${context.pageUrl}
- 媒体原链接：${context.mediaUrl}
- 本地保存路径：${mediaLocalPath || 'attachments/'}
${notesSection}
**具体要求**：
1. 结合页面上下文和文件名，以及用户提供的附加说明（如有），提取 2-5 个便于后续分类 and 检索的标签。
2. 务必使用 \`obsidian-markdown\` 技能规范（生成 YAML frontmatter 等）和 \`save_to_kb\` 工具将此条目保存到 Obsidian 知识库中。请在 content 中以 Markdown 图片语法引用的形式嵌入本地保存路径（如 \`![media](${mediaLocalPath})\`）。如果用户提供了附加说明/备注，请将该备注以文本段落形式保存在图片引用下方。
3. 在回答中向我展示生成的标签，并告知文件保存的相对路径。`;
  }
  return '';
}
