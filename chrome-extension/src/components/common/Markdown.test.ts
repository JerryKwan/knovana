import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Markdown from './Markdown.svelte';

describe('Markdown', () => {
  it('renders marked markdown output', () => {
    const { container } = render(Markdown, {
      props: {
        content: '# Title\n\n**Important** note',
      },
    });

    expect(container.querySelector('h1')?.textContent).toBe('Title');
    expect(container.querySelector('strong')?.textContent).toBe('Important');
  });

  it('sanitizes unsafe HTML generated from markdown', () => {
    const { container } = render(Markdown, {
      props: {
        content:
          'Safe text\n\n<script>alert("bad")</script>\n\n<img src="x" onerror="alert(1)" alt="unsafe">',
      },
    });

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')?.getAttribute('onerror')).toBeNull();
    expect(container.textContent).toContain('Safe text');
  });
});
