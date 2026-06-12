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

  // Extract first letter of username for seal monogram avatar
  const userInitials = $derived(username ? username.charAt(0).toUpperCase() : "?");
</script>

<div class="sidebar {isCollapsed ? 'collapsed' : ''}">
  <div class="top-sec">
    <div class="brand">
      <div class="brand-left">
        <div class="logo-container" title="Knovana">
          <svg class="k-logo" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="stemGrad" x1="34" y1="25" x2="58" y2="103" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#1E40AF" />
                <stop offset="1" stop-color="#1D3082" />
              </linearGradient>
              <linearGradient id="spineBevel" x1="34" y1="64" x2="43" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#0F1F5C" stop-opacity="0.30" />
                <stop offset="0.42" stop-color="#142C82" stop-opacity="0.14" />
                <stop offset="1" stop-color="#142C82" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="spineInnerLight" x1="54" y1="64" x2="58" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#FFFFFF" stop-opacity="0" />
                <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.13" />
              </linearGradient>
              <linearGradient id="faceTop" x1="58" y1="64" x2="102" y2="19" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#1D4FD7" />
                <stop offset="0.6" stop-color="#2D6FE8" />
                <stop offset="1" stop-color="#5B9CF5" />
              </linearGradient>
              <linearGradient id="faceBot" x1="58" y1="65" x2="102" y2="109" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#0C8B7F" />
                <stop offset="0.55" stop-color="#0E9B89" />
                <stop offset="1" stop-color="#0FB87E" />
              </linearGradient>
            </defs>
            <g>
              <rect x="34" y="26" width="24" height="76" rx="1.5" fill="url(#stemGrad)" />
              <rect x="34.5" y="27" width="8.5" height="74" rx="1.1" fill="url(#spineBevel)" />
              <rect x="53.5" y="27" width="4" height="74" rx="1.1" fill="url(#spineInnerLight)" />
              <polygon points="58,64 76,28 90,28 108,42 82,64" fill="url(#faceTop)" />
              <polygon points="60,60 76,30 88,30 76,48" fill="white" opacity="0.10" />
              <polygon points="58,65 82,65 108,86 90,100 76,100" fill="url(#faceBot)" />
              <polygon points="60,67 76,67 84,76 68,88" fill="white" opacity="0.08" />
              <line x1="58" y1="64.5" x2="82" y2="64.5" stroke="#0F2E5C" stroke-width="1" opacity="0.20" />
            </g>
          </svg>
        </div>
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
        <div class="profile-avatar-seal">
          {userInitials}
        </div>
        <div class="profile-info">
          <div class="profile-name" title={username}>{username}</div>
          <div class="badges-row">
            {#if isAdmin}
              <span class="profile-badge admin-badge">管理员</span>
            {:else}
              <span class="profile-badge user-badge">用户</span>
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
        class="profile-avatar-seal-collapsed" 
        title="{username} ({isAdmin ? '管理员' : '普通用户'} - {status === 'active' ? '已激活' : '待激活'})"
      >
        {userInitials}
      </div>
    {/if}

    <button class="logout-btn" onclick={onLogout} title={isCollapsed ? "安全退出" : ""}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
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
    padding: 24px 20px;
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
    gap: 10px;
  }

  .logo-container {
    display: inline-flex;
    width: 28px;
    height: 28px;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    filter: drop-shadow(0 4px 8px rgba(29, 48, 130, 0.1));
  }

  .logo-container:hover {
    transform: rotate(-8deg) scale(1.12);
  }

  .k-logo {
    display: block;
    width: 100%;
    height: 100%;
  }

  .brand h2 {
    font-family: var(--font-serif);
    font-size: 19px;
    font-weight: 700;
    color: var(--text-ink);
    letter-spacing: -0.01em;
  }

  .collapse-toggle-btn {
    background: transparent;
    border: none;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    padding: 0;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    outline: none;
    border: 1px solid transparent;
  }

  .collapse-toggle-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
    border-color: var(--border-fine);
  }

  .nav-links {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 14px 10px 16px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    position: relative;
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
    outline: none;
  }

  .nav-btn svg {
    color: var(--text-muted);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease;
    flex-shrink: 0;
  }

  .nav-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-ink);
    padding-left: 20px;
  }

  .nav-btn:hover svg {
    color: var(--text-ink);
    transform: scale(1.08);
  }

  .sidebar.collapsed .nav-btn {
    padding: 10px 0;
    justify-content: center;
  }

  .sidebar.collapsed .nav-btn:hover {
    padding-left: 0;
    transform: scale(1.06);
  }

  .nav-btn.active {
    background: var(--bg-paper);
    color: var(--accent-ochre);
    box-shadow: 0 4px 12px rgba(35, 33, 28, 0.04), 0 2px 4px rgba(35, 33, 28, 0.02);
    font-weight: 600;
  }

  .nav-btn.active svg {
    color: var(--accent-ochre);
  }

  /* Active selection bar indicator */
  .nav-btn.active::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 32%;
    width: 3px;
    height: 36%;
    background-color: var(--accent-ochre);
    border-radius: 2px;
  }

  .sidebar.collapsed .nav-btn.active::before {
    left: 4px;
  }

  .bottom-sec {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-top: 1px solid var(--border-fine);
    padding-top: 20px;
  }

  .profile-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 2px;
  }

  /* Monogram Seal Avatar styles */
  .profile-avatar-seal {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg-paper);
    border: 1.5px solid var(--accent-ochre);
    box-shadow: inset 0 0 0 2px var(--bg-paper), 0 2px 5px rgba(178, 90, 56, 0.15);
    color: var(--accent-ochre);
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    flex: 0 0 auto;
  }

  .profile-avatar-seal-collapsed {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: var(--bg-paper);
    border: 1.5px solid var(--accent-ochre);
    box-shadow: inset 0 0 0 2px var(--bg-paper), 0 2px 4px rgba(178, 90, 56, 0.15);
    color: var(--accent-ochre);
    font-family: var(--font-serif);
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    cursor: default;
    user-select: none;
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
    gap: 6px;
    align-items: center;
  }

  .profile-badge {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 4px;
    font-weight: 600;
    font-family: var(--font-sans);
    line-height: 1.2;
  }

  .admin-badge {
    background: rgba(74, 107, 93, 0.1); /* Soft Sage background */
    color: var(--accent-sage);
    border: 1px solid rgba(74, 107, 93, 0.2);
  }

  .user-badge {
    background: var(--bg-card-hover);
    color: var(--text-muted);
    border: 1px solid var(--border-fine);
  }

  .status-badge {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 4px;
    font-weight: 600;
    font-family: var(--font-sans);
    line-height: 1.2;
  }

  .active-badge {
    background: rgba(22, 101, 52, 0.08); /* Soft Green */
    color: #166534;
    border: 1px solid rgba(22, 101, 52, 0.15);
  }

  .inactive-badge {
    background: rgba(185, 28, 28, 0.08); /* Soft Red */
    color: #b91c1c;
    border: 1px solid rgba(185, 28, 28, 0.15);
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
