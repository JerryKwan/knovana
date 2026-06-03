export type ThemePreference = 'system' | 'light' | 'dark';

export interface ExtensionSettings {
  backendUrl: string;
  token: string;
  theme: ThemePreference;
  autoOpenSidePanel: boolean;
}
