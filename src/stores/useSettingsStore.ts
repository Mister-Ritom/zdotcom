import { create } from "zustand";
import { storage } from "./storage";

export type AppTheme = "light" | "dark" | "system";

interface AppSettings {
  enablePushNotifications: boolean;
  autoplayVideos: boolean;
  theme: AppTheme;
  hasSeenOnboarding: boolean;
}

interface SettingsStore extends AppSettings {
  setTheme: (theme: AppTheme) => void;
  setAutoplayVideos: (value: boolean) => void;
  setPushNotifications: (value: boolean) => void;
  markOnboardingSeen: () => void;
}

const loadTheme = (): AppTheme => {
  const raw = storage.getString("settings.theme");
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
};

export const useSettingsStore = create<SettingsStore>()((set) => ({
  enablePushNotifications: storage.getBoolean("settings.push_enabled") ?? true,
  autoplayVideos: storage.getBoolean("settings.autoplay_videos") ?? true,
  theme: loadTheme(),
  hasSeenOnboarding:
    storage.getBoolean("settings.has_seen_onboarding") ?? false,

  setTheme: (theme) => {
    storage.set("settings.theme", theme);
    set({ theme });
  },
  setAutoplayVideos: (value) => {
    storage.set("settings.autoplay_videos", value);
    set({ autoplayVideos: value });
  },
  setPushNotifications: (value) => {
    storage.set("settings.push_enabled", value);
    set({ enablePushNotifications: value });
  },
  markOnboardingSeen: () => {
    storage.set("settings.has_seen_onboarding", true);
    set({ hasSeenOnboarding: true });
  },
}));
