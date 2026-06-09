export type CaptureAction = 'generate-doc' | 'save-selection' | 'save-media' | 'extract-page';

export type ApiCaptureAction = 'generate_doc' | 'save';

export interface CapturedImage {
  src: string;
  alt?: string;
}

export interface PageSnapshot {
  pageUrl: string;
  pageTitle: string;
  description?: string;
  author?: string;
  siteName?: string;
  favicon?: string;
  language?: string;
  selectedText?: string;
  selectedHtml?: string;
  selectedImages: CapturedImage[];
}

export interface ActionContext extends PageSnapshot {
  action: CaptureAction;
  mediaUrl?: string;
  linkUrl?: string;
}

export interface PendingAction {
  id: string;
  action: CaptureAction;
  context: ActionContext;
  autoRun: boolean;
  customPrompt?: string;
  createdAt: number;
}

export interface CaptureRequestBody {
  action: ApiCaptureAction;
  content: string;
  image_url: string | null;
  page_url: string;
  page_title: string;
}
