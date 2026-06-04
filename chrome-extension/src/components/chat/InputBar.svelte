<script lang="ts">
  import { Send, Sparkles } from '@lucide/svelte';

  export let disabled = false;
  export let onSubmit: (value: string) => void = () => undefined;
  export let onSuggestion: (value: string) => void = () => undefined;

  let value = '';

  const suggestions = ['总结当前页面', '提炼行动项', '生成知识笔记'];

  function submit() {
    const next = value.trim();
    if (!next || disabled) return;
    value = '';
    onSubmit(next);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }
</script>

<div class="composer">
  <div class="suggestion-strip">
    {#each suggestions as suggestion (suggestion)}
      <button type="button" class="suggestion" onclick={() => onSuggestion(suggestion)}>
        <Sparkles size={13} />
        {suggestion}
      </button>
    {/each}
  </div>

  <div class="input-shell">
    <textarea
      bind:value
      {disabled}
      rows="2"
      class="message-input"
      placeholder="向 Knovana 提问..."
      onkeydown={handleKeydown}
    ></textarea>
    <button
      type="button"
      class="send-button"
      disabled={disabled || !value.trim()}
      title="发送"
      onclick={submit}
    >
      <Send size={17} />
    </button>
  </div>
</div>

<style>
  .composer {
    border-top: 1px solid var(--kn-border);
    background:
      linear-gradient(180deg, rgb(255 255 255 / 0.78), rgb(255 255 255 / 0.94)), var(--kn-bg-raised);
    padding: 9px 12px 12px;
  }

  :global(:root[data-theme='dark']) .composer {
    background:
      linear-gradient(180deg, rgb(22 32 30 / 0.72), rgb(22 32 30 / 0.94)), var(--kn-bg-raised);
  }

  .suggestion-strip {
    display: flex;
    gap: 7px;
    margin-bottom: 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .suggestion-strip::-webkit-scrollbar {
    display: none;
  }

  .suggestion {
    display: inline-flex;
    height: 30px;
    flex: 0 0 auto;
    align-items: center;
    gap: 5px;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-field-bg);
    color: var(--kn-text-muted);
    padding: 0 10px;
    font-size: 12px;
    font-weight: 800;
    transition:
      border-color 150ms ease,
      background 150ms ease,
      color 150ms ease;
  }

  .suggestion:hover {
    border-color: color-mix(in srgb, var(--kn-primary) 34%, var(--kn-border));
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .input-shell {
    display: flex;
    min-height: 74px;
    align-items: flex-end;
    gap: 9px;
    border: 1px solid var(--kn-border-strong);
    border-radius: 8px;
    background: var(--kn-field-bg);
    padding: 8px;
    box-shadow: var(--kn-shadow-soft);
  }

  .input-shell:focus-within {
    border-color: color-mix(in srgb, var(--kn-primary) 48%, var(--kn-border));
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--kn-primary) 12%, transparent),
      var(--kn-shadow-soft);
  }

  .message-input {
    min-height: 50px;
    max-height: 128px;
    min-width: 0;
    flex: 1;
    resize: none;
    border: 0;
    background: transparent;
    color: var(--kn-text);
    padding: 4px 3px;
    font-size: 13px;
    line-height: 1.55;
    outline: none;
  }

  .message-input::placeholder {
    color: var(--kn-text-muted);
  }

  .message-input:disabled {
    opacity: 0.56;
  }

  .send-button {
    display: grid;
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: linear-gradient(
      135deg,
      var(--kn-primary),
      color-mix(in srgb, var(--kn-primary) 70%, var(--kn-accent))
    );
    color: var(--kn-primary-ink);
    box-shadow: 0 10px 20px color-mix(in srgb, var(--kn-primary) 24%, transparent);
    transition:
      transform 150ms ease,
      opacity 150ms ease,
      filter 150ms ease;
  }

  .send-button:hover {
    filter: brightness(1.04);
    transform: translateY(-1px);
  }

  .send-button:disabled {
    cursor: not-allowed;
    filter: grayscale(0.18);
    opacity: 0.42;
    transform: none;
  }
</style>
