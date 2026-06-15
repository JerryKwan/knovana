import { extractContent } from '../services/extractors';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'COLLECT_PAGE_SNAPSHOT') {
        const url = new URL(window.location.href);

        // Capture user selection HTML if active
        const selection = window.getSelection();
        let selectionHtml = '';
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          const container = document.createElement('div');
          for (let i = 0; i < selection.rangeCount; i++) {
            container.appendChild(selection.getRangeAt(i).cloneContents());
          }
          selectionHtml = container.innerHTML;
        }

        const getMeta = (name: string) =>
          document.querySelector<HTMLMetaElement>(`meta[name="${name}"], meta[property="${name}"]`)
            ?.content;

        const favicon =
          document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href ??
          document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.href;

        // Perform extraction asynchronously and respond
        extractContent(url, document, selectionHtml)
          .then((extracted) => {
            sendResponse({
              pageUrl: window.location.href,
              pageTitle: extracted.pageTitle,
              description:
                extracted.description ?? getMeta('description') ?? getMeta('og:description'),
              author: extracted.author ?? getMeta('author'),
              siteName: extracted.siteName ?? getMeta('og:site_name'),
              favicon,
              language: (extracted.language ?? document.documentElement.lang) || undefined,
              selectedHtml: extracted.selectedHtml,
              selectedImages: extracted.selectedImages,
            });
          })
          .catch((error) => {
            console.error('Extraction failed:', error);
            sendResponse({
              pageUrl: window.location.href,
              pageTitle: document.title,
              selectedImages: [],
            });
          });

        return true; // Keep message channel open for async response
      }
    });
  },
});
