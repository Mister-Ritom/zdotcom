import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Monitor, Moon, Sun } from 'lucide-react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';

const ACCENT = '#208AEF';

export default function SettingsScreen() {
  const isDark = useColorScheme() === 'dark';
  const {
    enablePushNotifications,
    autoplayVideos,
    theme,
    setTheme,
    setAutoplayVideos,
    setPushNotifications,
  } = useSettingsStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Toggle Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={[styles.row, { borderBottomColor: isDark ? '#1C1917' : '#F5F5F4' }]}>
            <Text style={[styles.label, { color: isDark ? '#FFF' : '#000' }]}>Push Notifications</Text>
            <Switch
              value={enablePushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ true: ACCENT }}
            />
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: isDark ? '#FFF' : '#000' }]}>Autoplay Videos</Text>
            <Switch
              value={autoplayVideos}
              onValueChange={setAutoplayVideos}
              trackColor={{ true: ACCENT }}
            />
          </View>
        </View>

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme Mode</Text>
          <View style={styles.themeRow}>
            <TouchableOpacity
              onPress={() => setTheme('light')}
              style={[styles.themeBtn, theme === 'light' && styles.themeBtnActive, { backgroundColor: isDark ? '#1C1917' : '#F5F5F4' }]}
            >
              <Sun size={20} color={theme === 'light' ? ACCENT : '#888'} />
              <Text style={[styles.themeBtnText, { color: theme === 'light' ? ACCENT : '#888' }]}>Light</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTheme('dark')}
              style={[styles.themeBtn, theme === 'dark' && styles.themeBtnActive, { backgroundColor: isDark ? '#1C1917' : '#F5F5F4' }]}
            >
              <Moon size={20} color={theme === 'dark' ? ACCENT : '#888'} />
              <Text style={[styles.themeBtnText, { color: theme === 'dark' ? ACCENT : '#888' }]}>Dark</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTheme('system')}
              style={[styles.themeBtn, theme === 'system' && styles.themeBtnActive, { backgroundColor: isDark ? '#1C1917' : '#F5F5F4' }]}
            >
              <Monitor size={20} color={theme === 'system' ? ACCENT : '#888'} />
              <Text style={[styles.themeBtnText, { color: theme === 'system' ? ACCENT : '#888' }]}>System</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>Z App Version 1.0.0 (Expo Migration)</Text>
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
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, color: '#888', fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  label: { fontSize: 15, fontWeight: '600' },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', gap: 8 },
  themeBtnActive: { borderColor: ACCENT },
  themeBtnText: { fontSize: 13, fontWeight: '700' },
  footerText: { textAlign: 'center', color: '#888', fontSize: 12, marginTop: 40 },
});
