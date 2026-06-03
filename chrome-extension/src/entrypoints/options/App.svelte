<script lang="ts">
  import { Check, KeyRound, Link2, Palette, Server, ShieldCheck } from '@lucide/svelte';
  import { getSettings, normalizeBackendUrl, saveSettings } from '../../services/storage';
  import { applyThemePreference } from '../../services/theme';
  import type { ExtensionSettings, ThemePreference } from '../../types/settings';

  let settings: ExtensionSettings = {
    backendUrl: 'http://localhost:8000/api',
    token: '',
    theme: 'system',
    autoOpenSidePanel: true,
  };
  let saved = false;
  let checking = false;
  let checkMessage = '';
  let checkTone: 'neutral' | 'ok' | 'error' = 'neutral';

  const themes: Array<{ value: ThemePreference; label: string }> = [
    { value: 'system', label: '跟随系统' },
    { value: 'light', label: '浅色' },
    { value: 'dark', label: '深色' },
  ];

  void load();

  async function load() {
    settings = await getSettings();
    applyThemePreference(settings.theme);
  }

  async function save() {
    await saveSettings({
      ...settings,
      backendUrl: normalizeBackendUrl(settings.backendUrl),
    });
    applyThemePreference(settings.theme);
    saved = true;
    setTimeout(() => {
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

  $: applyThemePreference(settings.theme);
</script>

<main class="min-h-screen bg-[color:var(--kn-bg)] px-5 py-6 text-[color:var(--kn-text)]">
  <div class="mx-auto max-w-3xl">
    <header class="mb-6 flex items-center justify-between gap-4">
      <div>
        <p class="text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--kn-primary)]">
          Knovana
        </p>
        <h1 class="mt-1 text-[28px] font-bold tracking-normal">扩展设置</h1>
      </div>
      <div
        class="grid h-12 w-12 place-items-center rounded-[8px] bg-[color:var(--kn-primary)] text-[color:var(--kn-primary-ink)] shadow-soft"
      >
        <ShieldCheck size={22} />
      </div>
    </header>

    <form class="space-y-4" onsubmit={(event) => event.preventDefault()}>
      <section
        class="rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] p-4 shadow-soft"
      >
        <div class="mb-4 flex items-start gap-3">
          <div
            class="grid h-9 w-9 place-items-center rounded-[8px] bg-[color:var(--kn-primary-soft)] text-[color:var(--kn-primary)]"
          >
            <Server size={17} />
          </div>
          <div>
            <h2 class="text-[16px] font-bold tracking-normal">后端连接</h2>
            <p class="mt-1 text-[13px] leading-5 text-[color:var(--kn-text-muted)]">
              默认使用本地 Knovana API，生产环境可切换到正式 API 地址。
            </p>
          </div>
        </div>

        <label class="mb-3 block">
          <span
            class="mb-1.5 flex items-center gap-2 text-[12px] font-bold text-[color:var(--kn-text-muted)]"
          >
            <Link2 size={14} />
            Backend URL
          </span>
          <input
            bind:value={settings.backendUrl}
            class="h-11 w-full rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg)] px-3 text-[13px] outline-none"
            placeholder="http://localhost:8000/api"
          />
        </label>

        <label class="block">
          <span
            class="mb-1.5 flex items-center gap-2 text-[12px] font-bold text-[color:var(--kn-text-muted)]"
          >
            <KeyRound size={14} />
            Access Token
          </span>
          <input
            bind:value={settings.token}
            type="password"
            class="h-11 w-full rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg)] px-3 text-[13px] outline-none"
            placeholder="Bearer token"
          />
        </label>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[color:var(--kn-border)] px-3 text-[13px] font-bold text-[color:var(--kn-text)] transition hover:border-[color:var(--kn-primary)] hover:text-[color:var(--kn-primary)] disabled:opacity-50"
            disabled={checking}
            onclick={testConnection}
          >
            <Server size={15} />
            {checking ? '检测中' : '测试连接'}
          </button>
          {#if checkMessage}
            <span
              class={`text-[12px] font-bold ${checkTone === 'ok' ? 'text-[color:var(--kn-accent)]' : 'text-[color:var(--kn-danger)]'}`}
            >
              {checkMessage}
            </span>
          {/if}
        </div>
      </section>

      <section
        class="rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg-raised)] p-4 shadow-soft"
      >
        <div class="mb-4 flex items-center gap-3">
          <div
            class="grid h-9 w-9 place-items-center rounded-[8px] bg-[color:var(--kn-bg-subtle)] text-[color:var(--kn-accent)]"
          >
            <Palette size={17} />
          </div>
          <h2 class="text-[16px] font-bold tracking-normal">界面偏好</h2>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <label>
            <span class="mb-1.5 block text-[12px] font-bold text-[color:var(--kn-text-muted)]"
              >主题</span
            >
            <select
              bind:value={settings.theme}
              class="h-11 w-full rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg)] px-3 text-[13px] outline-none"
            >
              {#each themes as theme (theme.value)}
                <option value={theme.value}>{theme.label}</option>
              {/each}
            </select>
          </label>

          <label
            class="flex items-center justify-between gap-3 rounded-[8px] border border-[color:var(--kn-border)] bg-[color:var(--kn-bg)] px-3 py-2"
          >
            <span>
              <span class="block text-[13px] font-bold">右键动作后打开侧栏</span>
              <span class="text-[12px] text-[color:var(--kn-text-muted)]"
                >保存、摘要和生成文档时自动展开</span
              >
            </span>
            <input
              bind:checked={settings.autoOpenSidePanel}
              type="checkbox"
              class="h-5 w-5 accent-[color:var(--kn-primary)]"
            />
          </label>
        </div>
      </section>

      <div class="flex items-center justify-end gap-3">
        {#if saved}
          <span
            class="inline-flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--kn-accent)]"
          >
            <Check size={14} />
            已保存
          </span>
        {/if}
        <button
          type="button"
          class="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[color:var(--kn-primary)] px-5 text-[13px] font-bold text-[color:var(--kn-primary-ink)] shadow-soft transition hover:brightness-105"
          onclick={save}
        >
          <Check size={16} />
          保存设置
        </button>
      </div>
    </form>
  </div>
</main>
