import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ActionContext, PageSnapshot } from '../types/capture';
import {
  actionLabel,
  buildCaptureRequest,
  collectPageSnapshot,
  contextFromMenu,
  prepareCaptureUploads,
} from './capture';

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

  it('runs after function serialization like chrome.scripting.executeScript injection', () => {
    const injectedCollectPageSnapshot = Function(
      `return (${collectPageSnapshot.toString()})`,
    )() as typeof collectPageSnapshot;
    document.title = 'Serialized Capture Page';
    document.body.innerHTML = `
      <main>
        <article>
          <h1>Serialized heading</h1>
          <p>Serialized paragraph.</p>
          <img src="https://example.com/serialized.png" alt="Serialized image">
        </article>
      </main>
    `;

    const result = injectedCollectPageSnapshot('extract-page');

    expect(result.selectedText).toContain('Serialized heading');
    expect(result.selectedText).toContain('Serialized paragraph.');
    expect(result.selectedText).toContain('![image](https://example.com/serialized.png)');
    expect(result.selectedImages).toEqual([
      { src: 'https://example.com/serialized.png', alt: 'Serialized image' },
    ]);

    document.body.innerHTML = '';
  });

  it('keeps generic article images in document order for blog pages', () => {
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
    const result = collectPageSnapshot('extract-page');

    expect(result.selectedText).toMatch(
      new RegExp(
        [
          'The Illustrated Transformer',
          '[\\s\\S]*First paragraph introduces the architecture\\.',
          `[\\s\\S]*!\\[image\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`,
          '[\\s\\S]*Attention diagram caption\\.',
          '[\\s\\S]*Second paragraph explains self-attention\\.',
          '[\\s\\S]*attention\\(Q, K, V\\)',
        ].join(''),
      ),
    );
    expect(result.contentBlocks).toEqual([
      { type: 'text', text: 'The Illustrated Transformer' },
      { type: 'text', text: 'First paragraph introduces the architecture.' },
      { type: 'image', src: imageUrl, alt: 'Attention diagram' },
      { type: 'text', text: 'Attention diagram caption.' },
      { type: 'text', text: 'Second paragraph explains self-attention.' },
      { type: 'text', text: 'attention(Q, K, V)' },
    ]);

    document.body.innerHTML = '';
  });

  it('uses the X status extractor for the current post and captures multiple images without comments', () => {
    const originalUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.replaceState({}, '', '/akshay_pachaar/status/2035341800739877091');
    document.title = 'Post / X';
    document.body.innerHTML = `
      <main>
        <section data-testid="primaryColumn">
          <article data-testid="tweet">
            <a href="/akshay_pachaar/status/2035341800739877091">Jun 10</a>
            <div data-testid="tweetText">
              <span>Main post text.</span>
              <br>
              <span>Second line.</span>
            </div>
            <div data-testid="tweetPhoto">
              <img src="https://pbs.twimg.com/media/main-one?format=jpg&name=small" alt="Image 1">
            </div>
            <a href="/akshay_pachaar/status/2035341800739877091/photo/2">
              <img src="https://pbs.twimg.com/media/main-two?format=jpg&name=small" alt="Image 2">
            </a>
            <div data-testid="tweetPhoto">
              <img src="https://pbs.twimg.com/media/main-three?format=jpg&name=900x900" alt="Image 3">
            </div>
          </article>
          <article data-testid="tweet">
            <a href="/reply_author/status/999">Reply time</a>
            <div data-testid="tweetText">Reply text should not be captured.</div>
            <div data-testid="tweetPhoto">
              <img src="https://pbs.twimg.com/media/reply-image?format=jpg&name=small" alt="Reply image">
            </div>
          </article>
        </section>
      </main>
    `;

    const result = collectPageSnapshot('extract-page');

    expect(result.selectedText).toContain('Main post text.');
    expect(result.selectedText).toContain('Second line.');
    expect(result.selectedText).not.toContain('Reply text should not be captured.');
    expect(result.selectedText).not.toContain('reply-image');
    expect(result.selectedImages).toEqual([
      {
        src: 'https://pbs.twimg.com/media/main-one?format=jpg&name=large',
        alt: 'Image 1',
      },
      {
        src: 'https://pbs.twimg.com/media/main-two?format=jpg&name=large',
        alt: 'Image 2',
      },
      {
        src: 'https://pbs.twimg.com/media/main-three?format=jpg&name=large',
        alt: 'Image 3',
      },
    ]);
    expect(result.selectedText).toContain(
      '![image](https://pbs.twimg.com/media/main-one?format=jpg&name=large)',
    );
    expect(result.selectedText).toContain(
      '![image](https://pbs.twimg.com/media/main-two?format=jpg&name=large)',
    );
    expect(result.selectedText).toContain(
      '![image](https://pbs.twimg.com/media/main-three?format=jpg&name=large)',
    );

    document.body.innerHTML = '';
    window.history.replaceState({}, '', originalUrl || '/');
  });

  it('captures X article media links that render tweetPhoto images with background-image fallbacks', () => {
    const originalUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.replaceState({}, '', '/akshay_pachaar/article/2035341800739877091');
    document.title = 'Article / X';
    document.body.innerHTML = `
      <main>
        <section data-testid="primaryColumn">
          <article data-testid="tweet">
            <a href="/akshay_pachaar/article/2035341800739877091">Article link</a>
            <div data-testid="tweetText">Long-form article body.</div>
            <a href="/akshay_pachaar/article/2035341800739877091/media/2035332860593516544" role="link">
              <div>
                <div>
                  <div aria-label="Image" data-testid="tweetPhoto" style="margin: 0px;">
                    <div style="filter: brightness(1); background-image: url(&quot;https://pbs.twimg.com/media/HD70c_tbMAAvhzK?format=jpg&amp;name=900x900&quot;);"></div>
                    <img alt="Image" draggable="true" src="https://pbs.twimg.com/media/HD70c_tbMAAvhzK?format=jpg&amp;name=900x900">
                  </div>
                </div>
              </div>
            </a>
          </article>
          <article data-testid="tweet">
            <div data-testid="tweetText">Comment should not be captured.</div>
            <a href="/comment_author/article/999/media/1">
              <img alt="Comment image" src="https://pbs.twimg.com/media/comment-image?format=jpg&amp;name=900x900">
            </a>
          </article>
        </section>
      </main>
    `;

    const result = collectPageSnapshot('extract-page');

    expect(result.selectedText).toContain('Long-form article body.');
    expect(result.selectedText).not.toContain('Comment should not be captured.');
    expect(result.selectedText).not.toContain('comment-image');
    expect(result.selectedImages).toEqual([
      {
        src: 'https://pbs.twimg.com/media/HD70c_tbMAAvhzK?format=jpg&name=large',
        alt: 'Image',
      },
    ]);
    expect(result.selectedText).toContain(
      '![image](https://pbs.twimg.com/media/HD70c_tbMAAvhzK?format=jpg&name=large)',
    );

    document.body.innerHTML = '';
    window.history.replaceState({}, '', originalUrl || '/');
  });

  it('extracts high-value X article text even when it is not inside tweetText nodes', () => {
    const originalUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.replaceState({}, '', '/akshay_pachaar/status/2035341800739877091');
    document.title = 'Akshay 🚀 on X: "Anatomy of the .claude/ folder" / X';
    document.body.innerHTML = `
      <main>
        <section data-testid="primaryColumn">
          <div data-testid="cellInnerDiv">
            <article data-testid="tweet">
              <a href="/akshay_pachaar/status/2035341800739877091">Article link</a>
              <div>
                <div dir="auto" lang="en">Anatomy of the .claude/ folder</div>
                <div dir="auto" lang="en">This guide walks through the entire anatomy of the folder, from the files you'll use daily to the ones you'll set once and forget.</div>
                <a href="/akshay_pachaar/status/2035341800739877091/media/1">
                  <div data-testid="tweetPhoto">
                    <img src="https://pbs.twimg.com/media/article-diagram?format=jpg&name=small" alt="Article diagram">
                  </div>
                </a>
              </div>
            </article>
          </div>
          <div data-testid="cellInnerDiv">
            <article data-testid="tweet">
              <a href="/reply_author/status/999">Reply link</a>
              <div dir="auto" lang="en">Reply text should not be captured.</div>
            </article>
          </div>
        </section>
      </main>
    `;

    const result = collectPageSnapshot('extract-page');

    expect(result.selectedText).toMatch(
      /Anatomy of the \.claude\/ folder[\s\S]*This guide walks through the entire anatomy of the folder[\s\S]*!\[image\]\(https:\/\/pbs\.twimg\.com\/media\/article-diagram\?format=jpg&name=large\)/,
    );
    expect(result.selectedText).not.toContain('Reply text should not be captured.');
    expect(result.contentBlocks).toEqual([
      { type: 'text', text: 'Anatomy of the .claude/ folder' },
      {
        type: 'text',
        text: "This guide walks through the entire anatomy of the folder, from the files you'll use daily to the ones you'll set once and forget.",
      },
      {
        type: 'image',
        src: 'https://pbs.twimg.com/media/article-diagram?format=jpg&name=large',
        alt: 'Article diagram',
      },
    ]);

    document.body.innerHTML = '';
    window.history.replaceState({}, '', originalUrl || '/');
  });

  it('keeps X media references at their original text position', () => {
    const originalUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.replaceState({}, '', '/akshay_pachaar/status/2035341800739877091');
    document.title = 'Post / X';
    document.body.innerHTML = `
      <main>
        <section data-testid="primaryColumn">
          <article data-testid="tweet">
            <a href="/akshay_pachaar/status/2035341800739877091">Jun 10</a>
            <div data-testid="tweetText">First idea before the chart.</div>
            <a href="/akshay_pachaar/status/2035341800739877091/photo/1">
              <div data-testid="tweetPhoto">
                <img src="https://pbs.twimg.com/media/chart-one?format=jpg&name=small" alt="Chart">
              </div>
            </a>
            <div data-testid="tweetText">Second idea after the chart.</div>
          </article>
        </section>
      </main>
    `;

    const result = collectPageSnapshot('extract-page');

    expect(result.selectedText).toMatch(
      /First idea before the chart\.[\s\S]*!\[image\]\(https:\/\/pbs\.twimg\.com\/media\/chart-one\?format=jpg&name=large\)[\s\S]*Second idea after the chart\./,
    );
    expect(result.contentBlocks).toEqual([
      { type: 'text', text: 'First idea before the chart.' },
      {
        type: 'image',
        src: 'https://pbs.twimg.com/media/chart-one?format=jpg&name=large',
        alt: 'Chart',
      },
      { type: 'text', text: 'Second idea after the chart.' },
    ]);

    document.body.innerHTML = '';
    window.history.replaceState({}, '', originalUrl || '/');
  });

  it('chooses a non-empty X article when the first article is not the target content', () => {
    const originalUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.replaceState({}, '', '/akshay_pachaar/status/2035341800739877091');
    document.title = 'Post / X';
    document.body.innerHTML = `
      <main>
        <section data-testid="primaryColumn">
          <article data-testid="tweet">
            <a href="/other_author/status/111">Unrelated post</a>
          </article>
          <article data-testid="tweet">
            <a href="/akshay_pachaar/status/2035341800739877091">Jun 10</a>
            <div data-testid="tweetText">The target post body should be captured.</div>
            <div data-testid="tweetPhoto">
              <img src="https://pbs.twimg.com/media/target-image?format=jpg&name=small" alt="Target">
            </div>
          </article>
        </section>
      </main>
    `;

    const result = collectPageSnapshot('extract-page');

    expect(result.selectedText).toContain('The target post body should be captured.');
    expect(result.selectedText).toContain(
      '![image](https://pbs.twimg.com/media/target-image?format=jpg&name=large)',
    );

    document.body.innerHTML = '';
    window.history.replaceState({}, '', originalUrl || '/');
  });

  it('does not generate an empty extract-page prompt when X DOM text is unavailable', () => {
    const originalUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.replaceState({}, '', '/akshay_pachaar/status/2035341800739877091');
    document.title = 'Akshay 🚀 on X: "Anatomy of the .claude/ folder" / X';
    document.body.innerHTML = '<main><section data-testid="primaryColumn"></section></main>';

    const result = collectPageSnapshot('extract-page');

    expect(result.selectedText).toContain('Anatomy of the .claude/ folder');
    expect(result.selectedText?.trim()).not.toBe('');

    document.body.innerHTML = '';
    window.history.replaceState({}, '', originalUrl || '/');
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
        selectedText: `Look at ![image](${mediaUrl})`,
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
    expect(prepared.context.selectedText).toContain('![image](attachments/image-2.jpg)');
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
        selectedText: `First idea before the chart.\n\n![image](${mediaUrl})\n\nSecond idea after the chart.`,
        selectedHtml: `<p>First idea before the chart.</p><img src="${mediaUrl}"><p>Second idea after the chart.</p>`,
        selectedImages: [{ src: mediaUrl, alt: 'Chart' }],
        contentBlocks: [
          { type: 'text', text: 'First idea before the chart.' },
          { type: 'image', src: mediaUrl, alt: 'Chart' },
          { type: 'text', text: 'Second idea after the chart.' },
        ],
      }),
    );

    expect(prepared.context.selectedText).toMatch(
      /First idea before the chart\.[\s\S]*!\[image\]\(attachments\/chart-one-2\.jpg\)[\s\S]*Second idea after the chart\./,
    );
    expect(prepared.context.contentBlocks).toEqual([
      { type: 'text', text: 'First idea before the chart.' },
      { type: 'image', src: 'attachments/chart-one-2.jpg', alt: 'Chart' },
      { type: 'text', text: 'Second idea after the chart.' },
    ]);
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
        selectedText: `First paragraph introduces the architecture.\n\n![image](${mediaUrl})\n\nSecond paragraph explains self-attention.`,
        selectedHtml: `<p>First paragraph introduces the architecture.</p><img src="${mediaUrl}"><p>Second paragraph explains self-attention.</p>`,
        selectedImages: [{ src: mediaUrl, alt: 'Attention diagram' }],
        contentBlocks: [
          { type: 'text', text: 'First paragraph introduces the architecture.' },
          { type: 'image', src: mediaUrl, alt: 'Attention diagram' },
          { type: 'text', text: 'Second paragraph explains self-attention.' },
        ],
      }),
    );

    expect(prepared.context.selectedText).toMatch(
      /First paragraph introduces the architecture\.[\s\S]*!\[image\]\(attachments\/transformer-attention\.png\)[\s\S]*Second paragraph explains self-attention\./,
    );
    expect(prepared.context.contentBlocks).toEqual([
      { type: 'text', text: 'First paragraph introduces the architecture.' },
      { type: 'image', src: 'attachments/transformer-attention.png', alt: 'Attention diagram' },
      { type: 'text', text: 'Second paragraph explains self-attention.' },
    ]);
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
});
