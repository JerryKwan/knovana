import Defuddle from 'defuddle';
import type { ExtractedContent } from './types';
import type { CapturedImage } from '../../types/capture';

export async function extractGenericContent(doc: Document): Promise<ExtractedContent> {
  const docClone = doc.cloneNode(true) as Document;
  const defuddle = new Defuddle(docClone);
  const result = defuddle.parse();

  const selectedHtml = result.content || '';
  const selectedImages: CapturedImage[] = [];
  const seen = new Set<string>();

  // Extract all img tags from the parsed content
  const tempDiv = doc.createElement('div');
  tempDiv.innerHTML = selectedHtml;
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
    pageTitle: result.title || doc.title,
    selectedHtml,
    selectedImages,
    description: result.description || undefined,
    author: result.author || undefined,
    siteName: result.site || undefined,
    language: doc.documentElement.lang || undefined,
  };
}
