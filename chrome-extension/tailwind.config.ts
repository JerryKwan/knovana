import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts,svelte}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Aptos"', '"Segoe UI"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 22px 58px rgb(21 39 37 / 0.16)',
        soft: '0 10px 24px rgb(21 39 37 / 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
