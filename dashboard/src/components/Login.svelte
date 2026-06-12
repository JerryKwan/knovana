<script lang="ts">
  import { onMount, tick } from "svelte";
  import { request, setToken } from "../lib/api";
  import BrandMark from "./BrandMark.svelte";

  let { onSuccess = () => {} } = $props<{ onSuccess: () => void }>();

  let isRegister = $state(false);
  let username = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let loading = $state(false);
  let errorMsg = $state("");

  let usernameInput = $state<HTMLInputElement | undefined>();

  async function focusUsername() {
    await tick();
    usernameInput?.focus();
  }

  onMount(() => {
    void focusUsername();
  });

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

  async function toggleMode() {
    isRegister = !isRegister;
    errorMsg = "";
    password = "";
    confirmPassword = "";
    await focusUsername();
  }
</script>

<div class="auth-shell">
  <div class="auth-card">
    <div class="brand-header">
      <BrandMark size={56} />
      <h1>Knovana</h1>
      <p class="subtitle">
        {isRegister ? "创建您的控制台账号" : "个人知识管理控制台"}
      </p>
    </div>

    <form onsubmit={handleSubmit}>
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          bind:this={usernameInput}
          type="text"
          id="username"
          class="paper-input"
          placeholder="输入用户名"
          bind:value={username}
          disabled={loading}
          autocomplete="username"
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
          autocomplete={isRegister ? "new-password" : "current-password"}
          required
        />
      </div>

      {#if isRegister}
        <div class="form-group confirm-field">
          <label for="confirm-password">确认密码</label>
          <input
            type="password"
            id="confirm-password"
            class="paper-input"
            placeholder="确认输入密码"
            bind:value={confirmPassword}
            disabled={loading}
            autocomplete="new-password"
            required
          />
        </div>
      {/if}

      {#if errorMsg}
        <div class="error-banner" role="alert">
          {errorMsg}
        </div>
      {/if}

      <button type="submit" class="paper-button primary submit-btn" disabled={loading}>
        {loading ? "处理中..." : isRegister ? "注册新账号" : "登录系统"}
      </button>
    </form>

    <div class="toggle-footer">
      <button type="button" class="toggle-link" onclick={toggleMode} disabled={loading}>
        {isRegister ? "已有账号？立即登录" : "没有账号？创建新用户"}
      </button>
    </div>
  </div>
</div>

<style>
  .auth-shell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px 20px;
    background-color: var(--bg-paper);
    background-image:
      radial-gradient(ellipse 80% 60% at 15% 10%, rgba(74, 107, 93, 0.1), transparent 55%),
      radial-gradient(ellipse 70% 55% at 85% 90%, rgba(178, 90, 56, 0.08), transparent 50%),
      radial-gradient(ellipse 50% 40% at 50% 45%, rgba(45, 111, 232, 0.06), transparent 60%);
  }

  .auth-card {
    width: 100%;
    max-width: 420px;
    padding: 32px 28px;
    border: 1px solid rgba(226, 224, 216, 0.85);
    border-radius: 8px;
    background: rgba(251, 250, 247, 0.82);
    backdrop-filter: blur(12px);
    box-shadow:
      0 1px 2px rgba(35, 33, 28, 0.04),
      0 8px 32px rgba(35, 33, 28, 0.06);
    animation: authEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes authEnter {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .brand-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
    text-align: center;
  }

  .brand-header h1 {
    font-size: 1.75rem;
    line-height: 1.2;
    margin: 0;
  }

  .subtitle {
    font-size: 13px;
    color: var(--text-muted);
    font-family: var(--font-sans);
    margin: 0;
    transition: opacity 0.2s ease;
  }

  .form-group {
    margin-bottom: 18px;
    text-align: left;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--text-muted);
  }

  .confirm-field {
    animation: authEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .error-banner {
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-left: 3px solid #c53030;
    color: #9b2c2c;
    padding: 10px 14px;
    border-radius: 4px;
    font-size: 13px;
    margin-bottom: 18px;
    text-align: left;
  }

  .submit-btn {
    width: 100%;
    margin-top: 6px;
    height: 42px;
  }

  .toggle-footer {
    text-align: center;
    margin-top: 22px;
  }

  .toggle-link {
    background: none;
    border: none;
    padding: 4px 8px;
    font-size: 13px;
    font-family: var(--font-sans);
    color: var(--accent-ochre);
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .toggle-link:hover:not(:disabled) {
    color: var(--accent-terracotta);
    text-decoration: underline;
  }

  .toggle-link:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    .auth-card {
      padding: 28px 22px;
    }
  }
</style>
