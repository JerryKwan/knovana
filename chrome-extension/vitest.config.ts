import { svelte } from '@sveltejs/vite-plugin-svelte';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@lucide/svelte': resolve(rootDir, 'src/test/lucide-svelte.ts'),
    },
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
