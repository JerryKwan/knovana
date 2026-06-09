import { getSettings } from './storage';
import type {
  ActionContext,
  ApiCaptureAction,
  CaptureAction,
  CaptureRequestBody,
  PageSnapshot,
  PendingAction,
} from '../types/capture';

type ChromeMenuInfo = chrome.contextMenus.OnClickData;

export function collectPageSnapshot(): PageSnapshot {
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

  if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    const container = document.createElement('div');
    for (let index = 0; index < selection.rangeCount; index += 1) {
      container.append(selection.getRangeAt(index).cloneContents());
    }
    selectedHtml = container.innerHTML;
    selectedText = cleanNewlines(extractTextWithNewlines(container)) || selection.toString().trim();
    selectedImages = Array.from(container.querySelectorAll('img'))
      .map((image) => ({ src: image.src, alt: image.alt || undefined }))
      .filter((image) => Boolean(image.src));
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
  };
  return labels[action];
}

function toApiAction(action: CaptureAction): ApiCaptureAction {
  if (action === 'generate-doc') return 'generate_doc';
  return 'save';
}

function toCaptureContent(action: CaptureAction, context: ActionContext): string {
  if (action === 'save-media') {
    return context.mediaUrl ? `Media: ${context.mediaUrl}` : '';
  }

  return context.selectedText || context.selectedHtml || context.description || context.pageUrl;
}

export async function downloadAndUploadAsset(
  url: string,
): Promise<{ filename: string; url: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const blob = await response.blob();

    // Get original filename or extension from URL
    let filename = url.split('/').pop()?.split('?')[0] || 'file';
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
    } else {
      // Clean filename
      filename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
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
      throw new Error(`Upload failed: ${res.statusText}`);
    }
    return (await res.json()) as { filename: string; url: string };
  } catch (error) {
    console.error('Failed to download and upload asset:', url, error);
    return null;
  }
}
