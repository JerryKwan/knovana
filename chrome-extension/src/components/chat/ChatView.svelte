<script lang="ts">
  import { Bot, Copy, UserRound } from '@lucide/svelte';
  import type { ChatMessage } from '../../types/chat';
  import BrandMark from '../common/BrandMark.svelte';
  import Markdown from '../common/Markdown.svelte';

  export let messages: ChatMessage[] = [];
  export let isStreaming = false;

  async function copyMessage(content: string) {
    await navigator.clipboard.writeText(content);
  }
</script>

<section class="flex min-h-0 flex-1 flex-col">
  {#if messages.length === 0}
    <div class="empty-chat">
      <div class="empty-inner">
        <BrandMark size={46} />
        <h2>准备处理当前页面</h2>
        <p>对话、选区和右键动作会汇入这里。</p>
      </div>
    </div>
  {:else}
    <div class="message-list kn-scrollbar">
      {#each messages as message (message.id)}
        <article class={`message ${message.role}`}>
          <div class="avatar">
            {#if message.role === 'assistant'}
              <Bot size={16} />
            {:else}
              <UserRound size={15} />
            {/if}
          </div>

          <div class="min-w-0 flex-1">
            <div class="bubble">
              {#if message.role === 'assistant'}
                <Markdown content={message.content || (message.isStreaming ? '正在生成...' : '')} />
              {:else}
                <p class="whitespace-pre-wrap text-[13px] leading-6">{message.content}</p>
              {/if}
            </div>

            {#if message.role === 'assistant' && message.content}
              <div class="message-actions">
                <button
                  type="button"
                  class="copy-button"
                  title="复制"
                  onclick={() => copyMessage(message.content)}
                >
                  <Copy size={12} />
                  复制
                </button>
                {#if message.isStreaming || isStreaming}
                  <span>流式生成中</span>
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
  .empty-chat {
    display: grid;
    flex: 1;
    place-items: center;
    padding: 32px 26px;
    text-align: center;
  }

  .empty-inner {
    display: grid;
    max-width: 260px;
    justify-items: center;
  }

  .empty-inner h2 {
    margin: 16px 0 0;
    font-size: 18px;
    font-weight: 850;
    line-height: 1.35;
  }

  .empty-inner p {
    margin: 8px 0 0;
    color: var(--kn-text-muted);
    font-size: 13px;
    line-height: 1.65;
  }

  .message-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 14px 12px 18px;
  }

  .message {
    display: flex;
    gap: 9px;
  }

  .message + .message {
    margin-top: 13px;
  }

  .avatar {
    display: grid;
    width: 28px;
    height: 28px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 8px;
    margin-top: 2px;
  }

  .message.assistant .avatar {
    background: color-mix(in srgb, var(--kn-primary-soft) 84%, transparent);
    color: var(--kn-primary);
  }

  .message.user .avatar {
    background: color-mix(in srgb, var(--kn-accent) 12%, transparent);
    color: var(--kn-accent);
  }

  .bubble {
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    padding: 10px 12px;
  }

  .message.assistant .bubble {
    border-color: var(--kn-border);
    background: var(--kn-bg-raised);
  }

  .message.user .bubble {
    border-color: color-mix(in srgb, var(--kn-accent) 28%, var(--kn-border));
    background: color-mix(in srgb, var(--kn-accent) 8%, var(--kn-bg-raised));
  }

  .message-actions {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 5px;
  }

  .message-actions span {
    color: var(--kn-text-muted);
    font-size: 11px;
  }

  .copy-button {
    display: inline-flex;
    height: 27px;
    align-items: center;
    gap: 5px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--kn-text-muted);
    padding: 0 7px;
    font-size: 11px;
    font-weight: 800;
    transition:
      background 150ms ease,
      color 150ms ease;
  }

  .copy-button:hover {
    background: var(--kn-bg-subtle);
    color: var(--kn-text);
  }
</style>
