import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';

export function FeedSkeleton() {
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#27272A' : '#E4E4E7';
  const cardBg = isDark ? '#18181B' : '#FFFFFF';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: isDark ? '#27272A' : '#E4E4E7' }]}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: bg }]} />
        <View style={styles.headerLines}>
          <View style={[styles.line, { width: 120, backgroundColor: bg }]} />
          <View style={[styles.line, { width: 80, marginTop: 6, backgroundColor: bg }]} />
        </View>
      </View>
      {/* Media skeleton */}
      <View style={[styles.media, { backgroundColor: bg }]} />
      {/* Actions skeleton */}
      <View style={styles.actions}>
        {[80, 60, 60].map((w, i) => (
          <View key={i} style={[styles.actionPill, { width: w, backgroundColor: bg }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  headerLines: { flex: 1, gap: 6 },
  line: { height: 12, borderRadius: 6 },
  media: { marginHorizontal: 14, marginBottom: 14, height: 200, borderRadius: 12 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 16 },
  actionPill: { height: 32, borderRadius: 12 },
});
