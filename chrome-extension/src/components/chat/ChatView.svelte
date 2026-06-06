<script lang="ts">
  import { Copy, RefreshCw, Download } from '@lucide/svelte';
  import { slide } from 'svelte/transition';
  import { SvelteSet } from 'svelte/reactivity';
  import type { ChatMessage } from '../../types/chat';
  import BrandMark from '../common/BrandMark.svelte';
  import Markdown from '../common/Markdown.svelte';

  export let messages: ChatMessage[] = [];
  export let isStreaming = false;
  export let onRegenerate: (index: number) => void = () => undefined;

  let hiddenErrors = new SvelteSet<string>();
  let scheduledErrors = new SvelteSet<string>();

  $: {
    messages.forEach((message) => {
      if (message.id && message.error && !scheduledErrors.has(message.id)) {
        scheduledErrors.add(message.id);
        setTimeout(() => {
          hiddenErrors.add(message.id);
        }, 5000);
      }
    });
  }

  $: lastUserMessageIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        return i;
      }
    }
    return -1;
  })();

  function getBriefError(error: string): string {
    if (!error) return '';
    let cleanErr = error;
    const prefixes = ['[SSE Error] Streaming failure: ', 'Error: ', 'ReferenceError: '];
    for (const prefix of prefixes) {
      if (cleanErr.startsWith(prefix)) {
        cleanErr = cleanErr.slice(prefix.length);
      }
    }

    // Extract first line
    let firstLine = cleanErr.split('\n')[0].trim();

    // Remove stack trace references
    const atIndex = firstLine.indexOf('at ');
    if (atIndex !== -1) {
      firstLine = firstLine.substring(0, atIndex).trim();
    }

    // Simplify Windows paths (e.g. C:\foo\bar\claude.exe -> ...\claude.exe)
    firstLine = firstLine.replace(/[a-zA-Z]:\\[^\s]*\\([^\s\\]+)/g, '...\\$1');
    // Simplify Unix paths
    firstLine = firstLine.replace(/\/([^\s/]+\/[^\s/]+)$/g, '.../$1');

    if (firstLine.length > 90) {
      return firstLine.substring(0, 87) + '...';
    }
    return firstLine;
  }

  async function copyMessage(content: string) {
    await navigator.clipboard.writeText(content);
  }

  function exportMessage(role: 'user' | 'assistant', content: string) {
    const isAssistant = role === 'assistant';
    const filename = `${isAssistant ? 'assistant' : 'user'}-message-${Date.now()}.${isAssistant ? 'md' : 'txt'}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getMessageBlocks(message: ChatMessage) {
    if (message.blocks && message.blocks.length > 0) {
      return message.blocks;
    }
    return [{ type: 'text' as const, text: message.content || '' }];
  }
</script>

<section class="flex min-h-0 flex-1 flex-col">
  {#if messages.length === 0}
    <div class="empty-chat">
      <div class="empty-inner">
        <BrandMark size={44} />
        <h2>让每一次阅读在此沉淀</h2>
        <p>打捞喧嚣世界的碎片，筑起属于你的思想灯塔</p>
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
              {#each getMessageBlocks(message) as block, idx (idx)}
                <div class="block-item block-type-{block.type} block-idx-{idx}">
                  {#if block.type === 'text'}
                    {#if block.text}
                      <div class="block-text">
                        <Markdown content={block.text} />
                      </div>
                    {/if}
                  {:else if block.type === 'thinking'}
                    {#if block.text}
                      <details class="block-thinking" open={message.isStreaming}>
                        <summary class="thinking-header">
                          <span class="thinking-icon">🧠</span>
                          <span>思考过程</span>
                        </summary>
                        <div class="thinking-content">
                          <Markdown content={block.text} />
                        </div>
                      </details>
                    {/if}
                  {:else if block.type === 'tool_call'}
                    <div class="block-tool-call">
                      <div class="tool-call-header">
                        <span class="tool-icon">🛠️</span>
                        <span>执行工具: <code class="tool-name">{block.name}</code></span>
                      </div>
                      {#if block.input && Object.keys(block.input).length > 0}
                        <pre class="tool-call-input kn-scrollbar"><code
                            >{JSON.stringify(block.input, null, 2)}</code
                          ></pre>
                      {:else if block.partialJson}
                        <pre class="tool-call-input kn-scrollbar"><code>{block.partialJson}</code
                          ></pre>
                      {/if}
                    </div>
                  {:else if block.type === 'tool_result'}
                    <div class="block-tool-result" class:error={block.status === 'error'}>
                      <div class="tool-result-header">
                        <span class="result-icon">{block.status === 'error' ? '❌' : '✅'}</span>
                        <span
                          >工具返回结果 <span
                            class="status-pill"
                            class:error={block.status === 'error'}>{block.status}</span
                          ></span
                        >
                      </div>
                      {#if block.content}
                        <div class="tool-result-markdown kn-scrollbar">
                          <Markdown
                            content={typeof block.content === 'object'
                              ? '```json\n' + JSON.stringify(block.content, null, 2) + '\n```'
                              : String(block.content)}
                          />
                        </div>
                      {/if}
                    </div>
                  {:else if block.type === 'widget'}
                    <div class="block-widget">
                      <div class="widget-header">
                        <span class="widget-icon">🧩</span>
                        <span>组件: {block.widget_type}</span>
                      </div>
                      <pre class="widget-data kn-scrollbar"><code
                          >{JSON.stringify(block.data, null, 2)}</code
                        ></pre>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>

            <!-- Status Tail for Error / Streaming status -->
            {#if message.error && !hiddenErrors.has(message.id)}
              <div class="status-tail error" transition:slide|local={{ duration: 250 }}>
                <span class="error-icon">⚠️</span>
                <span class="error-msg">{getBriefError(message.error)}</span>
              </div>
            {:else if message.isStreaming}
              <div class="status-tail streaming">
                {#if (message.statusRail?.indicator || 'thinking') === 'tool'}
                  <span class="tool-icon-spinning">⚙️</span>
                {:else}
                  <span class="pulse-dot"></span>
                {/if}
                <span>{message.statusRail?.text || '思考中...'}</span>
              </div>
            {/if}

            {#if message.content || (message.blocks && message.blocks.length > 0)}
              <div class="message-actions">
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
                  title="导出"
                  onclick={() => exportMessage(message.role, message.content)}
                >
                  <Download size={12} />
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
                title="导出"
                onclick={() => exportMessage(message.role, message.content)}
              >
                <Download size={12} />
              </button>
              {#if index === lastUserMessageIndex}
                <button
                  type="button"
                  class="copy-button"
                  title="重新生成"
                  onclick={() => onRegenerate(index)}
                >
                  <RefreshCw size={12} />
                </button>
              {/if}
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
    max-width: 300px;
    justify-items: center;
    animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .empty-inner h2 {
    margin: 16px 0 8px;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.4;
    color: var(--kn-text);
    letter-spacing: 0.04em;
  }

  .empty-inner p {
    margin: 0;
    color: var(--kn-text-muted);
    font-size: 12.5px;
    line-height: 1.6;
    letter-spacing: 0.02em;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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
    background: transparent;
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
    border: 1px solid color-mix(in srgb, var(--kn-border) 30%, transparent);
    border-radius: 16px;
    background: color-mix(in srgb, var(--kn-bg-subtle) 30%, var(--kn-bg-raised));
    padding: 12px 14px;
    color: var(--kn-text);
    width: 100%;
    max-width: 95%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.01);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .block-text {
    width: 100%;
  }

  .block-thinking {
    margin: 6px 0;
    border: 1px solid color-mix(in srgb, var(--kn-border) 30%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--kn-bg-subtle) 25%, var(--kn-bg-raised));
    overflow: hidden;
    width: 100%;
  }

  .thinking-header {
    padding: 6px 10px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--kn-text-muted);
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 6px;
    background: color-mix(in srgb, var(--kn-bg-subtle) 10%, var(--kn-bg-raised));
  }

  .thinking-header::-webkit-details-marker {
    display: none;
  }

  .thinking-content {
    padding: 8px 10px;
    font-size: 12.5px;
    border-top: 1px solid color-mix(in srgb, var(--kn-border) 30%, transparent);
    color: var(--kn-text-muted);
    background: var(--kn-bg-raised);
  }

  .block-tool-call {
    margin: 6px 0;
    border: 1px solid color-mix(in srgb, var(--kn-border) 40%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--kn-primary) 3%, var(--kn-bg-raised));
    overflow: hidden;
    width: 100%;
  }

  .tool-call-header {
    padding: 6px 10px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--kn-text);
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px dashed color-mix(in srgb, var(--kn-border) 40%, transparent);
  }

  .tool-name {
    font-family: monospace;
    background: var(--kn-bg-subtle);
    padding: 1px 5px;
    border-radius: 4px;
    color: var(--kn-accent);
  }

  .tool-call-input {
    margin: 0;
    padding: 8px 10px;
    font-size: 11px;
    background: color-mix(in srgb, var(--kn-bg-subtle) 10%, var(--kn-bg-raised));
    max-height: 120px;
    overflow-y: auto;
    font-family: monospace;
  }

  .block-tool-result {
    margin: 6px 0;
    border: 1px solid color-mix(in srgb, var(--kn-border) 40%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--kn-primary) 1.5%, var(--kn-bg-raised));
    overflow: hidden;
    width: 100%;
  }

  .block-tool-result.error {
    border-color: color-mix(in srgb, var(--kn-danger) 20%, var(--kn-border));
    background: color-mix(in srgb, var(--kn-danger) 1.5%, var(--kn-bg-raised));
  }

  .tool-result-header {
    padding: 6px 10px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--kn-text);
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px dashed color-mix(in srgb, var(--kn-border) 40%, transparent);
  }

  .status-pill {
    font-size: 9.5px;
    padding: 1px 4px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--kn-primary) 10%, transparent);
    color: var(--kn-text-muted);
    text-transform: uppercase;
  }

  .status-pill.error {
    background: color-mix(in srgb, var(--kn-danger) 10%, transparent);
    color: var(--kn-danger);
  }

  .tool-result-markdown {
    padding: 10px 12px;
    background: color-mix(in srgb, var(--kn-bg-subtle) 10%, var(--kn-bg-raised));
    max-height: 250px;
    overflow-y: auto;
    border-top: 1px dashed color-mix(in srgb, var(--kn-border) 40%, transparent);
    font-size: 12.5px;
  }

  .block-widget {
    margin: 6px 0;
    border: 1px solid color-mix(in srgb, var(--kn-border) 40%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--kn-primary) 1.5%, var(--kn-bg-raised));
    overflow: hidden;
    width: 100%;
  }

  .widget-header {
    padding: 6px 10px;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--kn-text);
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px dashed color-mix(in srgb, var(--kn-border) 40%, transparent);
  }

  .widget-data {
    margin: 0;
    padding: 8px 10px;
    font-size: 11px;
    background: color-mix(in srgb, var(--kn-bg-subtle) 10%, var(--kn-bg-raised));
    max-height: 150px;
    overflow-y: auto;
    font-family: monospace;
  }

  .tool-icon-spinning {
    display: inline-block;
    animation: spin 2s linear infinite;
    font-size: 11px;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .message-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    padding-left: 2px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 150ms ease;
  }

  .message:hover .message-actions {
    opacity: 1;
    pointer-events: auto;
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

  .status-tail {
    display: flex;
    align-items: center;
    gap: 6.5px;
    margin-top: 6px;
    font-size: 11px;
    font-weight: 500;
  }

  .status-tail.error {
    color: var(--kn-danger);
    background: color-mix(in srgb, var(--kn-danger) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--kn-danger) 15%, transparent);
    border-radius: 6px;
    padding: 6px 10px;
    word-break: break-all;
    max-width: 95%;
  }

  .status-tail.streaming {
    color: var(--kn-text-muted);
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--kn-primary);
    animation: pulse 1.2s infinite ease-in-out;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.3;
      transform: scale(0.85);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }
</style>
