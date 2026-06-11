import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true
      }
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget-entry.ts'),
      name: 'KnovanaChatWidget',
      fileName: 'knovana-chat-widget',
      formats: ['iife']
    },
    outDir: '../backend/public/widget',
    emptyOutDir: true,
    cssCodeSplit: false
  }
});
