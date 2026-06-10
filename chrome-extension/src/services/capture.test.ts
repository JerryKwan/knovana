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
