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
  const selectedText = selection && !selection.isCollapsed ? selection.toString().trim() : '';
  let selectedHtml = '';
  let selectedImages: Array<{ src: string; alt?: string }> = [];

  if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    const container = document.createElement('div');
    for (let index = 0; index < selection.rangeCount; index += 1) {
      container.append(selection.getRangeAt(index).cloneContents());
    }
    selectedHtml = container.innerHTML;
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
    imageUrl: info.srcUrl,
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
    image_url: context.imageUrl ?? null,
    page_url: context.pageUrl,
    page_title: context.pageTitle,
  };
}

export function actionLabel(action: CaptureAction): string {
  const labels: Record<CaptureAction, string> = {
    summarize: '生成摘要',
    'generate-doc': '生成知识文档',
    'save-selection': '保存选区',
    'save-image': '保存图片',
    'save-link': '保存链接',
    'save-page': '保存页面',
  };
  return labels[action];
}

function toApiAction(action: CaptureAction): ApiCaptureAction {
  if (action === 'summarize') return 'summarize';
  if (action === 'generate-doc') return 'generate_doc';
  return 'save';
}

function toCaptureContent(action: CaptureAction, context: ActionContext): string {
  if (action === 'save-image') {
    return context.imageUrl ? `Image: ${context.imageUrl}` : '';
  }

  if (action === 'save-link') {
    return context.linkUrl ? `Link: ${context.linkUrl}` : '';
  }

  if (action === 'save-page') {
    const parts = [
      context.description ? `Description: ${context.description}` : '',
      context.siteName ? `Site: ${context.siteName}` : '',
      context.author ? `Author: ${context.author}` : '',
      `URL: ${context.pageUrl}`,
    ];
    return parts.filter(Boolean).join('\n');
  }

  return context.selectedText || context.selectedHtml || context.description || context.pageUrl;
}
