/**
 * Auth store — Zustand global state for authentication.
 * Port of flutter/lib/providers/auth_provider.dart + auth_service.dart
 *
 * Google Sign-In:
 *   - Uses @react-native-google-signin/google-signin
 *   - Requires a native development build (NOT compatible with Expo Go)
 *
 * Google Client IDs (extracted from ios.plist / android.json / web_secret.json):
 *   iOS:     385298524193-89dvh6qif99gsopr625eapcp8audtrkc.apps.googleusercontent.com
 *   Android: 385298524193-c1srje861mofjtam1qaphjesd4nb1fqk.apps.googleusercontent.com
 *   Web:     385298524193-oq78aoojbm5tmai0vijgnget0iqj1jth.apps.googleusercontent.com
 */

import { supabase } from "@/services/supabase";
import { AppLogger } from "@/utils/logger";
import { type Session, type User } from "@supabase/supabase-js";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { create } from "zustand";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  /** Stored while waiting for email verification */
  pendingEmail: string | null;
  pendingPassword: string | null;
}

interface AuthActions {
  /** Subscribe to Supabase auth state. Call once in root layout. */
  initialize: () => () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (params: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    referralCode?: string;
  }) => Promise<{ needsVerification: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resendEmailConfirmation: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  setPendingEmail: (email: string | null) => void;
  setPendingPassword: (password: string | null) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
  // --- Initial state ---
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  pendingEmail: null,
  pendingPassword: null,

  // ── Initialize ────────────────────────────────────────────────────────────
  initialize: () => {
    // Seed initial session from SecureStore (Supabase auto-restores it)
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isInitialized: true });
      AppLogger.info("AuthStore", "Initial session loaded", {
        hasUser: !!session?.user,
      });
    });

    // Subscribe to all future auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, isInitialized: true });
      AppLogger.info("AuthStore", `Auth state changed: ${_event}`);
    });

    // Return unsubscribe function (call in useEffect cleanup)
    return () => subscription.unsubscribe();
  },

  // ── Email Sign-In ─────────────────────────────────────────────────────────
  signInWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      AppLogger.info("AuthStore", "Email sign in successful", {
        userId: data.user?.id,
      });
    } catch (e) {
      AppLogger.error("AuthStore", "Email sign in failed", { error: e });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Email Sign-Up ─────────────────────────────────────────────────────────
  signUpWithEmail: async ({
    email,
    password,
    username,
    displayName,
    referralCode,
  }) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
            username,
          },
        },
      });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("Sign up failed: no user returned");

      // Create profile row in `profiles` table
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        username,
        display_name: displayName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (profileError) {
        AppLogger.warn("AuthStore", "Profile creation failed", {
          error: profileError,
        });
      }

      // Record referral if provided
      if (referralCode) {
        try {
          const { data: referrerData } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", referralCode)
            .maybeSingle();

          if (referrerData?.id) {
            await supabase.from("referrals").insert({
              referrer_id: referrerData.id,
              referred_id: user.id,
              status: "joined",
            });
            AppLogger.info("AuthStore", "Referral recorded", {
              referralCode,
              userId: user.id,
            });
          }
        } catch (refErr) {
          AppLogger.error("AuthStore", "Failed to record referral", {
            error: refErr,
          });
        }
      }

      // session is null when email confirmation is required
      const needsVerification = !data.session;
      AppLogger.info("AuthStore", "Email sign up successful", {
        needsVerification,
      });
      return { needsVerification };
    } catch (e) {
      AppLogger.error("AuthStore", "Email sign up failed", { error: e });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Google Sign-In ────────────────────────────────────────────────────────
  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        path: "/auth/callback",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === "success") {
          const parsedUrl = Linking.parse(result.url);
          const code = parsedUrl.queryParams?.code;
          if (typeof code === 'string') {
            await supabase.auth.exchangeCodeForSession(code);
            AppLogger.info("AuthStore", "Google sign in successful");
          } else {
            throw new Error("No code found in redirect URL");
          }
        } else if (result.type === "cancel") {
          AppLogger.info("AuthStore", "Google sign in cancelled");
        } else {
          throw new Error("Google sign in failed or was dismissed");
        }
      }
    } catch (e) {
      AppLogger.error("AuthStore", "Google sign in failed", { error: e });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Sign Out ─────────────────────────────────────────────────────────────
  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      AppLogger.info("AuthStore", "Sign out successful");
    } catch (e) {
      AppLogger.error("AuthStore", "Sign out failed", { error: e });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Email Verification Helpers ────────────────────────────────────────────
  resendEmailConfirmation: async (email) => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw error;
  },

  refreshSession: async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
    } catch (e) {
      AppLogger.warn("AuthStore", "Session refresh failed", { error: e });
    }
  },

  // ── Pending auth state (used during email verification flow) ──────────────
  setPendingEmail: (email) => set({ pendingEmail: email }),
  setPendingPassword: (password) => set({ pendingPassword: password }),
}));
