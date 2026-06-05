<script lang="ts">
  import {
    Check,
    Eye,
    EyeOff,
    KeyRound,
    Link2,
    LoaderCircle,
    Monitor,
    Moon,
    PlugZap,
    Save,
    Sun,
    ToggleRight,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import {
    DEFAULT_SETTINGS,
    getSettings,
    normalizeBackendUrl,
    saveSettings,
  } from '../../services/storage';
  import { applyThemePreference } from '../../services/theme';
  import type { ExtensionSettings, ThemePreference } from '../../types/settings';

  export let variant: 'panel' | 'page' = 'panel';
  export let onSaved: (settings: ExtensionSettings) => void = () => undefined;
  export let onClose: () => void = () => undefined;

  let settings: ExtensionSettings = { ...DEFAULT_SETTINGS };
  let saved = false;
  let loading = true;
  let checking = false;
  let checkMessage = '';
  let checkTone: 'neutral' | 'ok' | 'error' = 'neutral';
  let savedTimer: ReturnType<typeof setTimeout> | undefined;
  let checkTimer: ReturnType<typeof setTimeout> | undefined;
  let showToken = false;

  const themes: Array<{ value: ThemePreference; label: string }> = [
    { value: 'system', label: '跟随系统' },
    { value: 'light', label: '浅色' },
    { value: 'dark', label: '深色' },
  ];

  onMount(() => {
    void load();
    return () => {
      if (savedTimer) clearTimeout(savedTimer);
      if (checkTimer) clearTimeout(checkTimer);
    };
  });

  async function load() {
    loading = true;
    settings = await getSettings();
    applyThemePreference(settings.theme);
    loading = false;
  }

  function setTheme(theme: ThemePreference) {
    settings = { ...settings, theme };
    applyThemePreference(theme);
  }

  async function save() {
    const next = {
      ...settings,
      backendUrl: normalizeBackendUrl(settings.backendUrl),
    };
    await saveSettings(next);
    settings = next;
    applyThemePreference(next.theme);
    onSaved(next);
    saved = true;
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      saved = false;
    }, 1800);
  }

  async function testConnection() {
    checking = true;
    checkMessage = '';
    checkTone = 'neutral';
    if (checkTimer) clearTimeout(checkTimer);

    try {
      const headers = new Headers();
      if (settings.token) headers.set('Authorization', `Bearer ${settings.token}`);
      const response = await fetch(`${normalizeBackendUrl(settings.backendUrl)}/knowledge/stats`, {
        headers,
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未授权 (401)');
        }
        if (response.status === 403) {
          throw new Error('拒绝访问 (403)');
        }
        if (response.status === 404) {
          throw new Error('未找到服务 (404)');
        }
        throw new Error(`HTTP ${response.status}`);
      }
      checkMessage = '连接成功';
      checkTone = 'ok';
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('Failed to fetch') || errMsg.includes('fetch failed')) {
        checkMessage = '连接失败: 无法访问服务';
      } else {
        checkMessage = `连接失败: ${errMsg}`;
      }
      checkTone = 'error';
    } finally {
      checking = false;
      checkTimer = setTimeout(() => {
        checkMessage = '';
        checkTone = 'neutral';
      }, 3000);
    }
  }
</script>

