import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { userService } from '@/services/userService';
import { type MessagePreference } from '@/types/models';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ACCENT = '#208AEF';

export default function PrivacySettingsScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user: currentUser, setUser } = useAuthStore();
  const currentMsgPref = currentUser?.messagePreference || 'mutual';

  const handleMsgPrefChange = async (pref: MessagePreference) => {
    if (!currentUser) return;
    try {
      await userService.updateProfile(currentUser.id, { messagePreference: pref });
      setUser({ ...currentUser, messagePreference: pref });
    } catch (e) {
      console.error('Failed to update message preference', e);
    }
  };

  const privacyOptions: { label: string; value: MessagePreference }[] = [
    { label: 'Everyone', value: 'everyone' },
    { label: 'Followers (Anyone who follows you)', value: 'follower' },
    { label: 'Followings (Anyone you follow)', value: 'following' },
    { label: 'Mutuals (You both follow each other)', value: 'mutual' },
    { label: 'No One', value: 'none' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Messaging Privacy</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.description, { color: isDark ? '#A1A1AA' : '#52525B' }]}>
          Choose who can send you direct messages.
        </Text>
        
        <View style={[styles.optionsContainer, { backgroundColor: isDark ? '#1C1917' : '#F5F5F4' }]}>
          {privacyOptions.map((opt, index) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handleMsgPrefChange(opt.value)}
              style={[
                styles.optionRow,
                index !== privacyOptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#27272A' : '#E5E5E5' }
              ]}
            >
              <Text style={[styles.optionLabel, { color: isDark ? '#FFF' : '#000' }]}>{opt.label}</Text>
              {currentMsgPref === opt.value && <Check size={18} color={ACCENT} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { padding: 16 },
  description: { fontSize: 14, marginBottom: 20 },
  optionsContainer: { borderRadius: 12, overflow: 'hidden' },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  optionLabel: { fontSize: 15 },
});
