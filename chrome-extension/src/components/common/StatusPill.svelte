<script lang="ts">
  export let tone: 'neutral' | 'accent' | 'warning' | 'danger' = 'neutral';
</script>

<span class={`pill ${tone}`}>
  <slot />
</span>

<style>
  .pill {
    display: inline-flex;
    min-height: 22px;
    align-items: center;
    border-radius: 999px;
    border: 1px solid var(--kn-border);
    padding: 0 8px;
    color: var(--kn-text-muted);
    font-size: 11px;
    font-weight: 650;
    white-space: nowrap;
  }

  .accent {
    border-color: color-mix(in srgb, var(--kn-accent) 34%, transparent);
    background: color-mix(in srgb, var(--kn-accent) 12%, transparent);
    color: var(--kn-accent);
  }

  .warning {
    border-color: color-mix(in srgb, var(--kn-warning) 34%, transparent);
    background: color-mix(in srgb, var(--kn-warning) 12%, transparent);
    color: var(--kn-warning);
  }

  .danger {
    border-color: color-mix(in srgb, var(--kn-danger) 34%, transparent);
    background: color-mix(in srgb, var(--kn-danger) 12%, transparent);
    color: var(--kn-danger);
  }
</style>
