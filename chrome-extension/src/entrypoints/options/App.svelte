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
      linear-gradient(180deg, rgb(250 248 244 / 0.96), rgb(245 242 236 / 0.96)), var(--kn-bg);
    padding: 24px;
  }

  :global(:root[data-theme='dark']) .options-page {
    background: linear-gradient(180deg, rgb(20 18 15 / 0.96), rgb(32 28 24 / 0.94)), var(--kn-bg);
  }

  :global(.settings-panel.page) {
    width: min(720px, 100%);
  }
</style>
