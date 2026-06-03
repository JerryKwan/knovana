import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Knovana',
    short_name: 'Knovana',
    description: 'Capture, organize, and query knowledge from the browser.',
    version: '0.1.0',
    action: {
      default_title: 'Open Knovana',
    },
    permissions: ['sidePanel', 'contextMenus', 'activeTab', 'scripting', 'storage', 'tabs'],
    host_permissions: ['http://localhost:*/*', 'http://127.0.0.1:*/*', 'https://api.knovana.com/*'],
    side_panel: {
      default_path: 'sidepanel.html',
    },
    commands: {
      'toggle-sidepanel': {
        suggested_key: {
          default: 'Alt+Q',
        },
        description: 'Open Knovana side panel',
      },
      'quick-capture': {
        suggested_key: {
          default: 'Ctrl+Shift+S',
        },
        description: 'Save the current selection to Knovana',
      },
    },
  },
});
