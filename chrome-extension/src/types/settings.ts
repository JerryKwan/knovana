export type ThemePreference = 'system' | 'light' | 'dark';
export type ExtensionSurface = 'sidepanel' | 'popout';

export interface ExtensionSettings {
  backendUrl: string;
  token: string;
  theme: ThemePreference;
  autoOpenSidePanel: boolean;
  preferredOpenSurface: ExtensionSurface;
}
