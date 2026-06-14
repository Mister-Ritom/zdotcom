/**
 * Index — auth redirect guard.
 *
 * Immediately redirects to the correct route group based on auth state:
 *  - Not initialized yet → show nothing (splash screen is still up)
 *  - Authenticated       → /(tabs)
 *  - Not authenticated + has seen onboarding → /(auth)/login
 *  - Not authenticated + new user            → /(auth)/onboarding
 */

import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function Index() {
  const { user, isInitialized } = useAuthStore();
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);

  if (!isInitialized) {
    // Still loading — return null (splash screen is still showing)
    return null;
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  if (hasSeenOnboarding) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(auth)/onboarding" />;
}
