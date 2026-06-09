<script lang="ts">
  import { History, MessageSquare, Plus, Trash2, RefreshCw } from '@lucide/svelte';
  import { onMount, createEventDispatcher } from 'svelte';
  import { sendRuntimeMessage } from '../../services/messaging';
  import type { ChatSessionSummary } from '../../types/api';

  const dispatch = createEventDispatcher<{
    select: { sessionId: string };
    newSession: void;
    delete: { sessionId: string };
  }>();

  let sessions: ChatSessionSummary[] = [];
  let page = 1;
  let loading = true;
  let error = '';

  async function loadSessions(nextPage = 1) {
    loading = true;
    error = '';
    try {
      const response = await sendRuntimeMessage<{ sessions: ChatSessionSummary[]; total: number }>({
        type: 'GET_SESSIONS',
        payload: { page: nextPage, per_page: 20 },
      });
      sessions = response.sessions ?? [];
      page = nextPage;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  let deletingSessionId: string | null = null;

  function askDeleteSession(id: string, event: Event) {
    event.stopPropagation();
    deletingSessionId = id;
  }

  function cancelDelete(event: Event) {
    event.stopPropagation();
    deletingSessionId = null;
  }

  async function executeDelete(id: string, event: Event) {
    event.stopPropagation();
    try {
      await sendRuntimeMessage({
        type: 'DELETE_SESSION',
        payload: { id },
      });
      dispatch('delete', { sessionId: id });
      deletingSessionId = null;
      await loadSessions(page);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      deletingSessionId = null;
    }
  }

  function formatRelativeTime(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return '刚刚';
      if (diffMins < 60) return `${diffMins}分钟前`;
      if (diffHours < 24) {
        // If same day
        if (d.getDate() === now.getDate()) {
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
        return '昨天';
      }
      return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  }

  onMount(() => {
    void loadSessions();
  });
</script>

<section class="flex min-h-0 flex-1 flex-col overflow-hidden">
  <!-- 顶栏操作区 -->
  <header class="history-toolbar">
    <div class="toolbar-title">
      <History size={15} class="text-[color:var(--kn-primary)]" />
      对话历史
    </div>
    <div class="flex gap-1">
      <button type="button" class="toolbar-button" title="刷新" onclick={() => loadSessions(1)}>
        <RefreshCw size={14} class={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  </header>

  <div class="grid min-h-0 flex-1 grid-rows-[auto_1fr] overflow-hidden">
    <!-- 新对话行动项 -->
    <div class="p-3 pb-2">
      <button type="button" class="new-chat-btn" onclick={() => dispatch('newSession')}>
        <Plus size={15} />
        <span>开启新对话</span>
      </button>
    </div>

    <!-- 列表滚存区 -->
    <div class="overflow-y-auto px-3 pb-3 kn-scrollbar">
      {#if error}
        <p class="history-error">
          {error}
        </p>
      {:else}
        {#if loading && sessions.length === 0}
          <div class="skeleton-list">
            <div></div>
            <div></div>
            <div></div>
          </div>
        {:else if sessions.length === 0}
          <div class="empty-state">
            <MessageSquare size={28} class="text-[color:var(--kn-text-muted)] opacity-60 mb-2" />
            <span>暂无历史对话记录</span>
          </div>
        {:else}
          <div class="session-list">
            {#each sessions as session (session.id)}
              <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
              <article
                class="session-card"
                class:confirming={deletingSessionId === session.id}
                onclick={() =>
                  deletingSessionId !== session.id && dispatch('select', { sessionId: session.id })}
                onkeydown={(e) =>
                  e.key === 'Enter' &&
                  deletingSessionId !== session.id &&
                  dispatch('select', { sessionId: session.id })}
                tabindex="0"
                role="button"
              >
                {#if deletingSessionId === session.id}
                  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                  <div class="delete-confirm-box" onclick={(e) => e.stopPropagation()}>
                    <span class="confirm-text">确定删除此会话吗？</span>
                    <div class="confirm-actions">
                      <button
                        type="button"
                        class="confirm-btn yes"
                        onclick={(e) => executeDelete(session.id, e)}
                      >
                        确认
                      </button>
                      <button type="button" class="confirm-btn no" onclick={cancelDelete}>
                        取消
                      </button>
                    </div>
                  </div>
                {:else}
                  <div class="session-body">
                    <h3 title={session.title}>{session.title || '无标题会话'}</h3>
                    <div class="session-meta">
                      <span class="message-count">{session.message_count || 0} 条消息</span>
                      <span class="dot">•</span>
                      <span class="active-time">{formatRelativeTime(session.updated_at)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="delete-btn"
                    title="删除会话"
                    onclick={(e) => askDeleteSession(session.id, e)}
                  >
                    <Trash2 size={13} />
                  </button>
                {/if}
              </article>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</section>

<style>
  .history-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-bottom: 1px solid var(--kn-border);
    background: color-mix(in srgb, var(--kn-bg-raised) 88%, var(--kn-bg));
    padding: 9px 12px;
  }

  .toolbar-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 850;
  }

  .toolbar-button {
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--kn-text-muted);
    width: 31px;
    height: 31px;
    transition:
      background 150ms ease,
      color 150ms ease;
    cursor: pointer;
  }

  .toolbar-button:hover {
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .new-chat-btn {
    display: inline-flex;
    width: 100%;
    height: 38px;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 0;
    border-radius: 8px;
    background: linear-gradient(
      135deg,
      var(--kn-primary),
      color-mix(in srgb, var(--kn-primary) 85%, #000)
    );
    color: #fff;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--kn-shadow-soft);
    transition:
      opacity 180ms ease,
      transform 150ms ease;
  }

  .new-chat-btn:hover {
    opacity: 0.95;
    transform: translateY(-0.5px);
  }

  .new-chat-btn:active {
    transform: translateY(0);
  }

  .history-error {
    margin: 0;
    border: 1px solid color-mix(in srgb, var(--kn-danger) 24%, var(--kn-border));
    border-radius: 8px;
    background: color-mix(in srgb, var(--kn-danger) 7%, var(--kn-bg-raised));
    color: var(--kn-danger);
    font-size: 12px;
    line-height: 1.55;
    padding: 10px;
  }

  .skeleton-list {
    display: grid;
    gap: 9px;
  }

  .skeleton-list div {
    height: 66px;
    border-radius: 8px;
    background: linear-gradient(
      90deg,
      var(--kn-bg-subtle),
      var(--kn-field-bg),
      var(--kn-bg-subtle)
    );
    background-size: 220% 100%;
    animation: shimmer 1.35s ease-in-out infinite;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    height: 100%;
    align-items: center;
    justify-content: center;
    color: var(--kn-text-muted);
    font-size: 12.5px;
    padding: 40px 20px;
    text-align: center;
  }

  .session-list {
    display: grid;
    gap: 9px;
  }

  .session-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-bg-raised);
    padding: 12px 14px;
    box-shadow: 0 4px 12px rgb(21 39 37 / 0.03);
    transition:
      border-color 150ms ease,
      transform 150ms ease,
      box-shadow 150ms ease;
    cursor: pointer;
    text-align: left;
    outline: none;
    min-width: 0;
  }

  .session-card:hover {
    border-color: color-mix(in srgb, var(--kn-primary) 34%, var(--kn-border));
    box-shadow: var(--kn-shadow-soft);
    transform: translateY(-0.5px);
  }

  .session-card.confirming {
    border-color: color-mix(in srgb, var(--kn-danger) 45%, var(--kn-border));
    background: color-mix(in srgb, var(--kn-danger) 4%, var(--kn-bg-raised));
    cursor: default;
  }

  .delete-confirm-box {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .confirm-text {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--kn-danger);
  }

  .confirm-actions {
    display: flex;
    gap: 6px;
  }

  .confirm-btn {
    border: 0;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    cursor: pointer;
    transition:
      background 150ms ease,
      color 150ms ease;
  }

  .confirm-btn.yes {
    background: var(--kn-danger);
    color: #fff;
  }

  .confirm-btn.yes:hover {
    background: color-mix(in srgb, var(--kn-danger) 85%, #000);
  }

  .confirm-btn.no {
    background: var(--kn-border);
    color: var(--kn-text);
  }

  .confirm-btn.no:hover {
    background: color-mix(in srgb, var(--kn-border) 80%, #000);
  }

  .session-body {
    flex: 1;
    min-width: 0;
    padding-right: 12px;
  }

  .session-body h3 {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--kn-text);
    font-size: 12.8px;
    font-weight: 850;
    line-height: 1.45;
  }

  .session-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 5px;
    color: var(--kn-text-muted);
    font-size: 11px;
    font-weight: 500;
  }

  .dot {
    opacity: 0.5;
  }

  .delete-btn {
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--kn-text-muted);
    width: 26px;
    height: 26px;
    opacity: 0.5;
    flex-shrink: 0;
    transition:
      opacity 180ms ease,
      background 150ms ease,
      color 150ms ease;
    cursor: pointer;
  }

  .session-card:hover .delete-btn,
  .session-card:focus-within .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    background: color-mix(in srgb, var(--kn-danger) 10%, transparent);
    color: var(--kn-danger);
  }

  @keyframes shimmer {
    to {
      background-position: -220% 0;
    }
  }

  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
