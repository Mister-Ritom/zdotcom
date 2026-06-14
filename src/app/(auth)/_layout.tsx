/**
 * Auth group layout.
 * Wraps all (auth) screens in a Stack navigator.
 * Screens in this group are only reachable when the user is unauthenticated.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen
        name="verify-email"
        options={{
          // Allow back gesture from verify-email → login
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
