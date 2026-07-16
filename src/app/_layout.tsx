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

import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";

import UploadStatusBanner from "@/components/upload/UploadStatusBanner";
import { useAuthStore } from "@/stores/useAuthStore";
import * as WebBrowser from "expo-web-browser";
import { useSettingsStore } from "@/stores/useSettingsStore";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GlobalOptionsSheet } from "@/components/GlobalOptionsSheet";

// Keep the splash screen visible until auth resolves
SplashScreen.preventAutoHideAsync();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#09090B",
    card: "#09090B",
  },
};

const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#FFF",
    card: "#FFF",
  },
};

function AuthGuard() {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
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

  return null;
}

function InitialLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <AuthGuard />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === "dark" ? "#09090B" : "#FFF",
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();

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
      <ThemeProvider value={colorScheme === "dark" ? CustomDarkTheme : CustomLightTheme}>
        <BottomSheetModalProvider>
          <GlobalOptionsSheet>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <View style={styles.root}>
              <InitialLayout />
              {/* Global upload progress banner — floats above all screens */}
              <UploadStatusBanner />
            </View>
          </GlobalOptionsSheet>
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
