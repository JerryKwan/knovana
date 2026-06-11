<script lang="ts">
  import { onMount } from "svelte";
  import { request } from "../lib/api";

  interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    created_at: string;
    last_used_at?: string | null;
  }

  interface AdminApiKey extends ApiKey {
    user_id: string;
    username: string;
  }

  // Svelte 5 runes: props
  let { isAdmin = false, isBlocked = false } = $props<{ isAdmin: boolean; isBlocked: boolean }>();

  let keys = $state<ApiKey[]>([]);
  let adminKeys = $state<AdminApiKey[]>([]);
  let loadingKeys = $state(false);
  let loadingAdminKeys = $state(false);
  
  // Creation modal & state
  let showCreateModal = $state(false);
  let searchQuery = $state("");
  let keyName = $state("");
  let creatingKey = $state(false);
  let newlyCreatedRawKey = $state<string | null>(null);
  let copied = $state(false);

  let errorMsg = $state("");
  let successMsg = $state("");

  // Derived statistics
  let myKeysCount = $derived(keys.length);
  let systemKeysCount = $derived(adminKeys.length);
  
  let lastUsedTime = $derived.by(() => {
    const usedDates = keys
      .map(k => k.last_used_at)
      .filter((d): d is string => !!d)
      .map(d => new Date(d).getTime());
    if (usedDates.length === 0) return "暂无使用记录";
    const maxTime = Math.max(...usedDates);
    return new Date(maxTime).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  });

  // Derived filtered keys
  let filteredKeys = $derived(
    keys.filter((key) => {
      const query = searchQuery.toLowerCase();
      return (
        key.name.toLowerCase().includes(query) ||
        key.prefix.toLowerCase().includes(query)
      );
    })
  );

  let filteredAdminKeys = $derived(
    adminKeys.filter((key) => {
      const query = searchQuery.toLowerCase();
      return (
        key.name.toLowerCase().includes(query) ||
        key.prefix.toLowerCase().includes(query) ||
        key.username.toLowerCase().includes(query)
      );
    })
  );

  async function loadMyKeys() {
    if (isBlocked) return;
    loadingKeys = true;
    errorMsg = "";
    try {
      const res = await request<{ keys: ApiKey[] }>("/api/v1/keys");
      if (res.error) {
        errorMsg = res.error.message;
      } else {
        keys = res.data?.keys || [];
      }
    } finally {
      loadingKeys = false;
    }
  }

  async function loadAdminKeys() {
    if (!isAdmin) return;
    loadingAdminKeys = true;
    try {
      const res = await request<{ keys: AdminApiKey[] }>("/api/v1/admin/keys");
      if (!res.error && res.data) {
        adminKeys = res.data.keys || [];
      }
    } finally {
      loadingAdminKeys = false;
    }
  }

  async function handleCreateKey(e: SubmitEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;

    creatingKey = true;
    errorMsg = "";
    newlyCreatedRawKey = null;
    copied = false;

    try {
      const res = await request<{ raw_key: string } & ApiKey>("/api/v1/keys", {
        method: "POST",
        body: JSON.stringify({ name: keyName }),
      });

      if (res.error) {
        errorMsg = res.error.message;
      } else if (res.data) {
        newlyCreatedRawKey = res.data.raw_key;
        keyName = "";
        successMsg = "API 密钥生成成功！";
        await loadMyKeys();
        if (isAdmin) {
          await loadAdminKeys();
        }
      }
    } finally {
      creatingKey = false;
    }
  }

  async function handleRevokeKey(id: string, isFromAdminList = false) {
    if (!confirm("确定要永久吊销该密钥吗？被吊销的客户端将无法访问 API。")) {
      return;
    }

    errorMsg = "";
    successMsg = "";
    
    const path = isFromAdminList ? `/api/v1/admin/keys/${id}` : `/api/v1/keys/${id}`;
    const res = await request(path, {
      method: "DELETE",
    });

    if (res.error) {
      errorMsg = res.error.message;
    } else {
      successMsg = "密钥已成功吊销。";
      await loadMyKeys();
      if (isAdmin) {
        await loadAdminKeys();
      }
    }
  }

  function handleCopy() {
    if (!newlyCreatedRawKey) return;
    navigator.clipboard.writeText(newlyCreatedRawKey);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  function formatDate(isoStr?: string | null): string {
    if (!isoStr) return "未使用";
    try {
      const date = new Date(isoStr);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  }

  onMount(() => {
    loadMyKeys();
    loadAdminKeys();
  });
</script>

<div class="keys-container">
  <!-- Title section -->
  <div class="header-section">
    <h1>API 访问密钥管理</h1>
    <p class="description">
      API 密钥（以 <code>sk-</code> 开头）用于连接浏览器捕获扩展（Chrome Extension）或外部集成工具。请保护好您的密钥，切勿泄露。
    </p>
  </div>

  <!-- Messages Banners -->
  {#if errorMsg}
    <div class="error-banner">⚠️ {errorMsg}</div>
  {/if}

  {#if successMsg}
    <div class="success-banner">✨ {successMsg}</div>
  {/if}

  {#if isBlocked}
    <div class="blocked-card paper-card">
      <h3>🔒 密钥管理已锁定</h3>
      <p>您的账户目前处于待激活状态，暂时无法创建或管理 API 密钥。请联系系统管理员进行激活。</p>
    </div>
  {:else}
    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stats-card">
        <span class="stats-label">我的密钥总数</span>
        <span class="stats-value">{myKeysCount}</span>
        <span class="stats-desc">当前账户下有效的 API Key</span>
      </div>
      <div class="stats-card">
        <span class="stats-label">最近活跃时间</span>
        <span class="stats-value" style="font-size: 18px; margin-top: 10px; font-weight: 600;">{lastUsedTime}</span>
        <span class="stats-desc">密钥最近一次调用的时间</span>
      </div>
      {#if isAdmin}
        <div class="stats-card highlight">
          <span class="stats-label">系统总密钥数 (管理员)</span>
          <span class="stats-value">{systemKeysCount}</span>
          <span class="stats-desc">所有用户创建的密钥总和</span>
        </div>
      {/if}
    </div>

    <!-- Search & Action Toolbar -->
    <div class="toolbar-row">
      <div class="toolbar-left">
        <!-- Search bar -->
        <div class="search-input-wrapper">
          <svg class="search-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            class="paper-input"
            placeholder="搜索密钥名称或前缀..."
            bind:value={searchQuery}
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="toolbar-right">
        <button class="paper-button primary" onclick={() => showCreateModal = true}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          生成新密钥
        </button>
      </div>
    </div>

    <!-- My Keys Table (Full-Width) -->
    <div class="list-card paper-card">
      <div class="list-card-header">
        <h3>📋 我的密钥列表</h3>
        <span class="count-badge">共计 {filteredKeys.length} 项</span>
      </div>
      
      {#if loadingKeys}
        <div class="loading-state">正在载入密钥...</div>
      {:else if filteredKeys.length === 0}
        <div class="empty-state">目前还没有生成任何密钥</div>
      {:else}
        <table class="paper-table">
          <thead>
            <tr>
              <th>密钥名称</th>
              <th>密钥前缀</th>
              <th>创建时间</th>
              <th>最后使用</th>
              <th class="actions-header">操作</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredKeys as key}
              <tr>
                <td class="font-bold">{key.name}</td>
                <td><code>{key.prefix}***</code></td>
                <td class="font-sans text-xs text-muted">{formatDate(key.created_at)}</td>
                <td class="font-sans text-xs text-muted">{formatDate(key.last_used_at)}</td>
                <td class="actions-cell">
                  <button class="revoke-btn" onclick={() => handleRevokeKey(key.id, false)}>
                    吊销
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}

  <!-- Admin Panel: All Keys list (Full-Width) -->
  {#if isAdmin && !isBlocked}
    <div class="admin-keys-card paper-card">
      <div class="list-card-header">
        <div style="text-align: left;">
          <h3>👥 系统所有密钥 (管理员专属)</h3>
          <p class="section-desc">作为管理员，您可以查看并强行吊销本系统所有用户创建的 API 密钥。</p>
        </div>
        <span class="count-badge">共计 {filteredAdminKeys.length} 项</span>
      </div>

      {#if loadingAdminKeys}
        <div class="loading-state">载入系统密钥中...</div>
      {:else if filteredAdminKeys.length === 0}
        <div class="empty-state">系统中没有其他密钥</div>
      {:else}
        <table class="paper-table">
          <thead>
            <tr>
              <th>所有者</th>
              <th>密钥名称</th>
              <th>密钥前缀</th>
              <th>创建时间</th>
              <th>最后使用</th>
              <th class="actions-header">操作</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredAdminKeys as key}
              <tr>
                <td>
                  <div class="user-identity-cell">
                    <div class="avatar-circle" style="color: var(--accent-sage);">
                      {key.username.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-identity-details">
                      <span class="owner-cell font-bold">👤 {key.username}</span>
                    </div>
                  </div>
                </td>
                <td>{key.name}</td>
                <td><code>{key.prefix}***</code></td>
                <td class="font-sans text-xs text-muted">{formatDate(key.created_at)}</td>
                <td class="font-sans text-xs text-muted">{formatDate(key.last_used_at)}</td>
                <td class="actions-cell">
                  <button class="revoke-btn text-red" onclick={() => handleRevokeKey(key.id, true)}>
                    强行吊销
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
</div>

<!-- Generate Key Modal Dialog -->
{#if showCreateModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget && !newlyCreatedRawKey) showCreateModal = false; }}>
    <div class="modal-container">
      <div class="modal-header">
        <h3>🔑 {newlyCreatedRawKey ? "API 密钥生成成功" : "生成新密钥"}</h3>
        {#if !newlyCreatedRawKey}
          <button class="modal-close-btn" aria-label="关闭" onclick={() => showCreateModal = false}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        {/if}
      </div>

      {#if newlyCreatedRawKey}
        <div class="modal-body">
          <div class="raw-key-box" style="margin-top: 0; background: #fffdf5; border: 1px solid #e9d794; border-radius: 6px; padding: 16px;">
            <div class="raw-key-warning" style="color: #a05e03; font-size: 12px; line-height: 1.5; margin-bottom: 12px;">
              ⚠️ 请立即复制并妥善保存此密钥！出于安全考虑，该密钥<b>仅在此处显示一次</b>，关闭后将无法再找回。
            </div>
            <div class="raw-key-row" style="display: flex; flex-direction: column; gap: 12px;">
              <code class="raw-key-text" style="font-family: monospace; font-size: 13px; padding: 12px; background: #fff; border: 1px solid var(--border-fine); border-radius: 4px; word-break: break-all; user-select: all; text-align: center;">{newlyCreatedRawKey}</code>
              <button class="paper-button primary" style="width: 100%; height: 38px;" onclick={handleCopy}>
                {copied ? "✓ 已成功复制密钥" : "复制密钥"}
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="paper-button"
            style="width: 100%; border-color: var(--accent-sage); color: var(--accent-sage);"
            onclick={() => {
              showCreateModal = false;
              newlyCreatedRawKey = null;
              copied = false;
            }}
          >
            我已安全复制并保存，关闭窗口
          </button>
        </div>
      {:else}
        <form onsubmit={handleCreateKey}>
          <div class="modal-body">
            <div class="form-group">
              <label for="key-name">密钥名称/描述</label>
              <input
                type="text"
                id="key-name"
                class="paper-input"
                placeholder="例如：Chrome浏览器扩展"
                bind:value={keyName}
                disabled={creatingKey}
                required
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="paper-button" onclick={() => showCreateModal = false} disabled={creatingKey}>
              取消
            </button>
            <button type="submit" class="paper-button primary" disabled={creatingKey}>
              {creatingKey ? "正在生成..." : "生成 API Key"}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
{/if}

<style>
  .keys-container {
    padding: 40px;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
    text-align: left;
  }

  .header-section h1 {
    font-size: 24px;
    margin-bottom: 6px;
  }

  .description {
    color: var(--text-muted);
    font-size: 14px;
    max-width: 800px;
  }

  .list-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px dashed var(--border-fine);
    padding-bottom: 12px;
    margin-bottom: 18px;
  }

  .list-card h3 {
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 0;
    border-bottom: none;
    padding-bottom: 0;
  }

  .count-badge {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  /* Tables styling */
  .paper-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .paper-table th, .paper-table td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border-fine);
    text-align: left;
    vertical-align: middle;
  }

  .paper-table th {
    background: var(--bg-paper);
    color: var(--text-muted);
    font-weight: 600;
  }

  .paper-table tbody tr {
    transition: background 0.15s ease;
  }

  .paper-table tbody tr:hover {
    background: var(--bg-paper);
  }

  .font-bold {
    font-weight: 600;
  }

  .text-xs {
    font-size: 11px;
  }

  .text-muted {
    color: var(--text-muted);
  }

  .revoke-btn {
    background: transparent;
    border: 1px solid #fee2e2;
    color: #dc2626;
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }

  .revoke-btn:hover {
    background: #fee2e2;
    border-color: #fecaca;
  }

  .revoke-btn.text-red {
    border-color: #fecaca;
  }

  .actions-header {
    text-align: right !important;
    padding-right: 20px !important;
  }

  .actions-cell {
    text-align: right;
    padding-right: 20px !important;
  }

  /* Admin Section */
  .admin-keys-card {
    border-color: var(--accent-sage);
    margin-top: 10px;
  }

  .section-desc {
    color: var(--text-muted);
    font-size: 12px;
    margin-top: 4px;
    margin-bottom: 0;
    font-weight: normal;
  }

  .owner-cell {
    color: var(--accent-sage);
  }

  .blocked-card {
    border-color: #feb2b2;
    background: #fff5f5;
    padding: 40px;
    text-align: center;
  }

  .blocked-card h3 {
    border-bottom-color: #fed7d7;
    color: #c53030;
  }

  .blocked-card p {
    color: #9b2c2c;
    font-size: 14px;
    margin-top: 10px;
  }

  .error-banner {
    background: #fff5f5;
    border: 1px solid #feb2b2;
    color: #c53030;
    padding: 10px 14px;
    border-radius: 4px;
    font-size: 13px;
  }

  .success-banner {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
    padding: 10px 14px;
    border-radius: 4px;
    font-size: 13px;
  }

  .loading-state, .empty-state {
    padding: 40px;
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
  }
</style>
