export type CaptureAction =
  | 'summarize'
  | 'generate-doc'
  | 'save-selection'
  | 'save-image'
  | 'save-link'
  | 'save-page';

export type ApiCaptureAction = 'summarize' | 'generate_doc' | 'save';

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
  imageUrl?: string;
  linkUrl?: string;
}

export interface PendingAction {
  id: string;
  action: CaptureAction;
  context: ActionContext;
  autoRun: boolean;
  createdAt: number;
}

export interface CaptureRequestBody {
  action: ApiCaptureAction;
  content: string;
  image_url: string | null;
  page_url: string;
  page_title: string;
}
