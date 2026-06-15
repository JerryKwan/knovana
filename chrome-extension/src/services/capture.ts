import TurndownService from 'turndown';
import * as cheerio from 'cheerio';
import { DOMParser } from 'linkedom';

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

function normalizeCapturedMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
        return { original: img.src, asset, alt: img.alt };
      }),
    );

    if (selectedHtml) {
      const $ = cheerio.load(selectedHtml);
      for (const item of uploadedImages) {
        uploadedAssets.push(item.asset);
        // Robust iteration to find and replace img src and alt
        $('img').each((_, imgEl) => {
          const currentSrc = $(imgEl).attr('src');
          if (currentSrc === item.original || currentSrc === encodeURI(item.original)) {
            $(imgEl).attr('src', item.asset.path);
            if (item.alt && !$(imgEl).attr('alt')) {
              $(imgEl).attr('alt', item.alt);
            }
          }
        });
      }
      selectedHtml = $('body').html() || selectedHtml;
    }

    for (const item of uploadedImages) {
      selectedText = replaceMediaReference(selectedText, item.original, item.asset.path);
    }
  }

  // Convert HTML to Markdown using Turndown in the background script
  if (selectedHtml) {
    const $ = cheerio.load(selectedHtml);

    // Convert styled spans to semantic HTML elements
    $('span').each((_, spanEl) => {
      const style = $(spanEl).attr('style') || '';
      const hasBold = /font-weight\s*:\s*(bold|700|800|900)/i.test(style);
      const hasItalic = /font-style\s*:\s*italic/i.test(style);
      const hasUnderline = /text-decoration\s*:\s*underline/i.test(style);

      let innerHtml = $(spanEl).html() || '';

      if (hasBold) {
        innerHtml = `<strong>${innerHtml}</strong>`;
      }
      if (hasItalic) {
        innerHtml = `<em>${innerHtml}</em>`;
      }
      if (hasUnderline) {
        innerHtml = `<u>${innerHtml}</u>`;
      }

      if (hasBold || hasItalic || hasUnderline) {
        $(spanEl).html(innerHtml);
      }
    });

    selectedHtml = $('body').html() || selectedHtml;

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      hr: '---',
    });
    // Add custom rule to prevent double escaping of common characters (removed 'span')
    turndownService.keep(['iframe', 'math'] as unknown as (keyof HTMLElementTagNameMap)[]);

    // Add custom image rule to default empty alt to 'image'
    turndownService.addRule('images', {
      filter: 'img',
      replacement: function (_content, node) {
        const img = node as HTMLImageElement;
        const alt = img.getAttribute('alt') || img.getAttribute('aria-label') || 'image';
        const src = img.getAttribute('src') || '';
        return `![${alt}](${src})`;
      },
    });

    const doc = new DOMParser().parseFromString(selectedHtml, 'text/html');
    const markdown = turndownService.turndown(doc as unknown as Document);
    selectedText = normalizeCapturedMarkdown(markdown);
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
