<script lang="ts">
  import { Copy, RefreshCw } from '@lucide/svelte';
  import type { ChatMessage } from '../../types/chat';
  import BrandMark from '../common/BrandMark.svelte';
  import Markdown from '../common/Markdown.svelte';

  export let messages: ChatMessage[] = [];
  export let isStreaming = false;
  export let onRegenerate: (index: number) => void = () => undefined;

  async function copyMessage(content: string) {
    await navigator.clipboard.writeText(content);
  }
</script>

<section class="flex min-h-0 flex-1 flex-col">
  {#if messages.length === 0}
    <div class="empty-chat">
      <div class="empty-inner">
        <BrandMark size={42} />
        <h2>网页学识整理</h2>
        <p>在此开启深度对话，提取出的选区、总结与笔记也会自动汇入这里。</p>
      </div>
    </div>
  {:else}
    <div class="message-list kn-scrollbar">
      {#each messages as message, index (message.id)}
        <article class={`message ${message.role}`}>
          {#if message.role === 'assistant'}
            <div class="message-header">
              <div class="avatar assistant">
                <BrandMark size={13} />
              </div>
              <span class="sender-name">Knovana</span>
            </div>

            <div class="bubble">
              <Markdown content={message.content || (message.isStreaming ? '正在生成...' : '')} />
            </div>

            {#if message.content}
              <div class="message-actions">
                <button
                  type="button"
                  class="copy-button"
                  title="复制"
                  onclick={() => copyMessage(message.content)}
                >
                  <Copy size={12} />
                </button>
                {#if message.isStreaming || isStreaming}
                  <span class="streaming-status">流式生成中</span>
                {/if}
              </div>
            {/if}
          {:else}
            <div class="bubble">
              <p class="whitespace-pre-wrap text-[13px] leading-6">{message.content}</p>
            </div>
            <div class="message-actions user-actions">
              <button
                type="button"
                class="copy-button"
                title="复制"
                onclick={() => copyMessage(message.content)}
              >
                <Copy size={12} />
              </button>
              <button
                type="button"
                class="copy-button"
                title="重新生成"
                onclick={() => onRegenerate(index)}
              >
                <RefreshCw size={12} />
              </button>
            </div>
          {/if}
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
    padding: 32px 24px;
    text-align: center;
  }

  .empty-inner {
    display: grid;
    max-width: 260px;
    justify-items: center;
  }

  .empty-inner h2 {
    margin: 14px 0 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.35;
    color: var(--kn-text);
  }

  .empty-inner p {
    margin: 8px 0 0;
    color: var(--kn-text-muted);
    font-size: 12.5px;
    line-height: 1.6;
  }

  .message-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .message {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .message.user {
    align-items: flex-end;
  }

  .message.assistant {
    align-items: flex-start;
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 5px;
  }

  .avatar.assistant {
    display: grid;
    width: 20px;
    height: 20px;
    place-items: center;
    border-radius: 6px;
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .sender-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--kn-text-muted);
    letter-spacing: 0.02em;
  }

  .bubble {
    max-width: 100%;
    font-size: 13.5px;
    line-height: 1.6;
  }

  .message.user .bubble {
    background: var(--kn-bg-subtle);
    border: 0;
    border-radius: 14px 14px 2px 14px;
    color: var(--kn-text);
    padding: 8px 12px;
    max-width: 85%;
    word-break: break-word;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  }

  .message.assistant .bubble {
    border: 0;
    background: transparent;
    padding: 0;
    color: var(--kn-text);
    width: 100%;
  }

  .message-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 6px;
    padding-left: 2px;
  }

  .message-actions.user-actions {
    justify-content: flex-end;
    margin-top: 4px;
    width: 100%;
    padding-right: 2px;
  }

  .streaming-status {
    color: var(--kn-text-muted);
    font-size: 10.5px;
    font-weight: 500;
  }

  .copy-button {
    display: inline-flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--kn-text-muted);
    cursor: pointer;
    transition:
      background 150ms ease,
      color 150ms ease;
  }

  .copy-button:hover {
    background: var(--kn-bg-subtle);
    color: var(--kn-text);
  }
</style>
