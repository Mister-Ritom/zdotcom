/**
 * Email verification screen.
 * Port of flutter/lib/auth_screens/verification_screen.dart
 *
 * Shown after sign-up when Supabase requires email confirmation.
 * Allows the user to:
 *  - "I've confirmed my email" → re-attempts sign-in with stored credentials
 *  - "Resend email" → triggers supabase.auth.resend()
 *  - "Back to Login" → clears pending state and navigates back
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MailCheck } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { AppLogger } from '@/utils/logger';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ACCENT = '#208AEF';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    pendingEmail,
    pendingPassword,
    signInWithEmail,
    resendEmailConfirmation,
    refreshSession,
    setPendingEmail,
    setPendingPassword,
  } = useAuthStore();

  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const displayEmail = pendingEmail ?? 'your email';

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      if (pendingEmail && pendingPassword) {
        await signInWithEmail(pendingEmail, pendingPassword);
        // On success, auth state change → root index redirects to /(tabs)
        setPendingEmail(null);
        setPendingPassword(null);
      } else {
        // Fallback: try to refresh the session (e.g. user clicked the link externally)
        await refreshSession();
        Alert.alert(
          'Not Verified Yet',
          'Your email has not been confirmed yet. Please check your inbox and click the verification link, then try again.',
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      AppLogger.error('VerifyEmailScreen', 'Verification check failed', { error: e });

      if (msg.toLowerCase().includes('email not confirmed')) {
        Alert.alert(
          'Not Verified Yet',
          "We couldn't sign you in. Please confirm your email first, then tap \"I've confirmed my email\".",
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) {
      Alert.alert('Error', 'No email address found. Please go back to sign up.');
      return;
    }
    setIsResending(true);
    try {
      await resendEmailConfirmation(pendingEmail);
      Alert.alert('Email Sent', 'A new confirmation email has been sent to ' + pendingEmail);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Failed to resend', msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    setPendingEmail(null);
    setPendingPassword(null);
    router.replace('/(auth)/login');
  };

  const c = isDark ? dark : light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bg }]}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MailCheck size={56} color="#fff" strokeWidth={1.5} />
        </View>

        <View style={styles.gap32} />

        {/* Heading */}
        <Text style={[styles.title, { color: c.text }]}>Verify your email</Text>

        <View style={styles.gap16} />

        <Text style={[styles.body, { color: c.textSecondary }]}>
          We've sent a confirmation email to:
        </Text>
        <Text style={[styles.emailDisplay, { color: c.text }]}>{displayEmail}</Text>

        <View style={styles.gap12} />

        <Text style={[styles.body, { color: c.textSecondary }]}>
          Please check your inbox and click the verification link to continue.
        </Text>

        <View style={styles.gap48} />

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.primaryButton, isChecking && styles.disabled]}
          onPress={handleCheckStatus}
          disabled={isChecking || isResending}
          activeOpacity={0.85}
        >
          {isChecking ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>I've confirmed my email</Text>
          )}
        </TouchableOpacity>

        <View style={styles.gap12} />

        {/* Resend */}
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: c.border }]}
          onPress={handleResend}
          disabled={isResending || isChecking}
          activeOpacity={0.7}
        >
          {isResending ? (
            <ActivityIndicator color={ACCENT} size="small" />
          ) : (
            <Text style={[styles.secondaryButtonText, { color: ACCENT }]}>Resend email</Text>
          )}
        </TouchableOpacity>

        <View style={styles.gap12} />

        {/* Back to login */}
        <TouchableOpacity onPress={handleBack} disabled={isChecking || isResending}>
          <Text style={[styles.backText, { color: c.textSecondary }]}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Themes ───────────────────────────────────────────────────────────────────
const light = { bg: '#fff', text: '#000', textSecondary: '#666', border: '#E0E0E6' };
const dark = { bg: '#000', text: '#fff', textSecondary: '#888', border: '#2C2C2E' };

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  body: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emailDisplay: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  gap12: { height: 12 },
  gap16: { height: 16 },
  gap32: { height: 32 },
  gap48: { height: 48 },
  primaryButton: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 15,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600' },
  backText: { fontSize: 14, fontWeight: '500', marginTop: 4 },
});
