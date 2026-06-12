export interface User {
  id: string;
  username: string;
  password_hash: string;
  kb_path: string;
  settings: string; // JSON string
  created_at: string;
  status: "active" | "inactive";
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  prefix: string;
  key_value?: string | null;
  created_at: string;
  last_used_at?: string | null;
}

export interface UserSettings {
  default_category: string;
  default_language: string;
  auto_tag: boolean;
  theme: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  default_category: "inbox",
  default_language: "zh-CN",
  auto_tag: true,
  theme: "system",
};
