import type { ThemePreference } from '../types/settings';

export function applyThemePreference(theme: ThemePreference): void {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
    return;
  }

  document.documentElement.dataset.theme = theme;
}
