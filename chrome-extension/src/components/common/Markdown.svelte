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

  .markdown :global(code) {
    border-radius: 5px;
    background: color-mix(in srgb, var(--kn-bg-subtle) 78%, transparent);
    padding: 0.1rem 0.28rem;
    font-size: 0.9em;
  }

  .markdown :global(pre) {
    overflow: auto;
    border-radius: 8px;
    border: 1px solid var(--kn-border);
    background: color-mix(in srgb, var(--kn-bg-subtle) 90%, #000 10%);
    padding: 0.75rem;
  }

  .markdown :global(a) {
    color: var(--kn-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .markdown :global(blockquote) {
    margin: 0.75rem 0;
    border-left: 3px solid var(--kn-primary);
    padding-left: 0.75rem;
    color: var(--kn-text-muted);
  }
</style>
