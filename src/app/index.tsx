import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function Index() {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const isDark = useColorScheme() === 'dark';

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? '#09090B' : '#FFF',
        }}
      >
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href={hasSeenOnboarding ? "/(auth)/login" : "/(auth)/onboarding"} />;
  }

  return <Redirect href="/(tabs)" />;
}
