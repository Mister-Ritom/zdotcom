/**
 * Sign-up screen.
 * Port of flutter/lib/auth_screens/signup_screen.dart
 *
 * Fields: Display Name, Username (@), Email, Password
 * - Validates username format (^[a-zA-Z0-9_]{1,15}$)
 * - Reads referral code from URL search params (?ref=) or MMKV storage
 * - On success → /verify-email (if email confirmation required)
 */

import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/services/supabase";
import { storage } from "@/stores/storage";
import { useAuthStore } from "@/stores/useAuthStore";
import { AppLogger } from "@/utils/logger";
import { useRouter } from "expo-router";
import { AtSign, Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#208AEF";
const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,15}$/;

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    signUpWithEmail,
    signInWithGoogle,
    setPendingEmail,
    setPendingPassword,
    isLoading,
  } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [obscurePassword, setObscurePassword] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);

  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const loading = isLoading || localLoading;

  const validateForm = (): string | null => {
    if (!displayName.trim()) return "Display name is required";
    if (!username.trim()) return "Username is required";
    if (!USERNAME_REGEX.test(username.trim()))
      return "Username must be 1–15 characters (letters, numbers, underscores only)";
    if (!email.trim()) return "Email is required";
    if (!email.includes("@")) return "Please enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSignUp = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert("Validation Error", validationError);
      return;
    }

    setLocalLoading(true);
    try {
      // Check username availability before submitting
      const { data: existing } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        Alert.alert(
          "Username Taken",
          "This username is already in use. Please choose another.",
        );
        return;
      }

      // Read referral code from MMKV (set on deep-link)
      const referralCode = storage.getString("referral_code") ?? undefined;

      const { needsVerification } = await signUpWithEmail({
        email: email.trim(),
        password: password.trim(),
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        referralCode,
      });

      AppLogger.info("SignUpScreen", "Sign up successful", {
        needsVerification,
      });

      if (needsVerification) {
        setPendingEmail(email.trim());
        setPendingPassword(password.trim());
        router.replace("/(auth)/verify-email");
      }
      // If no verification needed, auth state change drives the redirect automatically
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      AppLogger.error("SignUpScreen", "Sign up failed", { error: e });
      Alert.alert("Sign Up Failed", msg);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalLoading(true);
    try {
      await signInWithGoogle();
      AppLogger.info("SignUpScreen", "Google sign up successful");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      AppLogger.error("SignUpScreen", "Google sign up failed", { error: e });
      Alert.alert("Google Sign In Failed", msg);
    } finally {
      setLocalLoading(false);
    }
  };

  const c = isDark ? dark : light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>Z</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: c.text }]}>
            Create your account
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Join the community today
          </Text>

          <View style={styles.gap32} />

          {/* Display Name */}
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: c.inputBg, borderColor: c.border },
            ]}
          >
            <User size={18} color={c.icon} strokeWidth={2} />
            <TextInput
              style={[styles.input, { color: c.text }]}
              placeholder="Display Name"
              placeholderTextColor={c.placeholder}
              autoCapitalize="words"
              returnKeyType="next"
              value={displayName}
              onChangeText={setDisplayName}
              onSubmitEditing={() => usernameRef.current?.focus()}
              editable={!loading}
            />
          </View>

          <View style={styles.gap12} />

          {/* Username */}
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: c.inputBg, borderColor: c.border },
            ]}
          >
            <AtSign size={18} color={c.icon} strokeWidth={2} />
            <TextInput
              ref={usernameRef}
              style={[styles.input, { color: c.text }]}
              placeholder="username"
              placeholderTextColor={c.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase())}
              onSubmitEditing={() => emailRef.current?.focus()}
              editable={!loading}
            />
          </View>

          <View style={styles.gap12} />

          {/* Email */}
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: c.inputBg, borderColor: c.border },
            ]}
          >
            <Mail size={18} color={c.icon} strokeWidth={2} />
            <TextInput
              ref={emailRef}
              style={[styles.input, { color: c.text }]}
              placeholder="Email"
              placeholderTextColor={c.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
            />
          </View>

          <View style={styles.gap12} />

          {/* Password */}
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: c.inputBg, borderColor: c.border },
            ]}
          >
            <Lock size={18} color={c.icon} strokeWidth={2} />
            <TextInput
              ref={passwordRef}
              style={[styles.input, { color: c.text }]}
              placeholder="Password"
              placeholderTextColor={c.placeholder}
              secureTextEntry={obscurePassword}
              autoComplete="new-password"
              returnKeyType="done"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSignUp}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setObscurePassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {obscurePassword ? (
                <Eye size={18} color={c.icon} strokeWidth={2} />
              ) : (
                <EyeOff size={18} color={c.icon} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.gap24} />

          {/* Sign Up button */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              loading && styles.primaryButtonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Legal */}
          <View style={styles.gap12} />
          <Text style={[styles.legalText, { color: c.textSecondary }]}>
            By signing up, you accept the{" "}
            <Text style={styles.legalLink}>Privacy Policy</Text> and{" "}
            <Text style={styles.legalLink}>Terms & Conditions</Text>.
          </Text>

          <View style={styles.gap16} />

          {/* OR divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
            <Text style={[styles.dividerText, { color: c.textSecondary }]}>
              OR
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          </View>

          <View style={styles.gap16} />

          {/* Google */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              { borderColor: c.border, backgroundColor: c.inputBg },
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={[styles.googleButtonText, { color: c.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <View style={styles.gap24} />

          {/* Sign-in link */}
          <View style={styles.linkRow}>
            <Text style={[styles.linkText, { color: c.textSecondary }]}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.linkAction}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Themes ───────────────────────────────────────────────────────────────────
const light = {
  bg: "#fff",
  text: "#000",
  textSecondary: "#666",
  inputBg: "#F4F4F6",
  border: "#E0E0E6",
  icon: "#888",
  placeholder: "#aaa",
};
const dark = {
  bg: "#000",
  text: "#fff",
  textSecondary: "#888",
  inputBg: "#1A1A1C",
  border: "#2C2C2E",
  icon: "#666",
  placeholder: "#555",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    justifyContent: "center",
  },
  logoContainer: { alignItems: "center", marginBottom: 24 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoLetter: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, textAlign: "center", marginTop: 6 },
  gap12: { height: 12 },
  gap16: { height: 16 },
  gap24: { height: 24 },
  gap32: { height: 32 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  primaryButton: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  legalText: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  legalLink: { color: ACCENT, fontWeight: "500" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: "500" },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 15,
    gap: 10,
  },
  googleG: { fontSize: 17, fontWeight: "800", color: ACCENT },
  googleButtonText: { fontSize: 15, fontWeight: "600" },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: { fontSize: 14 },
  linkAction: { fontSize: 14, fontWeight: "700", color: ACCENT },
});
