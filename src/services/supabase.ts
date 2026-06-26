/**
 * Supabase client singleton.
 * Port of flutter/lib/supabase/database.dart
 *
 * Uses expo-secure-store as the session storage adapter so that
 * auth tokens are stored in the device's secure enclave / keystore
 * rather than plain AsyncStorage.
 */

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SUPABASE_URL = "https://acrjeiyscacdtyxxsxid.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcmplaXlzY2FjZHR5eHhzeGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjg0MzMsImV4cCI6MjA4NTc0NDQzM30.mCnA44xS3a1zLFjYYbbMBwdMVCLQYZ7yMPiWsfJeCms";

/**
 * expo-secure-store adapter for Supabase session persistence.
 * Web falls back to localStorage (SecureStore is native-only).
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string): string | null | Promise<string | null> => {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): void | Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): void | Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return;
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
