<script lang="ts">
  import {
    Check,
    ChevronLeft,
    KeyRound,
    Link2,
    LoaderCircle,
    Monitor,
    Moon,
    PlugZap,
    Save,
    ShieldCheck,
    Sun,
    ToggleRight,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import BrandMark from '../common/BrandMark.svelte';
  import {
    DEFAULT_SETTINGS,
    getSettings,
    normalizeBackendUrl,
    saveSettings,
  } from '../../services/storage';
  import { applyThemePreference } from '../../services/theme';
  import type { ExtensionSettings, ThemePreference } from '../../types/settings';

  export let variant: 'panel' | 'page' = 'panel';
  export let onClose: (() => void) | undefined = undefined;
  export let onSaved: (settings: ExtensionSettings) => void = () => undefined;

  let settings: ExtensionSettings = { ...DEFAULT_SETTINGS };
  let saved = false;
  let loading = true;
  let checking = false;
  let checkMessage = '';
  let checkTone: 'neutral' | 'ok' | 'error' = 'neutral';
  let savedTimer: ReturnType<typeof setTimeout> | undefined;

  const themes: Array<{ value: ThemePreference; label: string }> = [
    { value: 'system', label: '跟随系统' },
    { value: 'light', label: '浅色' },
    { value: 'dark', label: '深色' },
  ];

  onMount(() => {
    void load();
    return () => {
      if (savedTimer) clearTimeout(savedTimer);
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

    try {
      const headers = new Headers();
      if (settings.token) headers.set('Authorization', `Bearer ${settings.token}`);
      const response = await fetch(`${normalizeBackendUrl(settings.backendUrl)}/knowledge/stats`, {
        headers,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      checkMessage = '连接正常';
      checkTone = 'ok';
    } catch (error) {
      checkMessage = error instanceof Error ? error.message : String(error);
      checkTone = 'error';
    } finally {
      checking = false;
    }
  }
</script>

<section class={`settings-panel ${variant}`} aria-label="扩展设置" aria-busy={loading}>
  <header class="settings-header">
    <div class="settings-title-row">
      {#if onClose}
        <button type="button" class="icon-button" title="返回" onclick={onClose}>
          <ChevronLeft size={18} />
        </button>
      {/if}

      <div class="settings-title">
        <BrandMark size={variant === 'page' ? 42 : 34} />
        <div class="min-w-0">
          <p>Knovana</p>
          <h1>扩展设置</h1>
        </div>
      </div>

      <div class="trust-badge" title="本地配置">
        <ShieldCheck size={16} />
      </div>
    </div>
  </header>

  <form class="settings-body kn-scrollbar" onsubmit={(event) => event.preventDefault()}>
    <section class="settings-section">
      <div class="section-heading">
        <span class="section-icon"><PlugZap size={17} /></span>
        <div>
          <h2>后端连接</h2>
          <p>API 地址和访问凭据</p>
        </div>
      </div>

      <label class="field">
        <span class="field-label">
          <Link2 size={14} />
          Backend URL
        </span>
        <input
          bind:value={settings.backendUrl}
          class="input-control"
          autocomplete="off"
          disabled={loading}
          placeholder="http://localhost:8000/api"
        />
      </label>

      <label class="field">
        <span class="field-label">
          <KeyRound size={14} />
          Access Token
        </span>
        <input
          bind:value={settings.token}
          type="password"
          class="input-control"
          autocomplete="off"
          disabled={loading}
          placeholder="Bearer token"
        />
      </label>

      <div class="connection-row">
        <button
          type="button"
          class="secondary-button"
          disabled={loading || checking}
          onclick={testConnection}
        >
          {#if checking}
            <LoaderCircle size={15} class="spin" />
            检测中
          {:else}
            <PlugZap size={15} />
            测试连接
          {/if}
        </button>

        {#if checkMessage}
          <span class={`connection-status ${checkTone}`}>
            {checkTone === 'ok' ? '已连接' : checkMessage}
          </span>
        {/if}
      </div>
    </section>

    <section class="settings-section">
      <div class="section-heading">
        <span class="section-icon accent"><ToggleRight size={17} /></span>
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
                <Monitor size={14} />
              {:else if theme.value === 'light'}
                <Sun size={14} />
              {:else}
                <Moon size={14} />
              {/if}
              {theme.label}
            </button>
          {/each}
        </div>
      </div>

      <label class="toggle-row">
        <span>
          <strong>右键动作后打开侧栏</strong>
          <small>保存、摘要和生成文档时自动展开</small>
        </span>
        <input
          bind:checked={settings.autoOpenSidePanel}
          type="checkbox"
          aria-label="右键动作后打开侧栏"
          disabled={loading}
        />
      </label>
    </section>

    <footer class="settings-footer">
      {#if saved}
        <span class="saved-note">
          <Check size={14} />
          已保存
        </span>
      {/if}
      <button type="button" class="primary-button" disabled={loading} onclick={save}>
        <Save size={15} />
        保存设置
      </button>
    </footer>
  </form>
</section>

<style>
  .settings-panel {
    display: grid;
    min-height: 0;
    color: var(--kn-text);
  }

  .settings-panel.panel {
    height: 100%;
    grid-template-rows: auto minmax(0, 1fr);
    background: var(--kn-bg);
  }

  .settings-panel.page {
    min-height: min(760px, calc(100vh - 48px));
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-bg-raised);
    box-shadow: var(--kn-shadow-panel);
  }

  .settings-header {
    border-bottom: 1px solid var(--kn-border);
    background:
      linear-gradient(180deg, rgb(255 255 255 / 0.88), rgb(255 255 255 / 0.62)), var(--kn-bg-raised);
    padding: 14px;
  }

  :global(:root[data-theme='dark']) .settings-header {
    background:
      linear-gradient(180deg, rgb(28 39 36 / 0.92), rgb(20 29 27 / 0.78)), var(--kn-bg-raised);
  }

  .settings-title-row,
  .settings-title {
    display: flex;
    min-width: 0;
    align-items: center;
  }

  .settings-title-row {
    justify-content: space-between;
    gap: 10px;
  }

  .settings-title {
    gap: 10px;
  }

  .settings-title p {
    margin: 0;
    color: var(--kn-primary);
    font-size: 11px;
    font-weight: 800;
    line-height: 1.2;
  }

  .settings-title h1 {
    margin: 1px 0 0;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.2;
  }

  .icon-button,
  .trust-badge {
    display: grid;
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 8px;
  }

  .icon-button {
    border: 1px solid var(--kn-border);
    background: var(--kn-bg-raised);
    color: var(--kn-text-muted);
    transition:
      border-color 150ms ease,
      color 150ms ease,
      background 150ms ease;
  }

  .icon-button:hover {
    border-color: color-mix(in srgb, var(--kn-primary) 38%, var(--kn-border));
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .trust-badge {
    background: color-mix(in srgb, var(--kn-accent) 12%, transparent);
    color: var(--kn-accent);
  }

  .settings-body {
    min-height: 0;
    overflow-y: auto;
    padding: 14px;
  }

  .settings-panel.page .settings-body {
    padding: 18px;
  }

  .settings-section {
    border-bottom: 1px solid var(--kn-border);
    padding: 0 0 18px;
  }

  .settings-section + .settings-section {
    padding-top: 18px;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .section-icon {
    display: grid;
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 8px;
    background: var(--kn-primary-soft);
    color: var(--kn-primary);
  }

  .section-icon.accent {
    background: color-mix(in srgb, var(--kn-accent) 12%, transparent);
    color: var(--kn-accent);
  }

  .section-heading h2,
  .section-heading p {
    margin: 0;
  }

  .section-heading h2 {
    font-size: 15px;
    font-weight: 800;
    line-height: 1.25;
  }

  .section-heading p {
    margin-top: 2px;
    color: var(--kn-text-muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .field {
    display: block;
    margin-top: 12px;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 6px;
    color: var(--kn-text-muted);
    font-size: 12px;
    font-weight: 800;
  }

  .input-control {
    width: 100%;
    height: 42px;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-field-bg);
    color: var(--kn-text);
    padding: 0 12px;
    font-size: 13px;
    outline: none;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease,
      background 150ms ease;
  }

  .input-control:focus {
    border-color: color-mix(in srgb, var(--kn-primary) 52%, var(--kn-border));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--kn-primary) 14%, transparent);
  }

  .connection-row,
  .settings-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-top: 14px;
  }

  .settings-footer {
    justify-content: flex-end;
    padding-top: 16px;
  }

  .secondary-button,
  .primary-button {
    display: inline-flex;
    height: 38px;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 800;
    transition:
      transform 150ms ease,
      border-color 150ms ease,
      background 150ms ease,
      color 150ms ease;
  }

  .secondary-button {
    border: 1px solid var(--kn-border);
    background: var(--kn-bg-raised);
    color: var(--kn-text);
    padding: 0 12px;
  }

  .secondary-button:hover {
    border-color: color-mix(in srgb, var(--kn-primary) 38%, var(--kn-border));
    color: var(--kn-primary);
  }

  .primary-button {
    border: 0;
    background: linear-gradient(
      135deg,
      var(--kn-primary),
      color-mix(in srgb, var(--kn-primary) 72%, var(--kn-accent))
    );
    color: var(--kn-primary-ink);
    padding: 0 15px;
    box-shadow: 0 10px 22px color-mix(in srgb, var(--kn-primary) 24%, transparent);
  }

  .primary-button:hover {
    transform: translateY(-1px);
  }

  .secondary-button:disabled,
  .primary-button:disabled {
    cursor: not-allowed;
    opacity: 0.52;
    transform: none;
  }

  .connection-status,
  .saved-note {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 800;
  }

  .connection-status.ok,
  .saved-note {
    color: var(--kn-accent);
  }

  .connection-status.error {
    color: var(--kn-danger);
  }

  .segmented-control {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
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
    font-weight: 800;
    transition:
      background 150ms ease,
      color 150ms ease,
      box-shadow 150ms ease;
  }

  .segmented-control button.active {
    background: var(--kn-bg-raised);
    color: var(--kn-primary);
    box-shadow: 0 5px 14px rgb(21 39 37 / 0.08);
  }

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 14px;
    border: 1px solid var(--kn-border);
    border-radius: 8px;
    background: var(--kn-field-bg);
    padding: 11px 12px;
  }

  .toggle-row strong,
  .toggle-row small {
    display: block;
  }

  .toggle-row strong {
    font-size: 13px;
    line-height: 1.4;
  }

  .toggle-row small {
    margin-top: 2px;
    color: var(--kn-text-muted);
    font-size: 12px;
    line-height: 1.35;
  }

  .toggle-row input {
    width: 36px;
    height: 20px;
    flex: 0 0 auto;
    accent-color: var(--kn-primary);
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
