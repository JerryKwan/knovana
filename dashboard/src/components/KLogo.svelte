<script lang="ts">
  let {
    width = "128",
    height = "128",
    className = "",
    animated = false,
  } = $props<{
    width?: string | number;
    height?: string | number;
    className?: string;
    animated?: boolean;
  }>();
</script>

<svg
  class="k-logo {className} {animated ? 'pulse-anim' : ''}"
  {width}
  {height}
  viewBox="0 0 128 128"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <linearGradient id="stemGrad" x1="34" y1="25" x2="58" y2="103" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1E40AF" />
      <stop offset="1" stop-color="#1D3082" />
    </linearGradient>
    <linearGradient id="spineBevel" x1="34" y1="64" x2="43" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0F1F5C" stop-opacity="0.30" />
      <stop offset="0.42" stop-color="#142C82" stop-opacity="0.14" />
      <stop offset="1" stop-color="#142C82" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="spineInnerLight" x1="54" y1="64" x2="58" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0" />
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.13" />
    </linearGradient>
    <linearGradient id="faceTop" x1="58" y1="64" x2="102" y2="19" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1D4FD7" />
      <stop offset="0.6" stop-color="#2D6FE8" />
      <stop offset="1" stop-color="#5B9CF5" />
    </linearGradient>
    <linearGradient id="faceBot" x1="58" y1="65" x2="102" y2="109" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0C8B7F" />
      <stop offset="0.55" stop-color="#0E9B89" />
      <stop offset="1" stop-color="#0FB87E" />
    </linearGradient>
  </defs>
  <g>
    <rect x="34" y="26" width="24" height="76" rx="1.5" fill="url(#stemGrad)" />
    <rect x="34.5" y="27" width="8.5" height="74" rx="1.1" fill="url(#spineBevel)" />
    <rect x="53.5" y="27" width="4" height="74" rx="1.1" fill="url(#spineInnerLight)" />
    <polygon points="58,64 76,28 90,28 108,42 82,64" fill="url(#faceTop)" />
    <polygon points="60,60 76,30 88,30 76,48" fill="white" opacity="0.10" />
    <polygon points="58,65 82,65 108,86 90,100 76,100" fill="url(#faceBot)" />
    <polygon points="60,67 76,67 84,76 68,88" fill="white" opacity="0.08" />
    <line x1="58" y1="64.5" x2="82" y2="64.5" stroke="#0F2E5C" stroke-width="1" opacity="0.20" />
  </g>
</svg>

<style>
  .k-logo {
    display: block;
  }

  .pulse-anim {
    animation: kPulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes kPulse {
    0%, 100% {
      opacity: 0.8;
      transform: scale(0.98);
      filter: drop-shadow(0 4px 10px rgba(29, 48, 130, 0.15));
    }
    50% {
      opacity: 1;
      transform: scale(1.04);
      filter: drop-shadow(0 12px 24px rgba(29, 79, 215, 0.35))
              drop-shadow(0 8px 16px rgba(15, 184, 126, 0.25));
    }
  }
</style>
