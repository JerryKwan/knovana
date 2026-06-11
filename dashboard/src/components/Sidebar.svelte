<script lang="ts">
  // Svelte 5 runes: props
  let {
    activeTab = "knowledge",
    isAdmin = false,
    username = "",
    status = "inactive",
    isCollapsed = false,
    onToggleCollapse = () => {},
    onTabChange = () => {},
    onLogout = () => {},
  } = $props<{
    activeTab: string;
    isAdmin: boolean;
    username: string;
    status: string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onTabChange: (tab: string) => void;
    onLogout: () => void;
  }>();
</script>

<div class="sidebar {isCollapsed ? 'collapsed' : ''}">
  <div class="top-sec">
    <div class="brand">
      <div class="brand-left">
        <span class="logo">📚</span>
        {#if !isCollapsed}
          <h2>Knovana</h2>
        {/if}
      </div>
      <button 
        class="collapse-toggle-btn" 
        onclick={onToggleCollapse} 
        title={isCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        aria-label={isCollapsed ? "展开侧边栏" : "折叠侧边栏"}
      >
        {#if isCollapsed}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        {/if}
      </button>
    </div>

    <div class="nav-links">
      <button
        class="nav-btn {activeTab === 'knowledge' ? 'active' : ''}"
        onclick={() => onTabChange("knowledge")}
        title={isCollapsed ? "浏览知识库" : ""}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        {#if !isCollapsed}
          浏览知识库
        {/if}
      </button>

      <button
        class="nav-btn {activeTab === 'keys' ? 'active' : ''}"
        onclick={() => onTabChange("keys")}
        title={isCollapsed ? "管理密钥" : ""}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key-round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
        {#if !isCollapsed}
          管理密钥
        {/if}
      </button>

      {#if isAdmin}
        <button
          class="nav-btn {activeTab === 'users' ? 'active' : ''}"
          onclick={() => onTabChange("users")}
          title={isCollapsed ? "用户管理" : ""}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {#if !isCollapsed}
            用户管理
          {/if}
        </button>
      {/if}
    </div>
  </div>

  <div class="bottom-sec">
    {#if !isCollapsed}
      <div class="profile-card">
        <div class="profile-avatar">👤</div>
        <div class="profile-info">
          <div class="profile-name" title={username}>{username}</div>
          <div class="badges-row">
            {#if isAdmin}
              <span class="profile-badge admin-badge">管理员</span>
            {:else}
              <span class="profile-badge user-badge">普通用户</span>
            {/if}
            
            {#if status === 'active'}
              <span class="status-badge active-badge">已激活</span>
            {:else}
              <span class="status-badge inactive-badge">待激活</span>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div 
        class="profile-avatar-collapsed" 
        title="{username} ({isAdmin ? '管理员' : '普通用户'} - {status === 'active' ? '已激活' : '待激活'})"
      >
        👤
      </div>
    {/if}

    <button class="logout-btn" onclick={onLogout} title={isCollapsed ? "安全退出" : ""}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
      {#if !isCollapsed}
        安全退出
      {/if}
    </button>
  </div>
</div>

<style>
  .sidebar {
    background: var(--bg-card);
    border-right: 1px solid var(--border-fine);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px;
    height: 100%;
    transition: padding 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.collapsed {
    padding: 24px 8px;
  }

  .top-sec {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px;
    width: 100%;
  }

  .sidebar.collapsed .brand {
    flex-direction: column-reverse;
    gap: 16px;
    align-items: center;
    justify-content: center;
  }

  .brand-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .brand .logo {
    font-size: 24px;
  }

  .brand h2 {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 700;
  }

  .collapse-toggle-btn {
    background: transparent;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    padding: 0;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
  }

  .collapse-toggle-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
    transform: scale(1.08);
  }

  .nav-links {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 14px 10px 18px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    position: relative;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
  }

  .nav-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
    padding-left: 22px;
  }

  .sidebar.collapsed .nav-btn {
    padding: 10px 0;
    justify-content: center;
  }

  .sidebar.collapsed .nav-btn:hover {
    padding-left: 0;
    transform: scale(1.05);
  }

  .nav-btn.active {
    background: var(--bg-paper);
    color: var(--accent-ochre);
    box-shadow: var(--shadow-paper);
    font-weight: 600;
  }

  /* Active selection bar indicator */
  .nav-btn.active::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 25%;
    width: 3px;
    height: 50%;
    background-color: var(--accent-ochre);
    border-radius: 2px;
  }

  .sidebar.collapsed .nav-btn.active::before {
    left: 3px;
  }

  .bottom-sec {
    display: flex;
    flex-direction: column;
    gap: 18px;
    border-top: 1px solid var(--border-fine);
    padding-top: 18px;
  }

  .profile-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px;
  }

  .profile-avatar {
    font-size: 20px;
    background: var(--bg-card-hover);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-fine);
  }

  .profile-avatar-collapsed {
    font-size: 18px;
    background: var(--bg-card-hover);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-fine);
    margin: 0 auto;
    cursor: default;
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .profile-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--text-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }

  .badges-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .profile-badge {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 600;
    line-height: 1.2;
  }

  .admin-badge {
    background: #e6fffa;
    color: #047481;
    border: 1px solid #b2f5ea;
  }

  .user-badge {
    background: #edf2f7;
    color: #4a5568;
    border: 1px solid #e2e8f0;
  }

  .status-badge {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 600;
    line-height: 1.2;
  }

  .active-badge {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .inactive-badge {
    background: #fff7ed;
    color: #9a3412;
    border: 1px solid #ffedd5;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 8px;
    background: transparent;
    border: 1px solid var(--border-fine);
    border-radius: 6px;
    color: #b91c1c;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
  }

  .logout-btn:hover {
    background: #fef2f2;
    border-color: #fee2e2;
  }

  .sidebar.collapsed .logout-btn {
    padding: 8px 0;
  }
</style>
