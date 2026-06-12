<script lang="ts">
  import DOMPurify from 'dompurify';
  import { marked } from 'marked';

  export let content = '';
  export let apiUrl = '';
  export let token = '';
  export let userId = '';

  function encodePath(path: string): string {
    return path.split('/').map(encodeURIComponent).join('/');
  }

  function decodePath(path: string): string {
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  }

  function parseMarkdown(
    rawContent: string,
    url: string,
    tok: string,
    uid: string,
  ): string {
    if (!rawContent) return '';

    const renderer = new marked.Renderer();
    renderer.image = ({ href, title, text }) => {
      let src = href;
      if (href) {
        if (href.startsWith('attachments/')) {
          const filename = decodePath(href.slice('attachments/'.length));
          const encodedFilename = encodePath(filename);
          if (uid) {
            src = `${url}/attachments/${encodeURIComponent(uid)}/${encodedFilename}`;
          } else {
            src = `${url}/attachments/file/${encodedFilename}`;
          }
          if (tok) {
            src += `?token=${encodeURIComponent(tok)}`;
          }
        }
      }
      const titleAttr = title ? ` title="${title}"` : '';
      const altAttr = text ? ` alt="${text}"` : '';
      return `<img src="${src}"${altAttr}${titleAttr} />`;
    };

    return DOMPurify.sanitize(
      marked.parse(rawContent, { renderer, async: false }) as string,
    );
  }

  $: resolvedUserId = (() => {
    if (!token || !token.includes('.')) return userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || userId;
    } catch {
      return userId;
    }
  })();

  $: html = parseMarkdown(content, apiUrl, token, resolvedUserId);
</script>

<div class="markdown">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized by DOMPurify after marked parsing -->
  {@html html}
</div>

<style>
  /*
   * :host covers the widget custom-element Shadow DOM case where scoped
   * ".markdown.svelte-xxx table" may not reach {@html} descendants.
   */
  .markdown,
  :host .markdown {
    max-width: none;
    font-size: 13px;
    line-height: 1.5rem;
    color: var(--kn-text);
  }

  .markdown :global(p),
  :host .markdown :global(p) {
    margin: 0 0 0.65rem;
  }

  .markdown :global(p:last-child),
  :host .markdown :global(p:last-child) {
    margin-bottom: 0;
  }

  .markdown :global(ul),
  .markdown :global(ol),
  :host .markdown :global(ul),
  :host .markdown :global(ol) {
    margin: 0.45rem 0 0.75rem 1.15rem;
    padding: 0;
  }

  .markdown :global(li),
  :host .markdown :global(li) {
    margin: 0.2rem 0;
  }

  .markdown :global(:not(pre) > code),
  :host .markdown :global(:not(pre) > code) {
    border-radius: 5px;
    border: 1px solid color-mix(in srgb, var(--kn-border) 62%, transparent);
    background: color-mix(in srgb, var(--kn-bg-raised) 72%, var(--kn-primary-soft));
    padding: 0.1rem 0.28rem;
    font-size: 0.9em;
    color: color-mix(in srgb, var(--kn-text) 88%, var(--kn-accent));
  }

  .markdown :global(pre),
  :host .markdown :global(pre) {
    position: relative;
    margin: 0.85rem 0;
    overflow: auto;
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--kn-border) 78%, transparent);
    background: color-mix(in srgb, var(--kn-bg-raised) 84%, var(--kn-bg-subtle));
    box-shadow:
      inset 3px 0 0 color-mix(in srgb, var(--kn-accent) 28%, transparent),
      inset 0 1px 0 color-mix(in srgb, var(--kn-bg-raised) 85%, transparent);
    padding: 0.8rem 0.9rem 0.85rem 1rem;
    color: var(--kn-text);
    font-family: 'Cascadia Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
    font-size: 12px;
    line-height: 1.65;
    tab-size: 2;
    white-space: pre;
  }

  .markdown :global(pre code),
  :host .markdown :global(pre code) {
    border: 0;
    border-radius: 0;
    background: transparent;
    padding: 0;
    color: inherit;
    font: inherit;
    white-space: inherit;
  }

  .markdown :global(pre::-webkit-scrollbar),
  :host .markdown :global(pre::-webkit-scrollbar) {
    width: 7px;
    height: 7px;
  }

  .markdown :global(pre::-webkit-scrollbar-track),
  :host .markdown :global(pre::-webkit-scrollbar-track) {
    background: transparent;
  }

  .markdown :global(pre::-webkit-scrollbar-thumb),
  :host .markdown :global(pre::-webkit-scrollbar-thumb) {
    background: color-mix(in srgb, var(--kn-text-muted) 28%, transparent);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  .markdown :global(a),
  :host .markdown :global(a) {
    color: var(--kn-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .markdown :global(blockquote),
  :host .markdown :global(blockquote) {
    margin: 0.75rem 0;
    border-left: 3px solid var(--kn-accent);
    background: color-mix(in srgb, var(--kn-accent) 5%, var(--kn-bg-raised));
    border-radius: 0 8px 8px 0;
    padding: 0.6rem 0.9rem;
    color: var(--kn-text-muted);
    font-style: italic;
  }

  .markdown :global(table),
  :host .markdown :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.85rem 0;
    font-size: 0.9em;
    line-height: 1.5;
  }

  .markdown :global(th),
  :host .markdown :global(th) {
    background: var(--kn-bg-subtle);
    color: var(--kn-text);
    font-weight: 600;
    border: 1px solid var(--kn-border);
    padding: 6px 10px;
    text-align: left;
  }

  .markdown :global(td),
  :host .markdown :global(td) {
    border: 1px solid var(--kn-border);
    padding: 6px 10px;
    color: var(--kn-text);
  }

  .markdown :global(tr:nth-child(even)),
  :host .markdown :global(tr:nth-child(even)) {
    background: color-mix(in srgb, var(--kn-bg-subtle) 25%, transparent);
  }

  .markdown :global(img),
  :host .markdown :global(img) {
    max-width: 100%;
    border-radius: 6px;
    margin: 0.5rem 0;
  }
</style>
