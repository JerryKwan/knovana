import { getSettings } from './storage';
import type {
  ActionContext,
  ApiCaptureAction,
  CaptureAction,
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
  type SnapshotContent = Pick<PageSnapshot, 'selectedText' | 'selectedHtml' | 'selectedImages'>;

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

  function extractXContentPage(url: URL): SnapshotContent | null {
    const contentId = getXContentId(url);
    if (!contentId) {
      return null;
    }

    const scope =
      document.querySelector('[data-testid="primaryColumn"]') ||
      document.querySelector('main') ||
      document.body;
    const articles = Array.from(
      scope.querySelectorAll<HTMLElement>('article[data-testid="tweet"], article'),
    );
    const targetArticle =
      articles.find((article) => articleLinksToXContent(article, contentId)) || articles[0];
    if (!targetArticle) {
      return null;
    }

    const textSeen = new Set<string>();
    const textBlocks = Array.from(
      targetArticle.querySelectorAll<HTMLElement>('[data-testid="tweetText"]'),
    )
      .filter((element) => {
        const closestTweetArticle = element.closest('article[data-testid="tweet"]');
        return !closestTweetArticle || closestTweetArticle === targetArticle;
      })
      .map((element) => cleanNewlines(extractPlainTextWithBreaks(element)))
      .filter((text) => {
        if (!text || textSeen.has(text)) {
          return false;
        }
        textSeen.add(text);
        return true;
      });

    if (textBlocks.length === 0) {
      const fallbackText = cleanNewlines(extractPlainTextWithBreaks(targetArticle));
      if (fallbackText) {
        textBlocks.push(fallbackText);
      }
    }

    const xImages: Array<{ src: string; alt?: string }> = [];
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
    Array.from(targetArticle.querySelectorAll<Element>(imageSelector)).forEach((image) => {
      const closestTweetArticle = image.closest('article[data-testid="tweet"]');
      if (closestTweetArticle && closestTweetArticle !== targetArticle) {
        return;
      }
      const captured = toCapturedElementImage(image);
      if (!captured) {
        return;
      }
      const existingImage = xImages.find((item) => item.src === captured.src);
      if (existingImage) {
        if (!existingImage.alt && captured.alt) {
          existingImage.alt = captured.alt;
        }
        return;
      }
      xImages.push(captured);
    });

    const imageMarkdown = xImages.map((image) => `![image](${image.src})`);
    const selectedText = cleanNewlines([...textBlocks, ...imageMarkdown].join('\n\n'));
    if (!selectedText && xImages.length === 0) {
      return null;
    }

    return {
      selectedHtml: targetArticle.innerHTML || '',
      selectedText,
      selectedImages: xImages,
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

    return {
      selectedHtml: targetElement.innerHTML || '',
      selectedText: cleanNewlines(extractTextWithNewlines(targetElement)),
      selectedImages: collectImages(targetElement),
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
  } else if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    const container = document.createElement('div');
    for (let index = 0; index < selection.rangeCount; index += 1) {
      container.append(selection.getRangeAt(index).cloneContents());
    }
    selectedHtml = container.innerHTML;
    selectedText = cleanNewlines(extractTextWithNewlines(container)) || selection.toString().trim();
    selectedImages = collectImages(container);
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
    }
  }

  const imageAssets = uploadedAssets.filter((asset) => asset.kind === 'content-image');
  const imagesSection =
    imageAssets.length > 0
      ? '\n\n【捕获的媒体文件列表】:\n' +
        imageAssets.map((asset) => `- ![media](${asset.path})`).join('\n')
      : '';

  return {
    context: {
      ...context,
      mediaLocalPath,
      selectedHtml,
      selectedText,
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
