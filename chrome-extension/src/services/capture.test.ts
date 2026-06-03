import { describe, expect, it } from 'vitest';
import type { ActionContext, PageSnapshot } from '../types/capture';
import { actionLabel, buildCaptureRequest, contextFromMenu } from './capture';

const snapshot: PageSnapshot = {
  pageUrl: 'https://example.com/article',
  pageTitle: 'Example Article',
  description: 'A useful page',
  author: 'Knovana',
  siteName: 'Example',
  selectedText: 'Selected text',
  selectedHtml: '<p>Selected text</p>',
  selectedImages: [],
};

function context(
  action: ActionContext['action'],
  overrides: Partial<ActionContext> = {},
): ActionContext {
  return {
    ...snapshot,
    action,
    ...overrides,
  };
}

describe('capture service', () => {
  it('builds summarize and document requests from selection context', () => {
    expect(buildCaptureRequest('summarize', context('summarize'))).toEqual({
      action: 'summarize',
      content: 'Selected text',
      image_url: null,
      page_url: 'https://example.com/article',
      page_title: 'Example Article',
    });

    expect(buildCaptureRequest('generate-doc', context('generate-doc')).action).toBe(
      'generate_doc',
    );
  });

  it('uses source-specific content for image, link, and page captures', () => {
    expect(
      buildCaptureRequest(
        'save-image',
        context('save-image', { imageUrl: 'https://example.com/image.png' }),
      ).content,
    ).toBe('Image: https://example.com/image.png');

    expect(
      buildCaptureRequest('save-link', context('save-link', { linkUrl: 'https://example.com/ref' }))
        .content,
    ).toBe('Link: https://example.com/ref');

    expect(buildCaptureRequest('save-page', context('save-page')).content).toContain(
      'URL: https://example.com/article',
    );
  });

  it('prefers context menu selection text over the page snapshot', () => {
    const result = contextFromMenu(
      'save-selection',
      {
        selectionText: ' Menu selection ',
        srcUrl: 'https://example.com/image.png',
      } as chrome.contextMenus.OnClickData,
      snapshot,
    );

    expect(result).toMatchObject({
      action: 'save-selection',
      selectedText: 'Menu selection',
      imageUrl: 'https://example.com/image.png',
    });
  });

  it('returns labels for all capture actions', () => {
    expect(actionLabel('summarize')).toBe('生成摘要');
    expect(actionLabel('save-page')).toBe('保存页面');
  });
});
