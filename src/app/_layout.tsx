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

import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";

import UploadStatusBanner from "@/components/upload/UploadStatusBanner";
import { configureGoogleSignIn, useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Keep the splash screen visible until auth resolves
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { user, isInitialized } = useAuthStore();
  const hasSeenOnboarding = useSettingsStore((s) => s.hasSeenOnboarding);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = (segments[0] as string) === "(auth)";

    if (!user) {
      // Redirect to login if they are not in the auth group
      if (!inAuthGroup) {
        if (hasSeenOnboarding) {
          router.replace("/(auth)/login");
        } else {
          router.replace("/(auth)/onboarding");
        }
      }
    } else {
      // Redirect to tabs if they are in the auth group or at root
      const atRoot = !segments[0] || (segments[0] as string) === "index";
      if (inAuthGroup || atRoot) {
        router.replace("/(tabs)");
      }
    }
  }, [user, isInitialized, segments, hasSeenOnboarding, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

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
    if (isInitialized && Platform.OS !== "web") {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <BottomSheetModalProvider>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          <View style={styles.root}>
            <InitialLayout />
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
