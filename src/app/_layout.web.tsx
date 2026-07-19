import UploadStatusBanner from "@/components/upload/UploadStatusBanner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
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
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import WebSidebar from "@/components/WebSidebar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GlobalOptionsSheet } from "@/components/GlobalOptionsSheet";
import { GlobalSendSheet } from "@/components/GlobalSendSheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ArrowLeft } from "lucide-react-native";

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

    const isPublicRoute =
      segments[0] === 'privacy' ||
      segments[0] === 'terms' ||
      segments[0] === 'shorts' ||
      segments[0] === 'zap';

    if (!user) {
      // Redirect to login if they are not in the auth group and not a public route
      if (!inAuthGroup && !isPublicRoute) {
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
        <Stack.Screen name="shorts/[id]" />
        <Stack.Screen name="zap/[id]" />
      </Stack>
    </>
  );
}

function WebLayoutContainer({ children }: { children: React.ReactNode }) {
  const { isDesktopWeb } = useBreakpoint();
  const segments = useSegments();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const inAuthGroup = segments[0] === "(auth)";

  // Hide the full sidebar on the messages / chat screens so the
  // split-view layout can use the full remaining width.
  const isMessagesRoute =
    segments.includes("messages") || segments.includes("chat");

  const showSidebar = isDesktopWeb && !inAuthGroup && !isMessagesRoute;
  const showBackArrow = isDesktopWeb && !inAuthGroup && isMessagesRoute;

  return (
    <View style={styles.webContainer}>
      {showSidebar && <WebSidebar />}

      {/* Slim back-arrow column shown instead of the sidebar on messages */}
      {showBackArrow && (
        <View
          style={[
            styles.backColumn,
            {
              borderRightColor: isDark ? "#27272A" : "#E4E4E7",
              backgroundColor: isDark ? "#09090B" : "#FFF",
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={22} color={isDark ? "#FFF" : "#18181B"} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.mainContent}>{children}</View>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    // Subscribe to Supabase auth state changes
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
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomLightTheme}
      >
        <BottomSheetModalProvider>
          <GlobalOptionsSheet>
            <GlobalSendSheet>
              <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
              <View style={styles.root}>
                <WebLayoutContainer>
                  <InitialLayout />
                </WebLayoutContainer>
                {/* Global upload progress banner — floats above all screens */}
                <UploadStatusBanner />
              </View>
            </GlobalSendSheet>
          </GlobalOptionsSheet>
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webContainer: {
    flex: 1,
    flexDirection: "row",
  },
  mainContent: {
    flex: 1,
    height: "100%",
  },
  backColumn: {
    width: 72,
    borderRightWidth: 1,
    alignItems: "center",
    paddingTop: 16,
  },
  backBtn: {
    padding: 10,
    borderRadius: 50,
  },
});
