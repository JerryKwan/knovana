<script lang="ts">
  import { onMount } from "svelte";
  import { request } from "../lib/api";

  interface UserItem {
    id: string;
    username: string;
    status: "active" | "inactive";
    kb_path: string;
    created_at: string;
  }

  // Svelte 5 runes: props
  let { currentAdminUsername = "" } = $props<{ currentAdminUsername: string }>();

  let users = $state<UserItem[]>([]);
  let loadingUsers = $state(false);

  // New user creation modal and state
  let showCreateModal = $state(false);
  let newUsername = $state("");
  let newPassword = $state("");
  let creatingUser = $state(false);

  let searchQuery = $state("");
  let filterStatus = $state<"all" | "active" | "inactive">("all");

  let errorMsg = $state("");
  let successMsg = $state("");

  // Derived statistics
  let totalCount = $derived(users.length);
  let activeCount = $derived(users.filter((u) => u.status === "active").length);
  let pendingCount = $derived(users.filter((u) => u.status === "inactive").length);

  // Derived filtered users
  let filteredUsers = $derived(
    users.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === "all" || user.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
  );

  async function loadUsers() {
    loadingUsers = true;
    errorMsg = "";
    try {
      const res = await request<{ users: UserItem[] }>("/api/v1/admin/users");
      if (res.error) {
        errorMsg = res.error.message;
      } else {
        users = res.data?.users || [];
      }
    } finally {
      loadingUsers = false;
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: "active" | "inactive") {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    errorMsg = "";
    successMsg = "";

    const res = await request(`/api/v1/admin/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.error) {
      errorMsg = res.error.message;
    } else {
      successMsg = "用户激活状态已更新。";
      await loadUsers();
    }
  }

  async function handleCreateUser(e: SubmitEvent) {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;

    creatingUser = true;
    errorMsg = "";
    successMsg = "";

    try {
      const res = await request<{ user_id: string }>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
        }),
      });

      if (res.error) {
        errorMsg = res.error.message;
      } else if (res.data) {
        successMsg = `用户 '${newUsername}' 创建成功！账号默认为 '待激活' 状态。`;
        newUsername = "";
        newPassword = "";
        showCreateModal = false;
        await loadUsers();
      }
    } finally {
      creatingUser = false;
    }
  }

  function formatDate(isoStr?: string): string {
    if (!isoStr) return "";
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
    loadUsers();
  });
</script>

<div class="users-container">
  <!-- Header Title -->
  <div class="header-section">
    <h1>系统用户管理 (管理员专属)</h1>
    <p class="description">
      系统运行于自托管多用户模式下。在此您可以查看所有注册用户，审核并激活新用户的 API 访问权限。
    </p>
  </div>

  <!-- Messages Banner -->
  {#if errorMsg}
    <div class="error-banner">⚠️ {errorMsg}</div>
  {/if}

  {#if successMsg}
    <div class="success-banner">✨ {successMsg}</div>
  {/if}

  <!-- Stats cards panel -->
  <div class="stats-row">
    <div class="stats-card">
      <span class="stats-label">总注册用户</span>
      <span class="stats-value">{totalCount}</span>
      <span class="stats-desc">系统内所有已注册账户</span>
    </div>
    <div class="stats-card {pendingCount > 0 ? 'highlight' : ''}">
      <span class="stats-label">待审核激活</span>
      <span class="stats-value" style={pendingCount > 0 ? 'color: var(--accent-ochre);' : ''}>
        {pendingCount}
      </span>
      <span class="stats-desc">需要管理员人工审批激活</span>
    </div>
    <div class="stats-card">
      <span class="stats-label">已激活用户</span>
      <span class="stats-value" style="color: var(--accent-sage);">{activeCount}</span>
      <span class="stats-desc">拥有 API 访问权限的账户</span>
    </div>
  </div>

  <!-- Toolbar Search & Filters -->
  <div class="toolbar-row">
    <div class="toolbar-left">
      <!-- Search Input -->
      <div class="search-input-wrapper">
        <svg class="search-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="text"
          class="paper-input"
          placeholder="搜索用户名或 ID..."
          bind:value={searchQuery}
        />
      </div>

      <!-- Filter Pills -->
      <div class="filter-pills">
        <button
          class="filter-pill {filterStatus === 'all' ? 'active' : ''}"
          onclick={() => filterStatus = "all"}
        >
          全部
        </button>
        <button
          class="filter-pill {filterStatus === 'active' ? 'active' : ''}"
          onclick={() => filterStatus = "active"}
        >
          已激活
        </button>
        <button
          class="filter-pill {filterStatus === 'inactive' ? 'active' : ''}"
          onclick={() => filterStatus = "inactive"}
        >
          待激活
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="toolbar-right">
      <button class="paper-button primary" onclick={() => showCreateModal = true}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        创建系统新用户
      </button>
    </div>
  </div>

  <!-- Users list card (Full-Width) -->
  <div class="list-card paper-card">
    <div class="list-card-header">
      <h3>📋 系统用户列表</h3>
      <span class="count-badge">共计 {filteredUsers.length} 项</span>
    </div>

    {#if loadingUsers}
      <div class="loading-state">载入用户列表中...</div>
    {:else if filteredUsers.length === 0}
      <div class="empty-state">没有符合筛选条件的系统用户</div>
    {:else}
      <table class="paper-table">
        <thead>
          <tr>
            <th>用户信息</th>
            <th>用户 ID</th>
            <th>存储目录</th>
            <th>注册时间</th>
            <th>当前状态</th>
            <th class="actions-header">状态操作</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredUsers as user}
            <tr class={user.username === currentAdminUsername ? 'admin-row' : ''}>
              <td>
                <div class="user-identity-cell">
                  <div class="avatar-circle">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div class="user-identity-details">
                    <div class="user-identity-name">
                      {user.username}
                      {#if user.username === currentAdminUsername}
                        <span class="admin-tag-pill">管理员</span>
                      {/if}
                    </div>
                  </div>
                </div>
              </td>
              <td class="font-mono text-xs text-muted">{user.id}</td>
              <td>
                <span class="dir-badge">
                  📁 <code>{user.kb_path}</code>
                </span>
              </td>
              <td class="font-sans text-xs">{formatDate(user.created_at)}</td>
              <td>
                {#if user.status === 'active'}
                  <span class="status-badge active">
                    <span class="indicator-dot active"></span>已激活
                  </span>
                {:else}
                  <span class="status-badge inactive">
                    <span class="indicator-dot inactive"></span>待激活
                  </span>
                {/if}
              </td>
              <td class="actions-cell">
                {#if user.username === currentAdminUsername}
                  <span class="disabled-text">核心管理员</span>
                {:else}
                  <button
                    class="status-toggle-btn {user.status === 'active' ? 'deactivate' : 'activate'}"
                    onclick={() => toggleUserStatus(user.id, user.status)}
                  >
                    {user.status === 'active' ? '冻结账户' : '激活账户'}
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<!-- Create User Modal Popup -->
{#if showCreateModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showCreateModal = false; }}>
    <div class="modal-container">
      <div class="modal-header">
        <h3>👥 创建系统新用户</h3>
        <button class="modal-close-btn" aria-label="关闭" onclick={() => showCreateModal = false}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <form onsubmit={handleCreateUser}>
        <div class="modal-body">
          <div class="form-group">
            <label for="reg-username">新用户名</label>
            <input
              type="text"
              id="reg-username"
              class="paper-input"
              placeholder="输入新账号名称"
              bind:value={newUsername}
              disabled={creatingUser}
              required
            />
          </div>

          <div class="form-group">
            <label for="reg-password">初始密码</label>
            <input
              type="password"
              id="reg-password"
              class="paper-input"
              placeholder="输入新账号初始密码"
              bind:value={newPassword}
              disabled={creatingUser}
              required
            />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="paper-button" onclick={() => showCreateModal = false} disabled={creatingUser}>
            取消
          </button>
          <button type="submit" class="paper-button primary" disabled={creatingUser}>
            {creatingUser ? "创建中..." : "创建用户"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .users-container {
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

  .admin-row {
    background: #fdfcf7 !important;
  }

  .font-mono {
    font-family: monospace;
  }

  .text-xs {
    font-size: 11px;
  }

  .text-muted {
    color: var(--text-muted);
  }

  .admin-tag-pill {
    font-size: 10px;
    padding: 1px 6px;
    background: #e6fffa;
    color: #047481;
    border: 1px solid #b2f5ea;
    border-radius: 4px;
    font-weight: 600;
    line-height: 1;
  }

  .dir-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    background: var(--bg-paper);
    border: 1px solid var(--border-fine);
    padding: 3px 8px;
    border-radius: 4px;
    color: var(--text-ink);
  }

  .dir-badge code {
    background: transparent;
    border: none;
    padding: 0;
  }

  .status-badge {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 600;
    border: 1px solid;
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }

  .status-badge.active {
    background: #f0fdf4;
    color: #166534;
    border-color: #bbf7d0;
  }

  .status-badge.inactive {
    background: #fff7ed;
    color: #ea580c;
    border-color: #ffedd5;
  }

  .actions-header {
    text-align: right !important;
    padding-right: 20px !important;
  }

  .actions-cell {
    text-align: right;
    padding-right: 20px !important;
  }

  .status-toggle-btn {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: 4px;
    cursor: pointer;
    background: var(--bg-paper);
    transition: all 0.2s ease;
    outline: none;
  }

  .status-toggle-btn.activate {
    border: 1px solid var(--accent-sage);
    color: var(--accent-sage);
  }

  .status-toggle-btn.activate:hover {
    background: var(--accent-sage);
    color: #fff;
  }

  .status-toggle-btn.deactivate {
    border: 1px solid #fee2e2;
    color: #b91c1c;
  }

  .status-toggle-btn.deactivate:hover {
    background: #fee2e2;
  }

  .disabled-text {
    font-size: 11px;
    color: var(--text-muted);
    font-style: italic;
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
