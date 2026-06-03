<script lang="ts">
  import { Bot, Copy, UserRound } from '@lucide/svelte';
  import type { ChatMessage } from '../../types/chat';
  import Markdown from '../common/Markdown.svelte';

  export let messages: ChatMessage[] = [];
  export let isStreaming = false;

  async function copyMessage(content: string) {
    await navigator.clipboard.writeText(content);
  }
</script>

<section class="flex min-h-0 flex-1 flex-col">
  {#if messages.length === 0}
    <div class="grid flex-1 place-items-center px-8 text-center">
      <div class="max-w-[280px]">
        <div
          class="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] shadow-soft"
        >
          <Bot size={21} class="text-[color:var(--kn-primary)]" />
        </div>
        <h2 class="text-[18px] font-semibold tracking-normal text-[color:var(--kn-text)]">
          知识可以直接进入工作流
        </h2>
        <p class="mt-2 text-[13px] leading-6 text-[color:var(--kn-text-muted)]">
          当前页面会作为上下文进入对话，选区和右键动作会自动出现在这里。
        </p>
      </div>
    </div>
  {:else}
    <div class="flex-1 space-y-3 overflow-y-auto px-3 py-4 kn-scrollbar">
      {#each messages as message (message.id)}
        <article class={`message ${message.role}`}>
          <div class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[7px]">
            {#if message.role === 'assistant'}
              <Bot size={16} />
            {:else}
              <UserRound size={15} />
            {/if}
          </div>

          <div class="min-w-0 flex-1">
            <div class="rounded-[8px] border px-3 py-2.5">
              {#if message.role === 'assistant'}
                <Markdown content={message.content || (message.isStreaming ? '正在生成...' : '')} />
              {:else}
                <p class="whitespace-pre-wrap text-[13px] leading-6">{message.content}</p>
              {/if}
            </div>

            {#if message.role === 'assistant' && message.content}
              <div class="mt-1 flex items-center gap-1">
                <button
                  type="button"
                  class="inline-flex h-7 items-center gap-1 rounded-[7px] px-2 text-[11px] font-semibold text-[color:var(--kn-text-muted)] transition hover:bg-[color:var(--kn-bg-subtle)] hover:text-[color:var(--kn-text)]"
                  title="复制"
                  onclick={() => copyMessage(message.content)}
                >
                  <Copy size={12} />
                  复制
                </button>
                {#if message.isStreaming || isStreaming}
                  <span class="ml-1 text-[11px] text-[color:var(--kn-text-muted)]">流式生成中</span>
                {/if}
              </div>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .message {
    display: flex;
    gap: 0.55rem;
  }

  .message.assistant > div:first-child {
    background: color-mix(in srgb, var(--kn-primary-soft) 84%, transparent);
    color: var(--kn-primary);
  }

  .message.user > div:first-child {
    background: color-mix(in srgb, var(--kn-accent) 12%, transparent);
    color: var(--kn-accent);
  }

  .message.assistant .rounded-\[8px\] {
    border-color: var(--kn-border);
    background: var(--kn-bg-raised);
  }

  .message.user .rounded-\[8px\] {
    border-color: color-mix(in srgb, var(--kn-accent) 28%, var(--kn-border));
    background: color-mix(in srgb, var(--kn-accent) 8%, var(--kn-bg-raised));
  }
</style>
