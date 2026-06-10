export type CaptureAction = 'generate-doc' | 'save-selection' | 'save-media' | 'extract-page';

export type ApiCaptureAction = 'generate_doc' | 'save';

export interface CapturedImage {
  src: string;
  alt?: string;
}

export type CapturedContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; src: string; alt?: string };

export type UploadedCaptureAssetKind = 'primary-media' | 'content-image';

export interface UploadedCaptureAsset {
  kind: UploadedCaptureAssetKind;
  sourceUrl: string;
  filename: string;
  path: string;
  url: string;
  size?: number;
  mimeType?: string;
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
  contentBlocks?: CapturedContentBlock[];
}

export interface ActionContext extends PageSnapshot {
  action: CaptureAction;
  mediaUrl?: string;
  mediaLocalPath?: string;
  linkUrl?: string;
  uploadedAssets?: UploadedCaptureAsset[];
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
