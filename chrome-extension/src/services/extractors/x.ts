import type { ExtractedContent, SiteExtractor } from './types';
import { extractGenericContent } from './generic';

export const xExtractor: SiteExtractor = {
  match(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return (
      host === 'x.com' ||
      host.endsWith('.x.com') ||
      host === 'twitter.com' ||
      host.endsWith('.twitter.com')
    );
  },

  async extract(_url: URL, doc: Document): Promise<ExtractedContent | null> {
    return extractGenericContent(doc);
  },
};
