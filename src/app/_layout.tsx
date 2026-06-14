/**
 * Root layout — auth guard + theme provider + splash screen management.
 * Port of flutter/lib/main.dart (MyApp widget)
 *
 * Responsibilities:
 *  1. Initialize auth store on mount (subscribes to Supabase auth state)
 *  2. Configure Google Sign-In
 *  3. Manage SplashScreen visibility until auth state resolves
 *  4. Route guard: redirect unauthenticated → (auth), authenticated → (tabs)
 */

import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore, configureGoogleSignIn } from '@/stores/useAuthStore';

// Keep the splash screen visible until auth resolves
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    // Configure Google Sign-In (safe to call even in Expo Go — just won't work at runtime)
    configureGoogleSignIn();

    // Subscribe to Supabase auth state changes; returns unsubscribe fn
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
