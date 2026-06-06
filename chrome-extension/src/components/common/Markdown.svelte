<script lang="ts">
  import DOMPurify from 'dompurify';
  import { marked } from 'marked';

  export let content = '';

  $: html = DOMPurify.sanitize(marked.parse(content || '', { async: false }) as string);
</script>

<div class="markdown max-w-none text-[13px] leading-6 text-[color:var(--kn-text)]">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized by DOMPurify after marked parsing -->
  {@html html}
</div>

<style>
  .markdown :global(p) {
    margin: 0 0 0.65rem;
  }

  .markdown :global(p:last-child) {
    margin-bottom: 0;
  }

  .markdown :global(ul),
  .markdown :global(ol) {
    margin: 0.45rem 0 0.75rem 1.15rem;
    padding: 0;
  }

  .markdown :global(li) {
    margin: 0.2rem 0;
  }

  .markdown :global(:not(pre) > code) {
    border-radius: 5px;
    border: 1px solid color-mix(in srgb, var(--kn-border) 62%, transparent);
    background: color-mix(in srgb, var(--kn-bg-raised) 72%, var(--kn-primary-soft));
    padding: 0.1rem 0.28rem;
    font-size: 0.9em;
    color: color-mix(in srgb, var(--kn-text) 88%, var(--kn-accent));
  }

  .markdown :global(pre) {
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

  .markdown :global(pre code) {
    border: 0;
    border-radius: 0;
    background: transparent;
    padding: 0;
    color: inherit;
    font: inherit;
    white-space: inherit;
  }

  .markdown :global(pre::-webkit-scrollbar) {
    width: 7px;
    height: 7px;
  }

  .markdown :global(pre::-webkit-scrollbar-track) {
    background: transparent;
  }

  .markdown :global(pre::-webkit-scrollbar-thumb) {
    background: color-mix(in srgb, var(--kn-text-muted) 28%, transparent);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  .markdown :global(a) {
    color: var(--kn-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .markdown :global(blockquote) {
    margin: 0.75rem 0;
    border-left: 3px solid var(--kn-accent);
    background: color-mix(in srgb, var(--kn-accent) 5%, var(--kn-bg-raised));
    border-radius: 0 8px 8px 0;
    padding: 0.6rem 0.9rem;
    color: var(--kn-text-muted);
    font-style: italic;
  }

  .markdown :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0.85rem 0;
    font-size: 0.9em;
    line-height: 1.5;
  }

  .markdown :global(th) {
    background: var(--kn-bg-subtle);
    color: var(--kn-text);
    font-weight: 600;
    border: 1px solid var(--kn-border);
    padding: 6px 10px;
    text-align: left;
  }

  .markdown :global(td) {
    border: 1px solid var(--kn-border);
    padding: 6px 10px;
    color: var(--kn-text);
  }

  .markdown :global(tr:nth-child(even)) {
    background: color-mix(in srgb, var(--kn-bg-subtle) 25%, transparent);
  }
</style>
