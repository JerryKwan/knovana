import '@testing-library/svelte/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach, vi } from 'vitest';

// Global mock for chrome extension API to prevent ReferenceErrors in test environments
Object.defineProperty(globalThis, 'chrome', {
  value: {
    storage: {
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => {}),
      },
    },
  },
  writable: true,
  configurable: true,
});

afterEach(() => {
  cleanup();
});
