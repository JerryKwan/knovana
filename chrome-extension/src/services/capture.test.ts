import { afterEach, describe, expect, it, vi } from 'vitest';
import TurndownService from 'turndown';
import type { ActionContext, PageSnapshot } from '../types/capture';
import {
  actionLabel,
  buildCaptureRequest,
  contextFromMenu,
  prepareCaptureUploads,
} from './capture';
import { extractContent } from './extractors';

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

afterEach(() => {
  vi.unstubAllGlobals();
});

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

function toMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    hr: '---',
  });
  turndownService.addRule('images', {
    filter: 'img',
    replacement: function (_content, node) {
      const img = node as HTMLImageElement;
      const alt = img.getAttribute('alt') || img.getAttribute('aria-label') || 'image';
      const src = img.getAttribute('src') || '';
      return `![${alt}](${src})`;
    },
  });
  return turndownService.turndown(html);
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

  it('collects page snapshot and extracts block text with preserved newlines', async () => {
    document.title = 'Test Title';
    document.body.innerHTML =
      '<div id="test-content"><p>Paragraph 1</p><p>Paragraph 2</p><div>Some inline text<br>with break</div></div>';

    const el = document.getElementById('test-content');
    expect(el).not.toBeNull();

    const url = new URL('https://example.com/article');
    const extractResult = await extractContent(url, document, el!.innerHTML);

    const selectedText = toMarkdown(extractResult.selectedHtml);
    expect(selectedText).toContain('Paragraph 1');
    expect(selectedText).toContain('Paragraph 2');
    // Hard breaks have 2 spaces in Turndown
    expect(selectedText.replace(/ {2}\n/g, '\n')).toContain('Some inline text\nwith break');

    document.body.innerHTML = '';
  });

  it('extracts page content and ignores navigation, footer, sidebar for extract-page action', async () => {
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

    const url = new URL('https://example.com/article');
    const extractResult = await extractContent(url, document);
    const selectedText = toMarkdown(extractResult.selectedHtml);

    expect(extractResult.pageTitle).toBe('Page Title');
    expect(selectedText).toContain('Real Heading');
    expect(selectedText).toContain('This is the main article paragraph 1.');
    expect(selectedText).toContain('Paragraph 2 of the article.');
    expect(selectedText).not.toContain('Logo and branding');
    expect(selectedText).not.toContain('Home');
    expect(selectedText).not.toContain('Sidebar widgets');
    expect(selectedText).not.toContain('Copyright 2026');

    // Inline image markup test
    expect(selectedText).toContain('![Main Image](https://example.com/main.png)');

    // Relative image resolution test
    const expectedRelativeAbs = new URL('content/images/gemma.png', document.baseURI).href;
    expect(selectedText).toContain(`![Relative Image](${expectedRelativeAbs})`);

    expect(extractResult.selectedImages).toEqual([
      { src: 'https://example.com/main.png', alt: 'Main Image' },
      { src: expectedRelativeAbs, alt: 'Relative Image' },
    ]);

    document.body.innerHTML = '';
  });

  it('keeps generic article images in document order for blog pages', async () => {
    document.title = 'The Illustrated Transformer';
    document.body.innerHTML = `
      <header>Site navigation</header>
      <main>
        <article>
          <h1>The Illustrated Transformer</h1>
          <p>First paragraph introduces the architecture.</p>
          <figure>
            <img src="/images/transformer-attention.png" alt="Attention diagram">
            <figcaption>Attention diagram caption.</figcaption>
          </figure>
          <p>Second paragraph explains self-attention.</p>
          <pre><code>attention(Q, K, V)</code></pre>
        </article>
      </main>
    `;

    const imageUrl = new URL('/images/transformer-attention.png', document.baseURI).href;
    const url = new URL('https://example.com/article');
    const extractResult = await extractContent(url, document);
    const selectedText = toMarkdown(extractResult.selectedHtml);

    expect(extractResult.pageTitle).toBe('The Illustrated Transformer');
    expect(selectedText).toMatch(
      new RegExp(
        [
          'First paragraph introduces the architecture\\.',
          `[\\s\\S]*!\\[Attention diagram\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`,
          '[\\s\\S]*Attention diagram caption\\.',
          '[\\s\\S]*Second paragraph explains self-attention\\.',
          '[\\s\\S]*attention\\(Q, K, V\\)',
        ].join(''),
      ),
    );

    document.body.innerHTML = '';
  });

  it('uses the X extractor and routes to the generic readability extractor', async () => {
    document.title = 'Akshay 🚀 on X: "Anatomy of the .claude/ folder" / X';
    document.body.innerHTML = `
      <main>
        <article>
          <h1>Anatomy of the .claude/ folder</h1>
          <p>A complete guide to CLAUDE.md, custom commands, skills, agents, and permissions.</p>
          <img src="https://pbs.twimg.com/media/HD78D48b0AAI72h?format=jpg&name=large" alt="Cover image">
        </article>
      </main>
    `;

    const url = new URL('https://x.com/akshay_pachaar/status/2035341800739877091');
    const extractResult = await extractContent(url, document);
    const selectedText = toMarkdown(extractResult.selectedHtml);

    expect(extractResult.pageTitle).toContain('Anatomy of the .claude/ folder');
    expect(selectedText).toContain('A complete guide to CLAUDE.md');
    expect(selectedText).toContain(
      '![Cover image](https://pbs.twimg.com/media/HD78D48b0AAI72h?format=jpg&name=large)',
    );
    expect(extractResult.selectedImages).toEqual([
      {
        src: 'https://pbs.twimg.com/media/HD78D48b0AAI72h?format=jpg&name=large',
        alt: 'Cover image',
      },
    ]);

    document.body.innerHTML = '';
  });

  it('uses backend-confirmed attachment paths when replacing captured media references', async () => {
    const mediaUrl = 'https://example.com/image.jpg';
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/attachments')) {
        return new Response(
          JSON.stringify({
            filename: 'image-2.jpg',
            path: 'attachments/image-2.jpg',
            url: '/api/v1/attachments/usr_test/image-2.jpg',
            size: 6,
            mime_type: 'image/jpeg',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response('binary', {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const prepared = await prepareCaptureUploads(
      'generate-doc',
      context('generate-doc', {
        selectedHtml: `<p>Look at <img src="${mediaUrl}"></p>`,
        selectedImages: [{ src: mediaUrl, alt: 'Example' }],
      }),
    );

    expect(prepared.uploadedAssets).toEqual([
      {
        kind: 'content-image',
        sourceUrl: mediaUrl,
        filename: 'image-2.jpg',
        path: 'attachments/image-2.jpg',
        url: '/api/v1/attachments/usr_test/image-2.jpg',
        size: 6,
        mimeType: 'image/jpeg',
      },
    ]);
    expect(prepared.context.selectedText).toContain('![Example](attachments/image-2.jpg)');
    expect(prepared.context.selectedText).not.toContain(mediaUrl);
    expect(prepared.context.selectedHtml).toContain('src="attachments/image-2.jpg"');
    expect(prepared.imagesSection).toContain('![media](attachments/image-2.jpg)');
  });

  it('keeps uploaded media paths in their ordered content block positions', async () => {
    const mediaUrl = 'https://pbs.twimg.com/media/chart-one?format=jpg&name=large';
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/attachments')) {
        return new Response(
          JSON.stringify({
            filename: 'chart-one-2.jpg',
            path: 'attachments/chart-one-2.jpg',
            url: '/api/v1/attachments/usr_test/chart-one-2.jpg',
            size: 6,
            mime_type: 'image/jpeg',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response('binary', {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const prepared = await prepareCaptureUploads(
      'extract-page',
      context('extract-page', {
        selectedHtml: `<p>First idea before the chart.</p><img src="${mediaUrl}"><p>Second idea after the chart.</p>`,
        selectedImages: [{ src: mediaUrl, alt: 'Chart' }],
      }),
    );

    expect(prepared.context.selectedText).toMatch(
      /First idea before the chart\.[\s\S]*!\[Chart\]\(attachments\/chart-one-2\.jpg\)[\s\S]*Second idea after the chart\./,
    );
    expect(prepared.context.selectedHtml).toContain('src="attachments/chart-one-2.jpg"');
    expect(prepared.imagesSection).toContain('![media](attachments/chart-one-2.jpg)');
  });

  it('keeps uploaded generic article images at their original document positions', async () => {
    const mediaUrl = 'https://example.com/images/transformer-attention.png';
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/attachments')) {
        return new Response(
          JSON.stringify({
            filename: 'transformer-attention.png',
            path: 'attachments/transformer-attention.png',
            url: '/api/v1/attachments/usr_test/transformer-attention.png',
            size: 6,
            mime_type: 'image/png',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response('binary', {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const prepared = await prepareCaptureUploads(
      'extract-page',
      context('extract-page', {
        selectedHtml: `<p>First paragraph introduces the architecture.</p><img src="${mediaUrl}"><p>Second paragraph explains self-attention.</p>`,
        selectedImages: [{ src: mediaUrl, alt: 'Attention diagram' }],
      }),
    );

    expect(prepared.context.selectedText).toMatch(
      /First paragraph introduces the architecture\.[\s\S]*!\[Attention diagram\]\(attachments\/transformer-attention\.png\)[\s\S]*Second paragraph explains self-attention\./,
    );
  });

  it('fails capture upload preparation when a selected media upload fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/attachments')) {
          return new Response('nope', { status: 500, statusText: 'Server Error' });
        }
        return new Response('binary', {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg' },
        });
      }),
    );

    await expect(
      prepareCaptureUploads(
        'save-selection',
        context('save-selection', {
          selectedImages: [{ src: 'https://example.com/broken.jpg' }],
        }),
      ),
    ).rejects.toThrow('上传媒体失败');
  });

  it('converts inline styled spans to semantic formatting in selection capture', async () => {
    const prepared = await prepareCaptureUploads(
      'save-selection',
      context('save-selection', {
        selectedHtml:
          '<p><span style="font-weight: bold;">Bold Text</span> and <span style="font-style: italic;">Italic Text</span></p>',
        selectedImages: [],
      }),
    );

    expect(prepared.context.selectedText).toBe('**Bold Text** and _Italic Text_');
  });
});