<section class={`settings-panel ${variant}`} aria-label="扩展设置" aria-busy={loading}>
  <form class="settings-body kn-scrollbar" onsubmit={(event) => event.preventDefault()}>
    <div class="settings-card">
      <div class="section-heading">
        <span class="section-icon"><PlugZap size={16} /></span>
        <div>
          <h2>后端连接</h2>
          <p>API 地址和访问凭据</p>
        </div>
      </div>

      <label class="field">
        <span class="field-label">
          <Link2 size={13} />
          API 地址
        </span>
        <input
          bind:value={settings.backendUrl}
          class="input-control"
          autocomplete="off"
          disabled={loading}
          placeholder="http://localhost:8000/api/v1"
        />
      </label>

      <label class="field">
        <span class="field-label">
          <KeyRound size={13} />
          访问凭据
        </span>
        <div class="input-wrapper">
          <input
            bind:value={settings.token}
            type={showToken ? 'text' : 'password'}
            class="input-control"
            autocomplete="off"
            disabled={loading}
            placeholder="Bearer token"
          />
          <button
            type="button"
            class="visibility-toggle"
            disabled={loading}
            onclick={() => (showToken = !showToken)}
            aria-label={showToken ? '隐藏凭据' : '显示凭据'}
          >
            {#if showToken}
              <EyeOff size={16} />
            {:else}
              <Eye size={16} />
            {/if}
          </button>
        </div>
      </label>

      <div class="connection-row">
        {#if checkMessage}
          <span class={`connection-status ${checkTone}`}>
            {checkMessage}
          </span>
        {/if}

        <button
          type="button"
          class="secondary-button"
          disabled={loading || checking}
          onclick={testConnection}
        >
          {#if checking}
            <LoaderCircle size={14} class="spin" />
            检测中
          {:else}
            <PlugZap size={14} />
            测试连接
          {/if}
        </button>
      </div>
    </div>

    <div class="settings-card">
      <div class="section-heading">
        <span class="section-icon accent"><ToggleRight size={16} /></span>
        <div>
          <h2>界面偏好</h2>
          <p>主题和侧栏行为</p>
        </div>
      </div>

      <div class="field">
        <span class="field-label">主题</span>
        <div class="segmented-control" role="radiogroup" aria-label="主题">
          {#each themes as theme (theme.value)}
            <button
              type="button"
              class:active={settings.theme === theme.value}
              disabled={loading}
              role="radio"
              aria-checked={settings.theme === theme.value}
              onclick={() => setTheme(theme.value)}
            >
              {#if theme.value === 'system'}
                <Monitor size={13} />
              {:else if theme.value === 'light'}
                <Sun size={13} />
              {:else}
                <Moon size={13} />
              {/if}
              {theme.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="field">
        <span class="field-label">侧栏行为</span>
        <label class="toggle-row">
          <div class="toggle-info">
            <strong>右键动作后打开侧栏</strong>
            <small>保存、摘要和生成文档时自动展开</small>
          </div>
          <div class="switch">
            <input
              bind:checked={settings.autoOpenSidePanel}
              type="checkbox"
              aria-label="右键动作后打开侧栏"
              disabled={loading}
            />
            <span class="slider"></span>
          </div>
        </label>
      </div>
    </div>

    <footer class="settings-footer">
      {#if saved}
        <span class="saved-note">
          <Check size={13} />
          已保存
        </span>
      {/if}
      {#if variant === 'panel'}
        <button type="button" class="secondary-button" disabled={loading} onclick={onClose}>
          取消
        </button>
      {/if}
      <button type="button" class="primary-button" disabled={loading} onclick={save}>
        <Save size={14} />
        保存设置
      </button>
    </footer>
  </form>
</section>

<style>
  .settings-panel {
    display: flex;
    min-height: 0;
    flex-direction: column;
    color: var(--kn-text);
  }

  .settings-panel.panel {
    height: 100%;
    background: var(--kn-bg);
  }

  .settings-panel.page {
    min-height: min(760px, calc(100vh - 48px));
    overflow: hidden;
    border: 1px solid var(--kn-border);
    border-radius: 12px;
    background: var(--kn-bg-raised);
    box-shadow: var(--kn-shadow-panel);
  }

  /* ── Body ────────────────────────────────────────────────────── */

  .settings-body {
    min-height: 0;
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .settings-panel.page .settings-body {
    padding: 20px;
    gap: 16px;
  }

  /* ── Card Grouping ───────────────────────────────────────────── */

  .settings-card {
    background: var(--kn-bg-raised);
    border: 1px solid var(--kn-border);
    border-radius: 12px;
    padding: 14px 16px 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .settings-panel.page .settings-card {
    padding: 18px 20px 20px;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .section-icon {
    display: grid;
    width: 32px;
    height: 32px;
    flex: 0 0 auto;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .section-icon.accent {
    background: color-mix(in srgb, var(--kn-accent) 14%, transparent);
    color: var(--kn-accent);
  }

  .section-heading h2,
  .section-heading p {
    margin: 0;
  }

  .section-heading h2 {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.005em;
    line-height: 1.3;
  }

  .section-heading p {
    margin-top: 1px;
    color: var(--kn-text-muted);
    font-size: 11.5px;
    line-height: 1.45;
    font-weight: 500;
  }

  /* ── Form Fields ─────────────────────────────────────────────── */

  .field {
    display: block;
    margin-top: 11px;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 5px;
    color: var(--kn-text-muted);
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .input-control {
    width: 100%;
    height: 40px;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-field-bg);
    color: var(--kn-text);
    padding: 0 11px;
    font-size: 13px;
    letter-spacing: 0.005em;
    outline: none;
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  .input-control:focus {
    border-color: color-mix(in srgb, var(--kn-primary) 46%, var(--kn-border));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--kn-primary) 10%, transparent);
  }

  .input-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  }

  .input-wrapper .input-control {
    padding-right: 38px;
  }

  .visibility-toggle {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 0;
    background: transparent;
    color: var(--kn-text-muted);
    border-radius: 6px;
    cursor: pointer;
    outline: none;
    transition:
      color 160ms ease,
      background-color 160ms ease;
  }

  .visibility-toggle:hover:not(:disabled) {
    color: var(--kn-text);
    background-color: var(--kn-bg-subtle);
  }

  .visibility-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* ── Buttons ─────────────────────────────────────────────────── */

  .connection-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 14px;
  }

  .settings-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 14px;
    padding-top: 18px;
  }

  .secondary-button,
  .primary-button {
    display: inline-flex;
    height: 36px;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.005em;
    cursor: pointer;
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      background 160ms ease,
      color 160ms ease,
      box-shadow 160ms ease;
  }

  .secondary-button {
    border: 1px solid var(--kn-border);
    background: var(--kn-bg-raised);
    color: var(--kn-primary);
    padding: 0 14px;
  }

  .secondary-button:hover:not(:disabled) {
    border-color: var(--kn-primary);
    background: var(--kn-primary-soft);
  }

  .primary-button {
    border: 0;
    background: linear-gradient(
      135deg,
      var(--kn-primary),
      color-mix(in srgb, var(--kn-primary) 72%, var(--kn-accent))
    );
    color: var(--kn-primary-ink);
    padding: 0 18px;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--kn-primary) 20%, transparent);
  }

  .primary-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px color-mix(in srgb, var(--kn-primary) 26%, transparent);
  }

  .secondary-button:disabled,
  .primary-button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
    transform: none;
  }

  /* ── Status ──────────────────────────────────────────────────── */

  .connection-status,
  .saved-note {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .connection-status.ok,
  .saved-note {
    color: var(--kn-accent);
  }

  .connection-status.error {
    color: var(--kn-danger);
  }

  /* ── Segmented Control ───────────────────────────────────────── */

  .segmented-control {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
    border: 1px solid var(--kn-border);
    border-radius: 9px;
    background: var(--kn-field-bg);
    padding: 4px;
  }

  .segmented-control button {
    display: inline-flex;
    min-width: 0;
    height: 34px;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--kn-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition:
      background 160ms ease,
      color 160ms ease,
      box-shadow 160ms ease;
  }

  .segmented-control button:hover:not(.active):not(:disabled) {
    background: var(--kn-bg-subtle);
    color: var(--kn-text);
  }

  .segmented-control button.active {
    background: var(--kn-bg-raised);
    color: var(--kn-primary);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--kn-text) 6%, transparent);
  }

  .segmented-control button:disabled {
    opacity: 0.5;
  }

  /* ── Toggle Row & Switch ─────────────────────────────────────── */

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 6px;
    border: 1px solid var(--kn-border);
    border-radius: 9px;
    background: var(--kn-field-bg);
    padding: 12px 14px;
    cursor: pointer;
    transition:
      border-color 160ms ease,
      background 160ms ease;
  }

  .toggle-row:hover {
    border-color: color-mix(in srgb, var(--kn-primary) 30%, var(--kn-border));
    background: color-mix(in srgb, var(--kn-primary) 2%, var(--kn-field-bg));
  }

  .toggle-row strong,
  .toggle-row small {
    display: block;
  }

  .toggle-row strong {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.003em;
  }

  .toggle-row small {
    margin-top: 2px;
    color: var(--kn-text-muted);
    font-size: 11.5px;
    line-height: 1.4;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 22px;
    flex: 0 0 auto;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--kn-border-strong);
    transition: background-color 200ms ease;
    border-radius: 22px;
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 3px;
    background-color: var(--kn-bg-raised);
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  .switch input:checked + .slider {
    background-color: var(--kn-primary);
  }

  .switch input:focus-visible + .slider {
    outline: 2px solid color-mix(in srgb, var(--kn-primary) 70%, transparent);
    outline-offset: 2px;
  }

  .switch input:checked + .slider:before {
    transform: translateX(18px);
  }

  .switch input:disabled + .slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spin {
    animation: spin 900ms linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
