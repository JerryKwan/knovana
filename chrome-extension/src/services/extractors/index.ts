import { xExtractor } from './x';
import { extractGenericContent } from './generic';
import type { ExtractedContent } from './types';
import type { CapturedImage } from '../../types/capture';

export async function extractContent(
  url: URL,
  doc: Document,
  selectionHtml?: string,
): Promise<ExtractedContent> {
  // 1. Selection capture
  if (selectionHtml && selectionHtml.trim()) {
    const tempDiv = doc.createElement('div');
    tempDiv.innerHTML = selectionHtml;

    const selectedImages: CapturedImage[] = [];
    const seen = new Set<string>();
    const images = tempDiv.querySelectorAll('img');

    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (
        src &&
        (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:'))
      ) {
        if (!seen.has(src)) {
          seen.add(src);
          selectedImages.push({
            src,
            alt: img.getAttribute('alt') || img.getAttribute('aria-label') || undefined,
          });
        }
      }
    });

    return {
      pageTitle: doc.title,
      selectedHtml: selectionHtml,
      selectedImages,
      language: doc.documentElement.lang || undefined,
    };
  }

  // 2. Site-specific extractors
  if (xExtractor.match(url)) {
    const extracted = await xExtractor.extract(url, doc);
    if (extracted) {
      return extracted;
    }
  }

  // 3. Generic fallback extractor
  return extractGenericContent(doc);
}
