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
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'Open Knovana',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
      },
    },
    permissions: ['sidePanel', 'contextMenus', 'activeTab', 'scripting', 'storage', 'tabs'],
    host_permissions: ['*://*/*'],
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
