import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,ts,svelte}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Aptos"', '"Segoe UI"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 16px 40px rgb(15 23 42 / 0.14)',
        soft: '0 8px 24px rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
