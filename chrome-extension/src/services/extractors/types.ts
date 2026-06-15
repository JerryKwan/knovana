import type { CapturedImage } from '../../types/capture';

export interface ExtractedContent {
  pageTitle: string;
  selectedHtml: string;
  selectedImages: CapturedImage[];
  description?: string;
  author?: string;
  siteName?: string;
  language?: string;
}

export interface SiteExtractor {
  match: (url: URL) => boolean;
  extract: (url: URL, doc: Document) => Promise<ExtractedContent | null>;
}
