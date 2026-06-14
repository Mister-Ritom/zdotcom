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
import { View, StyleSheet } from 'react-native';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore, configureGoogleSignIn } from '@/stores/useAuthStore';
import UploadStatusBanner from '@/components/upload/UploadStatusBanner';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <BottomSheetModalProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <View style={styles.root}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            {/* Global upload progress banner — floats above all screens */}
            <UploadStatusBanner />
          </View>
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

