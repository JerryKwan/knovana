<script lang="ts">
  let { size = 36, label = "Knovana" } = $props<{
    size?: number;
    label?: string;
  }>();

  const iconUrl = `${import.meta.env.BASE_URL}favicon.svg`;
</script>

<span
  class="brand-mark"
  style={`--brand-mark-size: ${size}px`}
  aria-label={label}
  role="img"
>
  <img src={iconUrl} alt="" />
</span>

<style>
  .brand-mark {
    display: inline-flex;
    width: var(--brand-mark-size);
    height: var(--brand-mark-size);
    flex: 0 0 auto;
    filter: drop-shadow(0 7px 16px rgb(21 39 37 / 0.1));
  }

  .brand-mark img {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
