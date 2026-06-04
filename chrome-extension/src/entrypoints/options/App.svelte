<script lang="ts">
  import SettingsPanel from '../../components/settings/SettingsPanel.svelte';
</script>

<main class="options-page">
  <SettingsPanel variant="page" />
</main>

<style>
  .options-page {
    display: grid;
    min-height: 100vh;
    place-items: center;
    background:
      linear-gradient(180deg, rgb(248 251 250 / 0.92), rgb(238 246 244 / 0.94)), var(--kn-bg);
    padding: 24px;
  }

  :global(:root[data-theme='dark']) .options-page {
    background: linear-gradient(180deg, rgb(14 20 19 / 0.96), rgb(17 27 25 / 0.94)), var(--kn-bg);
  }

  :global(.settings-panel.page) {
    width: min(720px, 100%);
  }
</style>
