import { describe, expect, it } from 'vitest';
import { generateCapturePrompt, generateKnowledgeEntryPrompt } from './capture-prompt';

describe('knowledge entry prompt', () => {
  it('builds an editable knowledge-entry prompt without capture-source form fields', () => {
    const prompt = generateKnowledgeEntryPrompt();

    expect(prompt).toContain('请基于我上传、粘贴或补充的资料');
    expect(prompt).toContain('read_attachment');
    expect(prompt).toContain('save_to_kb');
    expect(prompt).not.toContain('原始来源');
    expect(prompt).not.toContain('附加整理引导词');
    expect(prompt).not.toContain('批注与备注');
  });

  it('can switch to preserve-original mode for raw-save workflows', () => {
    const prompt = generateKnowledgeEntryPrompt({ preserveOriginal: true });

    expect(prompt).toContain('请尽量保留资料原文');
    expect(prompt).toContain('不要改写核心表述');
  });

  it('uses the extension-uploaded local path for media captures instead of the source media URL', () => {
    const prompt = generateCapturePrompt(
      'save-media',
      {
        pageTitle: 'Media Page',
        pageUrl: 'https://example.com/page',
        mediaUrl: 'https://cdn.example.com/private/image.png',
        selectedImages: [],
      },
      'attachments/image.png',
      '',
    );

    expect(prompt).toContain('浏览器扩展已下载并上传媒体文件：attachments/image.png');
    expect(prompt).toContain('![media](attachments/image.png)');
    expect(prompt).toContain('不要调用后端或 Agent 工具从网页媒体 URL 再次下载文件');
    expect(prompt).not.toContain('https://cdn.example.com/private/image.png');
  });

  it('fills capture content from page metadata when extraction returns empty text', () => {
    const prompt = generateCapturePrompt(
      'extract-page',
      {
        pageTitle: 'Akshay 🚀 on X: "Anatomy of the .claude/ folder" / X',
        pageUrl: 'https://x.com/akshay_pachaar/status/2035341800739877091',
        description: 'A thread about the .claude folder.',
        selectedText: '',
        selectedHtml: '',
        selectedImages: [],
      },
      '',
      '',
    );

    expect(prompt).toContain('页面标题：Akshay 🚀 on X: "Anatomy of the .claude/ folder" / X');
    expect(prompt).toContain('页面描述：A thread about the .claude folder.');
    expect(prompt).toContain('页面链接：https://x.com/akshay_pachaar/status/2035341800739877091');
    expect(prompt).not.toContain('**整理内容**：\n"""\n\n"""');
  });

  it('adds page metadata when extracted capture content only contains images', () => {
    const prompt = generateCapturePrompt(
      'extract-page',
      {
        pageTitle: 'Akshay 🚀 on X: "Anatomy of the .claude/ folder" / X',
        pageUrl: 'https://x.com/akshay_pachaar/status/2035341800739877091',
        selectedText:
          '![image](attachments/HD78D48b0AAI72h-2.jpg)\n\n![image](attachments/HD70c_tbMAAvhZK-3.jpg)',
        selectedHtml: '',
        selectedImages: [],
      },
      '',
      '\n\n【捕获的媒体文件列表】:\n- ![media](attachments/HD78D48b0AAI72h-2.jpg)',
    );

    expect(prompt).toContain('页面标题：Akshay 🚀 on X: "Anatomy of the .claude/ folder" / X');
    expect(prompt).toContain('页面链接：https://x.com/akshay_pachaar/status/2035341800739877091');
    expect(prompt).toContain('![image](attachments/HD78D48b0AAI72h-2.jpg)');
  });
});
