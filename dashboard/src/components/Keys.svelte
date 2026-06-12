<script lang="ts">
  import { onMount } from "svelte";
  import { request } from "../lib/api";

  interface ApiKey {
    id: string;
    name: string;
    key: string | null;
    created_at: string;
    last_used_at?: string | null;
  }

  interface AdminApiKey extends ApiKey {
    user_id: string;
    username: string;
  }

  let { isAdmin = false, isBlocked = false } = $props<{ isAdmin: boolean; isBlocked: boolean }>();

  let keys = $state<ApiKey[]>([]);
  let adminKeys = $state<AdminApiKey[]>([]);
  let loadingKeys = $state(false);
  let loadingAdminKeys = $state(false);

  let showCreateModal = $state(false);
  let searchQuery = $state("");
  let keyName = $state("");
  let creatingKey = $state(false);
  let newlyCreatedRawKey = $state<string | null>(null);
  let newlyCreatedKeyName = $state("");
  let copiedInModal = $state(false);

  let deletingKeyId = $state<string | null>(null);
  let deletingAdminKeyId = $state<string | null>(null);
  let copiedKeyId = $state<string | null>(null);

  let errorMsg = $state("");
  let successMsg = $state("");

  let myKeysCount = $derived(keys.length);
  let systemKeysCount = $derived(adminKeys.length);

  let lastUsedTime = $derived.by(() => {
    const usedDates = keys
      .map((k) => k.last_used_at)
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).getTime());
    if (usedDates.length === 0) return "暂无使用记录";
    const maxTime = Math.max(...usedDates);
    return new Date(maxTime).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  let filteredKeys = $derived(
    keys.filter((key) => {
      const query = searchQuery.toLowerCase();
      return (
        key.name.toLowerCase().includes(query) ||
        (key.key ?? "").toLowerCase().includes(query)
      );
    }),
  );

  let filteredAdminKeys = $derived(
    adminKeys.filter((key) => {
      const query = searchQuery.toLowerCase();
      return (
        key.name.toLowerCase().includes(query) ||
        (key.key ?? "").toLowerCase().includes(query) ||
        key.username.toLowerCase().includes(query)
      );
    }),
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

  function openCreateModal() {
    newlyCreatedRawKey = null;
    newlyCreatedKeyName = "";
    copiedInModal = false;
    keyName = "";
    showCreateModal = true;
  }

  function closeCreateModal() {
    showCreateModal = false;
    newlyCreatedRawKey = null;
    newlyCreatedKeyName = "";
    copiedInModal = false;
    keyName = "";
  }

  async function handleCreateKey(e: SubmitEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;

    creatingKey = true;
    errorMsg = "";
    successMsg = "";
    copiedInModal = false;

    try {
      const res = await request<{ raw_key: string } & ApiKey>("/api/v1/keys", {
        method: "POST",
        body: JSON.stringify({ name: keyName }),
      });

      if (res.error) {
        errorMsg = res.error.message;
      } else if (res.data) {
        newlyCreatedRawKey = res.data.raw_key;
        newlyCreatedKeyName = res.data.name;
        keyName = "";
        await loadMyKeys();
        if (isAdmin) {
          await loadAdminKeys();
        }
      }
    } finally {
      creatingKey = false;
    }
  }

  function askDeleteKey(id: string, isFromAdminList = false) {
    if (isFromAdminList) {
      deletingAdminKeyId = id;
    } else {
      deletingKeyId = id;
    }
  }

  function cancelDeleteKey(isFromAdminList = false) {
    if (isFromAdminList) {
      deletingAdminKeyId = null;
    } else {
      deletingKeyId = null;
    }
  }

  async function executeDeleteKey(id: string, isFromAdminList = false) {
    errorMsg = "";
    successMsg = "";

    const path = isFromAdminList ? `/api/v1/admin/keys/${id}` : `/api/v1/keys/${id}`;
    const res = await request(path, {
      method: "DELETE",
    });

    if (res.error) {
      errorMsg = res.error.message;
    } else {
      successMsg = "密钥已删除。";
      await loadMyKeys();
      if (isAdmin) {
        await loadAdminKeys();
      }
    }

    cancelDeleteKey(isFromAdminList);
  }

  async function handleCopyKey(keyId: string, value: string | null) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    copiedKeyId = keyId;
    setTimeout(() => {
      if (copiedKeyId === keyId) {
        copiedKeyId = null;
      }
    }, 2000);
  }

  async function handleCopyInModal() {
    if (!newlyCreatedRawKey) return;
    await navigator.clipboard.writeText(newlyCreatedRawKey);
    copiedInModal = true;
    setTimeout(() => {
      copiedInModal = false;
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

  function displayKeyValue(key: ApiKey): string {
    return key.key ?? "（历史密钥，完整值不可恢复）";
  }

  onMount(() => {
    loadMyKeys();
    loadAdminKeys();
  });
</script>

<div class="keys-container">
  <div class="header-section">
    <h1>API 访问密钥管理</h1>
    <p class="description">
      API 密钥（以 <code>sk-</code> 开头）用于连接浏览器捕获扩展（Chrome Extension）或外部集成工具。请保护好您的密钥，切勿泄露。
    </p>
  </div>

  {#if errorMsg}
    <div class="error-banner">{errorMsg}</div>
  {/if}

  {#if successMsg}
    <div class="success-banner">{successMsg}</div>
  {/if}

  {#if isBlocked}
    <div class="blocked-card paper-card">
      <h3>密钥管理已锁定</h3>
      <p>您的账户目前处于待激活状态，暂时无法创建或管理 API 密钥。请联系系统管理员进行激活。</p>
    </div>
  {:else}
    <div class="stats-row">
      <div class="stats-card">
        <span class="stats-label">我的密钥总数</span>
        <span class="stats-value">{myKeysCount}</span>
        <span class="stats-desc">当前账户下有效的 API Key</span>
      </div>
      <div class="stats-card">
        <span class="stats-label">最近活跃时间</span>
        <span class="stats-value stats-value-compact">{lastUsedTime}</span>
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

    <div class="list-card paper-card">
      <div class="list-card-header">
        <div class="list-title-row">
          <h3>我的密钥列表</h3>
          <span class="count-badge">共计 {filteredKeys.length} 项</span>
        </div>
        <div class="list-toolbar">
          <label class="inline-search">
            <svg class="inline-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="search"
              class="inline-search-input"
              placeholder="搜索名称或密钥..."
              bind:value={searchQuery}
            />
            {#if searchQuery}
              <button
                type="button"
                class="inline-search-clear"
                aria-label="清除搜索"
                onclick={() => (searchQuery = "")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            {/if}
          </label>
          <button type="button" class="create-btn" onclick={openCreateModal}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
            生成新密钥
          </button>
        </div>
      </div>

      {#if loadingKeys}
        <div class="loading-state">正在载入密钥...</div>
      {:else if filteredKeys.length === 0}
        <div class="empty-state">
          {searchQuery ? "没有匹配的密钥" : "目前还没有生成任何密钥"}
        </div>
      {:else}
        <div class="table-wrap">
          <table class="paper-table">
            <thead>
              <tr>
                <th>密钥名称</th>
                <th>API 密钥</th>
                <th>创建时间</th>
                <th>最后使用</th>
                <th class="actions-header">操作</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredKeys as key (key.id)}
                <tr class:confirming={deletingKeyId === key.id}>
                  <td class="col-name">{key.name}</td>
                  <td class="col-key">
                    <div class="key-cell">
                      <code class:legacy={!key.key}>{displayKeyValue(key)}</code>
                      {#if key.key}
                        <button
                          type="button"
                          class="icon-btn copy-icon-btn"
                          class:copied={copiedKeyId === key.id}
                          title={copiedKeyId === key.id ? "已复制" : "复制密钥"}
                          aria-label={copiedKeyId === key.id ? "已复制" : "复制密钥"}
                          onclick={() => handleCopyKey(key.id, key.key)}
                        >
                          {#if copiedKeyId === key.id}
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <path d="M20 6 9 17l-5-5"/>
                            </svg>
                          {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            </svg>
                          {/if}
                        </button>
                      {/if}
                    </div>
                  </td>
                  <td class="col-date">{formatDate(key.created_at)}</td>
                  <td class="col-date">{formatDate(key.last_used_at)}</td>
                  <td class="actions-cell">
                    {#if deletingKeyId === key.id}
                      <div class="delete-confirm-box">
                        <span class="confirm-text">确定删除？</span>
                        <button type="button" class="confirm-btn yes" onclick={() => executeDeleteKey(key.id, false)}>确认</button>
                        <button type="button" class="confirm-btn no" onclick={() => cancelDeleteKey(false)}>取消</button>
                      </div>
                    {:else}
                      <button
                        type="button"
                        class="icon-btn delete-icon-btn"
                        title="删除密钥"
                        aria-label="删除密钥"
                        onclick={() => askDeleteKey(key.id, false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  {#if isAdmin && !isBlocked}
    <div class="admin-keys-card paper-card">
      <div class="list-card-header">
        <div>
          <h3>系统所有密钥 (管理员专属)</h3>
          <p class="section-desc">作为管理员，您可以查看并删除本系统所有用户创建的 API 密钥。</p>
        </div>
        <span class="count-badge">共计 {filteredAdminKeys.length} 项</span>
      </div>

      {#if loadingAdminKeys}
        <div class="loading-state">载入系统密钥中...</div>
      {:else if filteredAdminKeys.length === 0}
        <div class="empty-state">系统中没有其他密钥</div>
      {:else}
        <div class="table-wrap">
          <table class="paper-table">
            <thead>
              <tr>
                <th>所有者</th>
                <th>密钥名称</th>
                <th>API 密钥</th>
                <th>创建时间</th>
                <th>最后使用</th>
                <th class="actions-header">操作</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredAdminKeys as key (key.id)}
                <tr class:confirming={deletingAdminKeyId === key.id}>
                  <td>
                    <div class="user-cell">
                      <span class="user-avatar">{key.username.charAt(0).toUpperCase()}</span>
                      <span class="user-name">{key.username}</span>
                    </div>
                  </td>
                  <td class="col-name">{key.name}</td>
                  <td class="col-key">
                    <div class="key-cell">
                      <code class:legacy={!key.key}>{displayKeyValue(key)}</code>
                      {#if key.key}
                        <button
                          type="button"
                          class="icon-btn copy-icon-btn"
                          class:copied={copiedKeyId === `admin-${key.id}`}
                          title={copiedKeyId === `admin-${key.id}` ? "已复制" : "复制密钥"}
                          aria-label={copiedKeyId === `admin-${key.id}` ? "已复制" : "复制密钥"}
                          onclick={() => handleCopyKey(`admin-${key.id}`, key.key)}
                        >
                          {#if copiedKeyId === `admin-${key.id}`}
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <path d="M20 6 9 17l-5-5"/>
                            </svg>
                          {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                            </svg>
                          {/if}
                        </button>
                      {/if}
                    </div>
                  </td>
                  <td class="col-date">{formatDate(key.created_at)}</td>
                  <td class="col-date">{formatDate(key.last_used_at)}</td>
                  <td class="actions-cell">
                    {#if deletingAdminKeyId === key.id}
                      <div class="delete-confirm-box">
                        <span class="confirm-text">确定删除？</span>
                        <button type="button" class="confirm-btn yes" onclick={() => executeDeleteKey(key.id, true)}>确认</button>
                        <button type="button" class="confirm-btn no" onclick={() => cancelDeleteKey(true)}>取消</button>
                      </div>
                    {:else}
                      <button
                        type="button"
                        class="icon-btn delete-icon-btn"
                        title="删除密钥"
                        aria-label="删除密钥"
                        onclick={() => askDeleteKey(key.id, true)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

{#if showCreateModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget && !creatingKey) closeCreateModal(); }}>
    <div class="modal-container">
      <div class="modal-header">
        <h3>{newlyCreatedRawKey ? "密钥生成成功" : "生成新密钥"}</h3>
        {#if !creatingKey}
          <button class="modal-close-btn" aria-label="关闭" onclick={closeCreateModal}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        {/if}
      </div>

      {#if newlyCreatedRawKey}
        <div class="modal-body">
          <p class="created-hint">
            密钥「{newlyCreatedKeyName}」已创建。请立即复制保存，后续也可在列表中查看。
          </p>
          <div class="created-key-box">
            <code class="created-key-text">{newlyCreatedRawKey}</code>
            <button type="button" class="paper-button primary copy-key-btn" onclick={handleCopyInModal}>
              {copiedInModal ? "已复制到剪贴板" : "复制密钥"}
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="paper-button primary" style="width: 100%;" onclick={closeCreateModal}>
            完成
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
                placeholder="例如：Chrome 浏览器扩展"
                bind:value={keyName}
                disabled={creatingKey}
                required
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="paper-button" onclick={closeCreateModal} disabled={creatingKey}>取消</button>
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

  .stats-value-compact {
    font-size: 18px !important;
    margin-top: 10px;
    font-weight: 600 !important;
  }

  .list-card {
    padding: 0;
    overflow: hidden;
  }

  .list-card-header {
    padding: 20px 22px 16px;
    border-bottom: 1px solid var(--border-fine);
  }

  .list-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .list-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .inline-search {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    height: 38px;
    padding: 0 10px 0 36px;
    border-radius: 8px;
    background: var(--bg-paper);
    transition: box-shadow 0.2s ease;
  }

  .inline-search:focus-within {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-ochre) 14%, transparent);
  }

  .inline-search-icon {
    position: absolute;
    left: 12px;
    color: var(--text-muted);
    opacity: 0.65;
    pointer-events: none;
  }

  .inline-search-input {
    width: 100%;
    height: 100%;
    border: 0;
    background: transparent;
    color: var(--text-ink);
    font-family: var(--font-sans);
    font-size: 13px;
    outline: none;
  }

  .inline-search-input::placeholder {
    color: color-mix(in srgb, var(--text-muted) 65%, transparent);
  }

  .inline-search-clear {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .inline-search-clear:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
  }

  .create-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 38px;
    padding: 0 16px;
    border: 0;
    border-radius: 8px;
    background: var(--accent-ochre);
    color: #fff;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.2s ease;
  }

  .create-btn:hover {
    background: var(--accent-terracotta);
  }

  .list-card h3,
  .admin-keys-card h3 {
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 600;
    margin: 0;
  }

  .count-badge {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .admin-keys-card .list-card-header {
    padding: 20px 22px 16px;
    border-bottom: 1px solid var(--border-fine);
  }

  .paper-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .paper-table th,
  .paper-table td {
    padding: 13px 22px;
    border-bottom: 1px solid color-mix(in srgb, var(--border-fine) 70%, transparent);
    text-align: left;
    vertical-align: middle;
  }

  .paper-table th {
    background: transparent;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .paper-table tbody tr {
    transition: background 0.15s ease;
  }

  .paper-table tbody tr:hover {
    background: color-mix(in srgb, var(--bg-paper) 55%, transparent);
  }

  .paper-table tbody tr:hover .icon-btn {
    opacity: 1;
  }

  .paper-table tbody tr.confirming {
    background: #fff5f5;
  }

  .col-name {
    font-weight: 600;
    white-space: nowrap;
  }

  .col-date {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .col-key {
    min-width: 280px;
  }

  .key-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .key-cell code {
    flex: 1;
    min-width: 0;
    padding: 5px 10px;
    border-radius: 5px;
    background: var(--bg-paper);
    font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
    font-size: 12px;
    line-height: 1.4;
    word-break: break-all;
    user-select: all;
  }

  .key-cell code.legacy {
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-muted);
    background: transparent;
    user-select: none;
  }

  .icon-btn {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    opacity: 0.45;
    flex-shrink: 0;
    transition:
      opacity 0.18s ease,
      background 0.15s ease,
      color 0.15s ease;
  }

  .copy-icon-btn:hover,
  .copy-icon-btn.copied {
    opacity: 1;
    background: color-mix(in srgb, var(--accent-sage) 12%, transparent);
    color: var(--accent-sage);
  }

  .delete-icon-btn:hover {
    opacity: 1;
    background: color-mix(in srgb, #ef4444 10%, transparent);
    color: #dc2626;
  }

  .paper-table tbody tr:focus-within .icon-btn {
    opacity: 1;
  }

  .delete-confirm-box {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .confirm-text {
    font-size: 11px;
    color: #9b2c2c;
    white-space: nowrap;
  }

  .confirm-btn {
    border: 1px solid var(--border-fine);
    background: #fff;
    font-family: var(--font-sans);
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
  }

  .confirm-btn.yes {
    border-color: #fecaca;
    color: #dc2626;
  }

  .confirm-btn.yes:hover {
    background: #fee2e2;
  }

  .confirm-btn.no:hover {
    background: var(--bg-paper);
  }

  .actions-header {
    text-align: right !important;
    width: 56px;
    padding-right: 22px !important;
  }

  .actions-cell {
    text-align: right;
    width: 56px;
    padding-right: 22px !important;
    white-space: nowrap;
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-avatar {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent-sage) 12%, var(--bg-paper));
    color: var(--accent-sage);
    font-size: 11px;
    font-weight: 700;
  }

  .user-name {
    font-weight: 600;
    color: var(--accent-sage);
    font-size: 13px;
  }

  .admin-keys-card {
    padding: 0;
    overflow: hidden;
    border-color: color-mix(in srgb, var(--accent-sage) 35%, var(--border-fine));
  }

  .section-desc {
    color: var(--text-muted);
    font-size: 12px;
    margin-top: 4px;
    margin-bottom: 0;
    font-weight: normal;
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

  .loading-state,
  .empty-state {
    padding: 40px 22px;
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
  }

  @media (max-width: 720px) {
    .list-toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .create-btn {
      justify-content: center;
    }

    .icon-btn {
      opacity: 1;
    }
  }

  .blocked-card {
    border-color: #feb2b2;
    background: #fff5f5;
    padding: 40px;
    text-align: center;
  }

  .blocked-card h3 {
    color: #c53030;
    margin-bottom: 8px;
  }

  .blocked-card p {
    color: #9b2c2c;
    font-size: 14px;
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

  .created-hint {
    margin: 0 0 14px;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .created-key-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 6px;
    background: #fffdf5;
    border: 1px solid #e9d794;
  }

  .created-key-text {
    display: block;
    font-family: monospace;
    font-size: 13px;
    padding: 12px;
    background: #fff;
    border: 1px solid var(--border-fine);
    border-radius: 4px;
    word-break: break-all;
    user-select: all;
    text-align: center;
    line-height: 1.5;
  }

  .copy-key-btn {
    width: 100%;
  }
</style>
