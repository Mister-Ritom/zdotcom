/**
 * Login screen.
 * Port of flutter/lib/auth_screens/login_screen.dart
 *
 * Handles:
 *  - Email + password sign-in
 *  - Google Sign-In (requires native build)
 *  - "Email not confirmed" → redirects to /verify-email
 *  - Privacy Policy / Terms links
 */

import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { AppLogger } from '@/utils/logger';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCleanErrorMessage } from '@/utils/errors';

const ACCENT = '#208AEF';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { signInWithEmail, signInWithGoogle, setPendingEmail, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const loading = isLoading || localLoading;

  const validateForm = (): string | null => {
    if (!email.trim()) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email';
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleEmailSignIn = async () => {
    const err = validateForm();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    setLocalLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      AppLogger.info('LoginScreen', 'Email sign in successful');
      // Auth state change in useAuthStore will trigger root index redirect → /(tabs)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('email not confirmed')) {
        setPendingEmail(email.trim());
        router.push('/(auth)/verify-email');
        return;
      }
      AppLogger.error('LoginScreen', 'Email sign in failed', { error: e });
      Alert.alert('Sign In Failed', getCleanErrorMessage(e));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalLoading(true);
    try {
      await signInWithGoogle();
      AppLogger.info('LoginScreen', 'Google sign in successful');
    } catch (e: unknown) {
      AppLogger.error('LoginScreen', 'Google sign in failed', { error: e });
      Alert.alert('Google Sign In Failed', getCleanErrorMessage(e));
    } finally {
      setLocalLoading(false);
    }
  };

  const c = isDark ? dark : light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

          {/* Title */}
          <Text style={[styles.title, { color: c.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Sign in to continue
          </Text>

          <View style={styles.gap32} />

          {/* Email field */}
          <View style={[styles.inputWrapper, { backgroundColor: c.inputBg, borderColor: c.border }]}>
            <Mail size={18} color={c.icon} strokeWidth={2} />
            <TextInput
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

          {/* Password field */}
          <View style={[styles.inputWrapper, { backgroundColor: c.inputBg, borderColor: c.border }]}>
            <Lock size={18} color={c.icon} strokeWidth={2} />
            <TextInput
              ref={passwordRef}
              style={[styles.input, { color: c.text }]}
              placeholder="Password"
              placeholderTextColor={c.placeholder}
              secureTextEntry={obscurePassword}
              autoComplete="password"
              returnKeyType="done"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleEmailSignIn}
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

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleEmailSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Legal text */}
          <View style={styles.gap12} />
          <Text style={[styles.legalText, { color: c.textSecondary }]}>
            By signing in, you accept the{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/(tabs)/privacy' as never)}>
              Privacy Policy
            </Text>
            {' '}and{' '}
            <Text style={styles.legalLink} onPress={() => router.push('/(tabs)/terms' as never)}>
              Terms & Conditions
            </Text>
            .
          </Text>

          <View style={styles.gap16} />

          {/* OR divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
            <Text style={[styles.dividerText, { color: c.textSecondary }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          </View>

          <View style={styles.gap16} />

          {/* Google Sign-In */}
          <TouchableOpacity
            style={[styles.googleButton, { borderColor: c.border, backgroundColor: c.inputBg }]}
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

          {/* Sign-up link */}
          <View style={styles.linkRow}>
            <Text style={[styles.linkText, { color: c.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.linkAction}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Themes ───────────────────────────────────────────────────────────────────
const light = {
  bg: '#fff',
  text: '#000',
  textSecondary: '#666',
  inputBg: '#F4F4F6',
  border: '#E0E0E6',
  icon: '#888',
  placeholder: '#aaa',
};
const dark = {
  bg: '#000',
  text: '#fff',
  textSecondary: '#888',
  inputBg: '#1A1A1C',
  border: '#2C2C2E',
  icon: '#666',
  placeholder: '#555',
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
    justifyContent: 'center',
  },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoLetter: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 6 },
  gap12: { height: 12 },
  gap16: { height: 16 },
  gap24: { height: 24 },
  gap32: { height: 32 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  legalText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  legalLink: { color: ACCENT, fontWeight: '500' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '500' },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 15,
    gap: 10,
  },
  googleG: {
    fontSize: 17,
    fontWeight: '800',
    color: ACCENT,
  },
  googleButtonText: { fontSize: 15, fontWeight: '600' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  linkText: { fontSize: 14 },
  linkAction: { fontSize: 14, fontWeight: '700', color: ACCENT },
});
