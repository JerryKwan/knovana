import { describe, expect, it } from 'vitest';
import { generateKnowledgeEntryPrompt } from './capture-prompt';

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
});
