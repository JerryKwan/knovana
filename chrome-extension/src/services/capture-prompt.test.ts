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
});
