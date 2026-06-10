import { getSettings } from './storage';
import type {
  ActionContext,
  ApiCaptureAction,
  CaptureAction,
  CapturedContentBlock,
  CaptureRequestBody,
  PageSnapshot,
  PendingAction,
  UploadedCaptureAsset,
} from '../types/capture';
import type { AttachmentUploadResponse } from '../types/api';

type ChromeMenuInfo = chrome.contextMenus.OnClickData;

export interface PreparedCaptureUploads {
  context: ActionContext;
  mediaLocalPath: string;
  imagesSection: string;
  uploadedAssets: UploadedCaptureAsset[];
}

function normalizeCapturedMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function contentBlocksToMarkdown(blocks: CapturedContentBlock[]): string {
  return normalizeCapturedMarkdown(
    blocks
      .map((block) => {
        if (block.type === 'text') {
          return block.text.trim();
        }
        return `![image](${block.src})`;
      })
      .filter(Boolean)
      .join('\n\n'),
  );
}

export function collectPageSnapshot(action?: CaptureAction): PageSnapshot {
  const getMeta = (name: string) =>
    document.querySelector<HTMLMetaElement>(`meta[name="${name}"], meta[property="${name}"]`)
      ?.content;

  const favicon =
    document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href ??
    document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.href;

  const selection = window.getSelection();
  let selectedText = '';
  let selectedHtml = '';
  let selectedImages: Array<{ src: string; alt?: string }> = [];
  let contentBlocks: CapturedContentBlock[] | undefined;
  type SnapshotContent = Pick<
    PageSnapshot,
    'selectedText' | 'selectedHtml' | 'selectedImages' | 'contentBlocks'
  >;

  function resolveAbsoluteUrl(url: string): string {
    try {
      return new URL(url, document.baseURI).href;
    } catch {
      return url;
    }
  }

  function normalizeCapturedImageUrl(url: string): string {
    const absolute = resolveAbsoluteUrl(url);
    try {
      const parsed = new URL(absolute);
      if (parsed.hostname.endsWith('twimg.com') && parsed.pathname.includes('/media/')) {
        parsed.searchParams.set('name', 'large');
      }
      return parsed.href;
    } catch {
      return absolute;
    }
  }

  function getSrcsetCandidate(srcset: string): string {
    const candidates = srcset
      .split(',')
      .map((item) => item.trim().split(/\s+/)[0])
      .filter(Boolean);
    return candidates[candidates.length - 1] || '';
  }

  function getBackgroundImageSource(element: Element): string {
    const inlineBackground =
      element instanceof HTMLElement
        ? element.style.backgroundImage || element.style.background
        : '';
    const computedBackground =
      typeof window.getComputedStyle === 'function'
        ? window.getComputedStyle(element).backgroundImage
        : '';
    const match = (inlineBackground || computedBackground).match(/url\((['"]?)(.*?)\1\)/);
    return match?.[2] || '';
  }

  function getImageSource(image: Element): string {
    const htmlImage = image instanceof HTMLImageElement ? image : null;
    const srcAttr =
      image.getAttribute('data-src') ||
      image.getAttribute('data-original-src') ||
      image.getAttribute('data-original') ||
      htmlImage?.currentSrc ||
      getSrcsetCandidate(image.getAttribute('data-srcset') || image.getAttribute('srcset') || '') ||
      image.getAttribute('src') ||
      getBackgroundImageSource(image) ||
      '';

    return srcAttr ? normalizeCapturedImageUrl(srcAttr) : '';
  }

  function isCapturableImageUrl(src: string): boolean {
    return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:');
  }

  function toCapturedImage(image: HTMLImageElement): { src: string; alt?: string } | null {
    const src = getImageSource(image);
    if (!src || !isCapturableImageUrl(src)) {
      return null;
    }
    return { src, alt: image.alt || undefined };
  }

  function toCapturedElementImage(element: Element): { src: string; alt?: string } | null {
    const src = getImageSource(element);
    if (!src || !isCapturableImageUrl(src)) {
      return null;
    }
    const alt =
      element instanceof HTMLImageElement
        ? element.alt
        : element.getAttribute('aria-label') || element.getAttribute('alt') || undefined;
    return { src, alt: alt || undefined };
  }

  function collectImages(root: ParentNode, selector = 'img'): Array<{ src: string; alt?: string }> {
    const seen = new Set<string>();
    const images: Array<{ src: string; alt?: string }> = [];

    Array.from(root.querySelectorAll<HTMLImageElement>(selector)).forEach((image) => {
      const captured = toCapturedImage(image);
      if (!captured || seen.has(captured.src)) {
        return;
      }
      seen.add(captured.src);
      images.push(captured);
    });

    return images;
  }

  function extractTextWithNewlines(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as Element;
    const tagName = element.tagName.toUpperCase();

    if (tagName === 'BR') {
      return '\n';
    }

    if (tagName === 'IMG') {
      const src = getImageSource(element);
      if (src && isCapturableImageUrl(src)) {
        return `\n\n![image](${src})\n\n`;
      }
      return '';
    }

    let text = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      text += extractTextWithNewlines(element.childNodes[i]);
    }

    const blockTags = [
      'P',
      'DIV',
      'H1',
      'H2',
      'H3',
      'H4',
      'H5',
      'H6',
      'LI',
      'TR',
      'BLOCKQUOTE',
      'PRE',
    ];
    if (blockTags.includes(tagName)) {
      const trimmed = text.trim();
      if (trimmed) {
        return `\n\n${trimmed}\n\n`;
      }
      return '';
    }

    return text;
  }

  function cleanNewlines(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function contentBlocksToMarkdownLocal(blocks: CapturedContentBlock[]): string {
    return cleanNewlines(
      blocks
        .map((block) => {
          if (block.type === 'text') {
            return block.text.trim();
          }
          return `![image](${block.src})`;
        })
        .filter(Boolean)
        .join('\n\n'),
    );
  }

  function imagesFromContentBlocksLocal(
    blocks: CapturedContentBlock[],
  ): Array<{ src: string; alt?: string }> {
    const seen = new Set<string>();
    const images: Array<{ src: string; alt?: string }> = [];

    for (const block of blocks) {
      if (block.type !== 'image' || seen.has(block.src)) {
        continue;
      }
      seen.add(block.src);
      images.push({ src: block.src, alt: block.alt });
    }

    return images;
  }

  function fallbackTitleText(): string {
    const title = document.title.replace(/\s+[-/]\s+X$/i, '').trim();
    return title && title !== 'X' ? title : '';
  }

  function buildFallbackMarkdown(images: Array<{ src: string; alt?: string }>): string {
    const textParts = [
      getMeta('description') ?? getMeta('og:description') ?? '',
      fallbackTitleText(),
    ]
      .map((item) => cleanNewlines(item))
      .filter(Boolean);
    const uniqueText = Array.from(new Set(textParts));
    const imageParts = images.map((image) => `![image](${image.src})`);
    return cleanNewlines([...uniqueText, ...imageParts].join('\n\n'));
  }

  function extractPlainTextWithBreaks(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as Element;
    const tagName = element.tagName.toUpperCase();
    if (tagName === 'BR') {
      return '\n';
    }
    if (tagName === 'IMG') {
      return element.getAttribute('alt') || '';
    }

    let text = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      text += extractPlainTextWithBreaks(element.childNodes[i]);
    }
    if (['P', 'DIV', 'LI', 'BLOCKQUOTE'].includes(tagName)) {
      const trimmed = text.trim();
      return trimmed ? `\n${trimmed}\n` : '';
    }
    return text;
  }

  function extractGenericContentBlocks(root: Element): CapturedContentBlock[] {
    const blocks: CapturedContentBlock[] = [];
    const seenText = new Set<string>();
    const seenImages = new Map<string, CapturedContentBlock & { type: 'image' }>();
    const textBlockSelector = [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'li',
      'blockquote',
      'pre',
      'figcaption',
      'td',
      'th',
    ].join(',');
    const imageSelector = ['img', 'picture img', 'figure img', '[style*="background-image"]'].join(
      ',',
    );

    function appendTextBlock(element: Element): void {
      const text = cleanNewlines(extractPlainTextWithBreaks(element));
      if (!text || seenText.has(text)) {
        return;
      }
      seenText.add(text);
      blocks.push({ type: 'text', text });
    }

    function appendCapturedImage(captured: { src: string; alt?: string } | null): void {
      if (!captured) {
        return;
      }
      const existingImage = seenImages.get(captured.src);
      if (existingImage) {
        if (!existingImage.alt && captured.alt) {
          existingImage.alt = captured.alt;
        }
        return;
      }
      const block: CapturedContentBlock & { type: 'image' } = {
        type: 'image',
        src: captured.src,
        alt: captured.alt,
      };
      seenImages.set(captured.src, block);
      blocks.push(block);
    }

    function appendImageBlock(element: Element): void {
      const candidates = element.matches(imageSelector)
        ? [element, ...Array.from(element.querySelectorAll<Element>(imageSelector))]
        : Array.from(element.querySelectorAll<Element>(imageSelector));

      for (const candidate of candidates) {
        appendCapturedImage(toCapturedElementImage(candidate));
      }
    }

    function traverse(node: Node): void {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const element = node as Element;
      if (element.matches(imageSelector)) {
        appendImageBlock(element);
        return;
      }

      if (element.matches(textBlockSelector)) {
        appendTextBlock(element);
        return;
      }

      if (
        element.tagName.toUpperCase() === 'DIV' &&
        !element.querySelector(`${textBlockSelector}, ${imageSelector}`)
      ) {
        appendTextBlock(element);
        return;
      }

      for (let index = 0; index < element.childNodes.length; index += 1) {
        traverse(element.childNodes[index]);
      }
    }

    traverse(root);
    return blocks;
  }

  function getXContentId(url: URL): string | null {
    return url.pathname.match(/\/(?:status(?:es)?|article)\/(\d+)/)?.[1] ?? null;
  }

  function isXContentPage(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    const isXHost =
      host === 'x.com' ||
      host.endsWith('.x.com') ||
      host === 'twitter.com' ||
      host.endsWith('.twitter.com');
    const hasTweetDom = Boolean(document.querySelector('article[data-testid="tweet"]'));
    return Boolean(getXContentId(url) && (isXHost || hasTweetDom));
  }

  function articleLinksToXContent(article: Element, contentId: string): boolean {
    return Array.from(
      article.querySelectorAll<HTMLAnchorElement>(
        'a[href*="/status/"], a[href*="/statuses/"], a[href*="/article/"]',
      ),
    ).some((link) => {
      const href = link.getAttribute('href') || link.href || '';
      return (
        href.includes(`/status/${contentId}`) ||
        href.includes(`/statuses/${contentId}`) ||
        href.includes(`/article/${contentId}`)
      );
    });
  }

  function getXArticleScore(article: Element, contentId: string, imageSelector: string): number {
    let score = 0;
    if (articleLinksToXContent(article, contentId)) {
      score += 1000;
    }
    score += article.querySelectorAll('[data-testid="tweetText"]').length * 100;
    score += article.querySelectorAll(imageSelector).length * 20;
    score += Math.min(cleanNewlines(extractPlainTextWithBreaks(article)).length, 400);
    return score;
  }

  function chooseXTargetArticle(
    articles: HTMLElement[],
    contentId: string,
    imageSelector: string,
  ): HTMLElement | undefined {
    return articles
      .map((article, index) => ({
        article,
        index,
        score: getXArticleScore(article, contentId, imageSelector),
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.article;
  }

  function extractXContentPage(url: URL): SnapshotContent | null {
    const contentId = getXContentId(url);
    if (!contentId) {
      return null;
    }

    const scope =
      document.querySelector('[data-testid="primaryColumn"]') ||
      document.querySelector('main') ||
      document.body;
    const blocks: CapturedContentBlock[] = [];
    const seenText = new Set<string>();
    const seenImages = new Map<string, CapturedContentBlock & { type: 'image' }>();
    const textSelector = [
      '[data-testid="tweetText"]',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'li',
      'blockquote',
      'pre',
      'figcaption',
      'div[lang]',
      '[dir="auto"][lang]',
    ].join(',');
    const imageSelector = [
      '[data-testid="tweetPhoto"]',
      '[data-testid="tweetPhoto"] img',
      '[data-testid="tweetPhoto"] [style*="pbs.twimg.com/media/"]',
      'a[href*="/photo/"] img',
      'a[href*="/media/"] img',
      'a[href*="/media/"] [style*="pbs.twimg.com/media/"]',
      'img[src*="pbs.twimg.com/media/"]',
      '[style*="pbs.twimg.com/media/"]',
    ].join(',');
    const articles = Array.from(
      scope.querySelectorAll<HTMLElement>('article[data-testid="tweet"], article'),
    );
    const targetArticle = chooseXTargetArticle(articles, contentId, imageSelector);
    if (!targetArticle) {
      return null;
    }
    const targetRoot =
      targetArticle.closest<HTMLElement>('[data-testid="cellInnerDiv"]') || targetArticle;

    function belongsToTargetContent(element: Element): boolean {
      const closestTweetArticle = element.closest('article[data-testid="tweet"]');
      return !closestTweetArticle || closestTweetArticle === targetArticle;
    }

    function hasXTextBlock(blocksToCheck: CapturedContentBlock[]): boolean {
      return blocksToCheck.some((block) => block.type === 'text' && block.text.trim().length > 0);
    }

    function isXChromeElement(element: Element): boolean {
      return Boolean(
        element.closest(
          [
            'button',
            '[role="button"]',
            '[role="menu"]',
            '[role="menuitem"]',
            '[data-testid="app-bar-close"]',
            '[data-testid="reply"]',
            '[data-testid="retweet"]',
            '[data-testid="like"]',
            '[data-testid="bookmark"]',
            '[data-testid="share"]',
            '[data-testid="caret"]',
          ].join(','),
        ),
      );
    }

    function isLikelyXUiText(text: string, element: Element): boolean {
      const normalized = cleanNewlines(text).replace(/\s+/g, ' ').trim();
      if (!normalized) {
        return true;
      }
      if (isXChromeElement(element)) {
        return true;
      }
      if (/^@[\w_]{1,20}$/.test(normalized)) {
        return true;
      }
      if (/^[·•]+$/.test(normalized)) {
        return true;
      }
      if (/^\d+(?:[.,]\d+)?[KMB]?$/.test(normalized)) {
        return true;
      }
      if (/^\d+[smhd]$/.test(normalized)) {
        return true;
      }
      if (/^\d+\s*(?:views?|likes?|reposts?|replies|bookmarks?)$/i.test(normalized)) {
        return true;
      }
      if (
        /^(back|article|home|search|notifications|messages|lists|bookmarks|communities|premium|profile|more|post|reply|repost|like|share|follow|subscribe|show more|translate post|views?|image)$/i.test(
          normalized,
        )
      ) {
        return true;
      }
      return normalized.length < 8 && !/[.!?。！？:：]/.test(normalized);
    }

    function appendTextBlock(element: Element): void {
      const text = cleanNewlines(extractPlainTextWithBreaks(element));
      if (!text || isLikelyXUiText(text, element) || seenText.has(text)) {
        return;
      }
      seenText.add(text);
      blocks.push({ type: 'text', text });
    }

    function appendCapturedImage(captured: { src: string; alt?: string } | null): void {
      if (!captured) {
        return;
      }
      const existingImage = seenImages.get(captured.src);
      if (existingImage) {
        if (!existingImage.alt && captured.alt) {
          existingImage.alt = captured.alt;
        }
        return;
      }
      const block: CapturedContentBlock & { type: 'image' } = {
        type: 'image',
        src: captured.src,
        alt: captured.alt,
      };
      seenImages.set(captured.src, block);
      blocks.push(block);
    }

    function appendImageBlock(element: Element): void {
      const candidates = element.matches(imageSelector)
        ? [element, ...Array.from(element.querySelectorAll<Element>(imageSelector))]
        : Array.from(element.querySelectorAll<Element>(imageSelector));

      for (const candidate of candidates) {
        if (belongsToTargetContent(candidate)) {
          appendCapturedImage(toCapturedElementImage(candidate));
        }
      }
    }

    function prependMetadataFallbackText(): void {
      if (hasXTextBlock(blocks)) {
        return;
      }

      const fallbackText = [
        getMeta('description') ?? getMeta('og:description') ?? '',
        fallbackTitleText(),
        url.href,
      ]
        .map((item) => cleanNewlines(item))
        .filter(Boolean)
        .filter((item, index, items) => items.indexOf(item) === index)
        .join('\n\n');

      if (fallbackText) {
        blocks.unshift({ type: 'text', text: fallbackText });
      }
    }

    function traverseOrderedContent(node: Node): void {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const element = node as Element;
      if (!belongsToTargetContent(element)) {
        return;
      }

      if (
        element !== targetArticle &&
        element !== targetRoot &&
        element.matches('article[data-testid="tweet"], article')
      ) {
        return;
      }

      if (element.matches(imageSelector)) {
        appendImageBlock(element);
        return;
      }

      if (element.matches(textSelector)) {
        appendTextBlock(element);
        return;
      }

      if (
        element.tagName.toUpperCase() === 'DIV' &&
        !element.querySelector(`${textSelector}, ${imageSelector}`)
      ) {
        appendTextBlock(element);
        return;
      }

      for (let index = 0; index < element.childNodes.length; index += 1) {
        traverseOrderedContent(element.childNodes[index]);
      }
    }

    traverseOrderedContent(targetRoot);

    if (blocks.length === 0) {
      const fallbackText = cleanNewlines(extractPlainTextWithBreaks(targetRoot));
      if (fallbackText) {
        blocks.unshift({ type: 'text', text: fallbackText });
      }
    }
    prependMetadataFallbackText();

    const selectedText = contentBlocksToMarkdownLocal(blocks);
    const selectedImages = imagesFromContentBlocksLocal(blocks);
    if (!selectedText && selectedImages.length === 0) {
      return null;
    }

    return {
      selectedHtml: targetRoot.innerHTML || '',
      selectedText,
      selectedImages,
      contentBlocks: blocks,
    };
  }

  function extractGenericPageContent(): SnapshotContent {
    const docClone = document.cloneNode(true) as Document;
    const body = docClone.body || docClone.documentElement;

    const noiseTags = [
      'script',
      'style',
      'noscript',
      'iframe',
      'svg',
      'form',
      'button',
      'input',
      'textarea',
      'select',
      'dialog',
      'nav',
      'header',
      'footer',
      'aside',
    ];
    body.querySelectorAll(noiseTags.join(',')).forEach((el) => el.remove());

    const noisePattern =
      /(^|[\s_-])(nav|menu|footer|header|aside|sidebar|comments?|ads?|advert|advertisement|sponsored?|social|share|sharing|related|recommend(?:ation)?|breadcrumbs?|pagination|banner|popup|widget)(?=$|[\s_-])/i;
    body.querySelectorAll('*').forEach((el) => {
      const descriptor = `${el.id || ''} ${el.getAttribute('class') || ''}`;
      if (noisePattern.test(descriptor)) {
        const textLen = el.textContent?.trim().length || 0;
        if (textLen < 200) {
          el.remove();
        }
      }
    });

    const targetElement =
      body.querySelector('article') ||
      body.querySelector('main') ||
      body.querySelector('[role="main"]') ||
      body.querySelector('#content') ||
      body;

    const contentBlocks = extractGenericContentBlocks(targetElement);
    const selectedTextFromBlocks = contentBlocksToMarkdownLocal(contentBlocks);
    const selectedImages =
      contentBlocks.length > 0
        ? imagesFromContentBlocksLocal(contentBlocks)
        : collectImages(targetElement);

    return {
      selectedHtml: targetElement.innerHTML || '',
      selectedText: selectedTextFromBlocks || cleanNewlines(extractTextWithNewlines(targetElement)),
      selectedImages,
      contentBlocks: contentBlocks.length > 0 ? contentBlocks : undefined,
    };
  }

  function extractSiteSpecificPageContent(): SnapshotContent | null {
    try {
      const url = new URL(window.location.href);
      if (isXContentPage(url)) {
        return extractXContentPage(url);
      }
    } catch {
      return null;
    }
    return null;
  }

  if (action === 'extract-page') {
    const extracted = extractSiteSpecificPageContent() || extractGenericPageContent();
    selectedHtml = extracted.selectedHtml || '';
    selectedText = extracted.selectedText || '';
    selectedImages = extracted.selectedImages;
    contentBlocks = extracted.contentBlocks;
    if (!selectedText.trim()) {
      selectedText = buildFallbackMarkdown(selectedImages);
    }
  } else if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    const container = document.createElement('div');
    for (let index = 0; index < selection.rangeCount; index += 1) {
      container.append(selection.getRangeAt(index).cloneContents());
    }
    selectedHtml = container.innerHTML;
    contentBlocks = extractGenericContentBlocks(container);
    selectedText =
      contentBlocksToMarkdownLocal(contentBlocks) ||
      cleanNewlines(extractTextWithNewlines(container)) ||
      selection.toString().trim();
    selectedImages =
      contentBlocks.length > 0
        ? imagesFromContentBlocksLocal(contentBlocks)
        : collectImages(container);
    if (contentBlocks.length === 0) {
      contentBlocks = undefined;
    }
  }

  return {
    pageUrl: window.location.href,
    pageTitle: document.title,
    description: getMeta('description') ?? getMeta('og:description'),
    author: getMeta('author'),
    siteName: getMeta('og:site_name'),
    favicon,
    language: document.documentElement.lang || undefined,
    selectedText,
    selectedHtml,
    selectedImages,
    contentBlocks,
  };
}

export function contextFromMenu(
  action: CaptureAction,
  info: ChromeMenuInfo,
  snapshot: PageSnapshot,
): ActionContext {
  const selectedText = info.selectionText?.trim() || snapshot.selectedText;

  return {
    ...snapshot,
    action,
    selectedText,
    mediaUrl: info.srcUrl,
    linkUrl: info.linkUrl,
  };
}

export function createPendingAction(
  action: CaptureAction,
  context: ActionContext,
  autoRun = true,
): PendingAction {
  return {
    id: crypto.randomUUID(),
    action,
    context,
    autoRun,
    createdAt: Date.now(),
  };
}

export async function prepareCaptureUploads(
  action: CaptureAction,
  context: ActionContext,
): Promise<PreparedCaptureUploads> {
  const uploadedAssets = [...(context.uploadedAssets ?? [])];
  let mediaLocalPath = context.mediaLocalPath || '';
  let selectedText = context.selectedText || '';
  let selectedHtml = context.selectedHtml || '';
  let contentBlocks = context.contentBlocks ? [...context.contentBlocks] : undefined;

  if (action === 'save-media' && context.mediaUrl && !mediaLocalPath) {
    const uploaded = await downloadAndUploadAsset(context.mediaUrl);
    const asset = toUploadedCaptureAsset('primary-media', context.mediaUrl, uploaded);
    uploadedAssets.push(asset);
    mediaLocalPath = asset.path;
  }

  if (context.selectedImages && context.selectedImages.length > 0) {
    const uploadedImages = await Promise.all(
      context.selectedImages.map(async (img) => {
        const uploaded = await downloadAndUploadAsset(img.src);
        const asset = toUploadedCaptureAsset('content-image', img.src, uploaded);
        return { original: img.src, asset };
      }),
    );

    for (const item of uploadedImages) {
      uploadedAssets.push(item.asset);
      selectedHtml = replaceMediaReference(selectedHtml, item.original, item.asset.path);
      selectedText = replaceMediaReference(selectedText, item.original, item.asset.path);
      contentBlocks = replaceContentBlockMediaRefs(contentBlocks, item.original, item.asset.path);
    }
  }

  if (contentBlocks) {
    selectedText = contentBlocksToMarkdown(contentBlocks);
  }

  const imageAssets = uploadedAssets.filter((asset) => asset.kind === 'content-image');
  const imagesSection =
    imageAssets.length > 0
      ? '\n\n【捕获的媒体文件列表（仅用于核对附件，正文位置以整理/保存内容中的图片引用为准）】:\n' +
        imageAssets.map((asset) => `- ![media](${asset.path})`).join('\n')
      : '';

  return {
    context: {
      ...context,
      mediaLocalPath,
      selectedHtml,
      selectedText,
      contentBlocks,
      uploadedAssets,
    },
    mediaLocalPath,
    imagesSection,
    uploadedAssets,
  };
}

export function buildCaptureRequest(
  action: CaptureAction,
  context: ActionContext,
): CaptureRequestBody {
  const apiAction = toApiAction(action);
  const content = toCaptureContent(action, context);

  return {
    action: apiAction,
    content,
    image_url: context.mediaUrl ?? null,
    page_url: context.pageUrl,
    page_title: context.pageTitle,
  };
}

export function actionLabel(action: CaptureAction): string {
  const labels: Record<CaptureAction, string> = {
    'generate-doc': '整理成知识条目',
    'save-selection': '原样保存并标注',
    'save-media': '保存媒体文件',
    'extract-page': '整理整页正文',
  };
  return labels[action];
}

function toApiAction(action: CaptureAction): ApiCaptureAction {
  if (action === 'generate-doc' || action === 'extract-page') return 'generate_doc';
  return 'save';
}

function toCaptureContent(action: CaptureAction, context: ActionContext): string {
  if (action === 'save-media') {
    return context.mediaUrl ? `Media: ${context.mediaUrl}` : '';
  }

  return context.selectedText || context.selectedHtml || context.description || context.pageUrl;
}

export async function downloadAndUploadAsset(url: string): Promise<AttachmentUploadResponse> {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`下载媒体失败 (${response.status}): ${url}`);
  }
  const blob = await response.blob();

  // Keep the URL filename as a hint; the backend applies the final safety and conflict rules.
  let filename = filenameFromUrl(url) || 'file';
  if (!filename.includes('.')) {
    const mime = blob.type;
    let ext = '.png';
    if (mime === 'image/jpeg') ext = '.jpg';
    else if (mime === 'image/gif') ext = '.gif';
    else if (mime === 'image/webp') ext = '.webp';
    else if (mime === 'audio/mpeg') ext = '.mp3';
    else if (mime === 'audio/wav') ext = '.wav';
    else if (mime === 'audio/ogg') ext = '.ogg';
    else if (mime === 'video/mp4') ext = '.mp4';
    else if (mime === 'video/webm') ext = '.webm';
    filename = `${filename}${ext}`;
  }

  const formData = new FormData();
  formData.append('file', blob, filename);

  const settings = await getSettings();
  const headers = new Headers();
  if (settings.token) {
    headers.set('Authorization', `Bearer ${settings.token}`);
  }

  const res = await fetch(`${settings.backendUrl}/attachments`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`上传媒体失败 (${res.status} ${res.statusText}): ${url}`);
  }

  const result = (await res.json()) as AttachmentUploadResponse;
  if (!result.filename || !result.path) {
    throw new Error(`上传媒体失败: 后端未返回真实附件路径 (${url})`);
  }
  return result;
}

function toUploadedCaptureAsset(
  kind: UploadedCaptureAsset['kind'],
  sourceUrl: string,
  uploaded: AttachmentUploadResponse,
): UploadedCaptureAsset {
  return {
    kind,
    sourceUrl,
    filename: uploaded.filename,
    path: uploaded.path,
    url: uploaded.url,
    size: uploaded.size,
    mimeType: uploaded.mime_type,
  };
}

function replaceMediaReference(content: string, sourceUrl: string, localPath: string): string {
  if (!content || !sourceUrl) return content;
  let result = content.replaceAll(sourceUrl, localPath);
  result = result.replaceAll(sourceUrl.replaceAll('&', '&amp;'), localPath);
  try {
    result = result.replaceAll(encodeURI(sourceUrl), localPath);
  } catch {
    // Ignore malformed URL fragments from page markup.
  }
  return result;
}

function replaceContentBlockMediaRefs(
  blocks: CapturedContentBlock[] | undefined,
  sourceUrl: string,
  localPath: string,
): CapturedContentBlock[] | undefined {
  if (!blocks) {
    return undefined;
  }

  return blocks.map((block) =>
    block.type === 'image' && block.src === sourceUrl ? { ...block, src: localPath } : block,
  );
}

function filenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const leaf = parsed.pathname.split('/').pop() || '';
    return decodeURIComponent(leaf).trim();
  } catch {
    const leaf = url.split('/').pop()?.split('?')[0] || '';
    try {
      return decodeURIComponent(leaf).trim();
    } catch {
      return leaf.trim();
    }
  }
}
