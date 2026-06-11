<script lang="ts">
  import { request, setToken } from "../lib/api";

  // Svelte 5 runes: props
  let { onSuccess = () => {} } = $props<{ onSuccess: () => void }>();

  let isRegister = $state(false);
  let username = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let loading = $state(false);
  let errorMsg = $state("");

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    errorMsg = "";

    if (!username || !password) {
      errorMsg = "请填写用户名和密码";
      return;
    }

    if (isRegister && password !== confirmPassword) {
      errorMsg = "两次输入的密码不一致";
      return;
    }

    loading = true;
    const path = isRegister ? "/api/v1/auth/register" : "/api/v1/auth/login";
    
    try {
      const res = await request<{ token: string; user_id: string }>(path, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (res.error) {
        errorMsg = res.error.message;
      } else if (res.data?.token) {
        setToken(res.data.token);
        onSuccess();
      } else {
        errorMsg = "未获取到有效的登录凭证";
      }
    } finally {
      loading = false;
    }
  }

  function toggleMode() {
    isRegister = !isRegister;
    errorMsg = "";
    password = "";
    confirmPassword = "";
  }
</script>

<div class="login-wrapper">
  <div class="paper-card login-card">
    <div class="brand-header">
      <div class="brand-logo">📚</div>
      <h1>Knovana</h1>
      <p class="subtitle">个人知识管理控制台</p>
    </div>

    <form onsubmit={handleSubmit}>
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          type="text"
          id="username"
          class="paper-input"
          placeholder="输入用户名"
          bind:value={username}
          disabled={loading}
          required
        />
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <input
          type="password"
          id="password"
          class="paper-input"
          placeholder="输入密码"
          bind:value={password}
          disabled={loading}
          required
        />
      </div>

      {#if isRegister}
        <div class="form-group">
          <label for="confirm-password">确认密码</label>
          <input
            type="password"
            id="confirm-password"
            class="paper-input"
            placeholder="确认输入密码"
            bind:value={confirmPassword}
            disabled={loading}
            required
          />
        </div>
      {/if}

      {#if errorMsg}
        <div class="error-banner">
          ⚠️ {errorMsg}
        </div>
      {/if}

      <button type="submit" class="paper-button primary submit-btn" disabled={loading}>
        {loading ? "处理中..." : isRegister ? "注册新账号" : "登录系统"}
      </button>
    </form>

    <div class="toggle-footer">
      <!-- svelte-ignore a11y_invalid_attribute -->
      <a href="javascript:void(0)" onclick={toggleMode}>
        {isRegister ? "已有账号？立即登录" : "没有账号？创建新用户"}
      </a>
    </div>
  </div>
</div>

<style>
  .login-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
    background: #fbfaf7;
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    border: 2px solid var(--border-fine);
    box-shadow: var(--shadow-paper-lift);
  }

  .brand-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .brand-logo {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .subtitle {
    font-size: 13px;
    color: var(--text-muted);
    font-family: var(--font-sans);
    margin-top: 4px;
  }

  .form-group {
    margin-bottom: 20px;
    text-align: left;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--text-muted);
  }

  .error-banner {
    background: #fff5f5;
    border: 1px solid #feb2b2;
    color: #c53030;
    padding: 10px 14px;
    border-radius: 4px;
    font-size: 13px;
    margin-bottom: 20px;
    text-align: left;
  }

  .submit-btn {
    width: 100%;
    margin-top: 10px;
    height: 42px;
  }

  .toggle-footer {
    text-align: center;
    margin-top: 24px;
    font-size: 13px;
  }
</style>
