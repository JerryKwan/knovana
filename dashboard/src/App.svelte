<script lang="ts">
  import { onMount } from "svelte";
  import { request, getToken, removeToken, getBaseUrl } from "./lib/api";
  import Login from "./components/Login.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Knowledge from "./components/Knowledge.svelte";
  import Keys from "./components/Keys.svelte";
  import Users from "./components/Users.svelte";
  import ChatWidget from "./components/ChatWidget.svelte";

  let loadingProfile = $state(true);
  let authenticated = $state(false);
  let username = $state("");
  let status = $state("inactive");
  let isAdmin = $state(false);
  
  let activeTab = $state("knowledge");
  let isSidebarCollapsed = $state(false);

  // Load profile from the backend
  async function loadProfile() {
    const token = getToken();
    if (!token) {
      authenticated = false;
      loadingProfile = false;
      return;
    }

    loadingProfile = true;
    try {
      const res = await request<{ id: string; username: string; status: string; is_admin: boolean }>(
        "/api/v1/auth/me"
      );

      if (res.error) {
        // Token expired or invalid
        removeToken();
        authenticated = false;
      } else if (res.data) {
        username = res.data.username;
        status = res.data.status;
        isAdmin = res.data.is_admin;
        authenticated = true;
      }
    } finally {
      loadingProfile = false;
    }
  }

  function handleLogout() {
    removeToken();
    authenticated = false;
    username = "";
    status = "inactive";
    isAdmin = false;
    activeTab = "knowledge";
  }

  function handleTabChange(tab: string) {
    activeTab = tab;
  }

  onMount(() => {
    loadProfile();
  });
</script>

{#if loadingProfile}
  <div class="app-loading">
    <div class="spinner">📚</div>
    <p>正在拉取控制台配置...</p>
  </div>
{:else if !authenticated}
  <Login onSuccess={loadProfile} />
{:else}
  <div class="dashboard-layout {isSidebarCollapsed ? 'collapsed' : ''}">
    <!-- Sidebar Navigation -->
    <Sidebar
      {activeTab}
      {isAdmin}
      {username}
      {status}
      isCollapsed={isSidebarCollapsed}
      onToggleCollapse={() => isSidebarCollapsed = !isSidebarCollapsed}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
    />

    <!-- Main Content Panel -->
    <main class="content-pane">
      {#if activeTab === 'knowledge'}
        <Knowledge isBlocked={status !== 'active' && !isAdmin} />
      {:else if activeTab === 'keys'}
        <Keys {isAdmin} isBlocked={status !== 'active' && !isAdmin} />
      {:else if activeTab === 'users' && isAdmin}
        <Users currentAdminUsername={username} />
      {:else}
        <div class="unauthorized-state">
          <h3>🚫 访问受限</h3>
          <p>您无权查看此页面，或者页面不存在。</p>
        </div>
      {/if}
    </main>
  </div>

  <ChatWidget
    apiUrl={getBaseUrl()}
    token={getToken() || ""}
    isBlocked={status !== 'active' && !isAdmin}
  />
{/if}

<style>
  .app-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--bg-paper);
    color: var(--text-muted);
    font-family: var(--font-sans);
  }

  .app-loading .spinner {
    font-size: 48px;
    animation: rotate 2s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .unauthorized-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    border: 1px dashed var(--border-fine);
    border-radius: 4px;
    background: var(--bg-card);
    padding: 40px;
  }

  .unauthorized-state h3 {
    color: #c53030;
    margin-bottom: 10px;
  }
</style>
