import { describe, expect, it } from 'vitest';
import type { ActionContext, PageSnapshot } from '../types/capture';
import { actionLabel, buildCaptureRequest, collectPageSnapshot, contextFromMenu } from './capture';

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
  it('builds document requests from selection context', () => {
    expect(buildCaptureRequest('generate-doc', context('generate-doc')).action).toBe(
      'generate_doc',
    );
  });

  it('uses source-specific content for image captures', () => {
    expect(
      buildCaptureRequest(
        'save-media',
        context('save-media', { mediaUrl: 'https://example.com/image.png' }),
      ).content,
    ).toBe('Media: https://example.com/image.png');
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
      mediaUrl: 'https://example.com/image.png',
    });
  });

  it('returns labels for all capture actions', () => {
    expect(actionLabel('generate-doc')).toBe('整理成知识条目');
  });

  it('collects page snapshot and extracts block text with preserved newlines', () => {
    // Set up mock DOM
    document.title = 'Test Title';
    document.body.innerHTML =
      '<div id="test-content"><p>Paragraph 1</p><p>Paragraph 2</p><div>Some inline text<br>with break</div></div>';

    const el = document.getElementById('test-content');
    expect(el).not.toBeNull();

    // Mock Selection API in JSDOM
    const range = document.createRange();
    range.selectNodeContents(el!);
    const selection = window.getSelection();
    expect(selection).not.toBeNull();
    selection!.removeAllRanges();
    selection!.addRange(range);

    const snapshotResult = {
      pageUrl: window.location.href,
      pageTitle: document.title,
      description: undefined,
      author: undefined,
      siteName: undefined,
      favicon: undefined,
      language: undefined,
      selectedText: 'Paragraph 1\n\nParagraph 2\n\nSome inline text\nwith break',
      selectedHtml: el!.innerHTML,
      selectedImages: [],
    };

    const result = collectPageSnapshot();
    expect((result.selectedText || '').replace(/\r\n/g, '\n').trim()).toBe(
      snapshotResult.selectedText,
    );

    // Clean up
    selection!.removeAllRanges();
    document.body.innerHTML = '';
  });

  it('extracts page content and ignores navigation, footer, sidebar for extract-page action', () => {
    document.title = 'Page Title';
    document.body.innerHTML = `
      <header>Logo and branding</header>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
        </ul>
      </nav>
      <div class="sidebar">
        <aside>Sidebar widgets and ads</aside>
      </div>
      <main>
        <article>
          <h1>Real Heading</h1>
          <p>This is the main article paragraph 1.</p>
          <img src="https://example.com/main.png" alt="Main Image">
          <p>Paragraph 2 of the article.</p>
          <img src="content/images/gemma.png" alt="Relative Image">
        </article>
      </main>
      <footer>
        <p>Copyright 2026</p>
      </footer>
    `;

    const result = collectPageSnapshot('extract-page');
    expect(result.pageTitle).toBe('Page Title');
    expect(result.selectedText).toContain('Real Heading');
    expect(result.selectedText).toContain('This is the main article paragraph 1.');
    expect(result.selectedText).toContain('Paragraph 2 of the article.');
    expect(result.selectedText).not.toContain('Logo and branding');
    expect(result.selectedText).not.toContain('Home');
    expect(result.selectedText).not.toContain('Sidebar widgets');
    expect(result.selectedText).not.toContain('Copyright 2026');

    // Inline image markup test
    expect(result.selectedText).toContain('![image](https://example.com/main.png)');

    // Relative image resolution test
    const expectedRelativeAbs = new URL('content/images/gemma.png', document.baseURI).href;
    expect(result.selectedText).toContain(`![image](${expectedRelativeAbs})`);

    expect(result.selectedImages).toEqual([
      { src: 'https://example.com/main.png', alt: 'Main Image' },
      { src: expectedRelativeAbs, alt: 'Relative Image' },
    ]);

    // Clean up
    document.body.innerHTML = '';
  });
});
