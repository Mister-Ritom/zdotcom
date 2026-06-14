/**
 * Settings store — persisted via react-native-mmkv.
 * Port of flutter/lib/providers/settings_provider.dart
 *
 * Replaces SharedPreferences with MMKV (synchronous, high-performance).
 * Keys are identical to the Flutter app so existing device data is NOT migrated
 * (MMKV and SharedPreferences use separate storage).
 */

import { create } from 'zustand';
import { createMMKV, type MMKV } from 'react-native-mmkv';

// Shared MMKV instance — one instance per app is the recommended pattern
export const mmkv: MMKV = createMMKV({ id: 'z-settings' });

export type AppTheme = 'light' | 'dark' | 'system';

interface AppSettings {
  enablePushNotifications: boolean;
  autoplayVideos: boolean;
  theme: AppTheme;
  hasSeenOnboarding: boolean;
}

interface SettingsStore extends AppSettings {
  // Actions
  setTheme: (theme: AppTheme) => void;
  setAutoplayVideos: (value: boolean) => void;
  setPushNotifications: (value: boolean) => void;
  markOnboardingSeen: () => void;
}

const loadTheme = (): AppTheme => {
  const raw = mmkv.getString('settings.theme');
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
};

export const useSettingsStore = create<SettingsStore>()((set) => ({
  // --- Initial state read synchronously from MMKV ---
  enablePushNotifications: mmkv.getBoolean('settings.push_enabled') ?? true,
  autoplayVideos: mmkv.getBoolean('settings.autoplay_videos') ?? true,
  theme: loadTheme(),
  hasSeenOnboarding: mmkv.getBoolean('settings.has_seen_onboarding') ?? false,

  // --- Actions ---
  setTheme: (theme) => {
    mmkv.set('settings.theme', theme);
    set({ theme });
  },

  setAutoplayVideos: (value) => {
    mmkv.set('settings.autoplay_videos', value);
    set({ autoplayVideos: value });
  },

  setPushNotifications: (value) => {
    mmkv.set('settings.push_enabled', value);
    set({ enablePushNotifications: value });
  },

  markOnboardingSeen: () => {
    mmkv.set('settings.has_seen_onboarding', true);
    set({ hasSeenOnboarding: true });
  },
}));
