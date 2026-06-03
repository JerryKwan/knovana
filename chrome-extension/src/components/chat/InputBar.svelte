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

<div class="border-t border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] px-3 pb-3 pt-2">
  <div class="mb-2 flex gap-2 overflow-x-auto kn-scrollbar">
    {#each suggestions as suggestion (suggestion)}
      <button
        type="button"
        class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[color:var(--kn-border)] bg-[color:var(--kn-bg)] px-3 text-[12px] font-semibold text-[color:var(--kn-text-muted)] transition hover:border-[color:var(--kn-primary)] hover:text-[color:var(--kn-primary)]"
        onclick={() => onSuggestion(suggestion)}
      >
        <Sparkles size={13} />
        {suggestion}
      </button>
    {/each}
  </div>

  <div
    class="flex min-h-[74px] items-end gap-2 rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg)] p-2 shadow-soft"
  >
    <textarea
      bind:value
      {disabled}
      rows="2"
      class="max-h-32 min-h-12 flex-1 resize-none border-0 bg-transparent px-1 py-1 text-[13px] leading-5 text-[color:var(--kn-text)] outline-none placeholder:text-[color:var(--kn-text-muted)] disabled:opacity-60"
      placeholder="向 Knovana 提问..."
      onkeydown={handleKeydown}
    ></textarea>
    <button
      type="button"
      class="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-[color:var(--kn-primary)] text-[color:var(--kn-primary-ink)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
      disabled={disabled || !value.trim()}
      title="发送"
      onclick={submit}
    >
      <Send size={17} />
    </button>
  </div>
</div>
