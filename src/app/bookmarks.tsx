import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { zapService } from '@/services/zapService';
import { type ZapModel } from '@/types/models';
import { ZapCardContainer } from '@/components/feed/ZapCardContainer';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ACCENT = '#208AEF';

export default function BookmarksScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [zaps, setZaps] = useState<ZapModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    zapService.getBookmarkedZaps(user.id).then((list) => {
      setZaps(list);
      setLoading(false);
    });
  }, [user?.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Bookmarks</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={zaps}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ZapCardContainer zap={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bookmark size={48} color="#888" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#888', fontSize: 15, fontWeight: '600' }}>No bookmarks yet</Text>
              <Text style={{ color: '#555', fontSize: 13, marginTop: 4 }}>Save posts to view them here later</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  empty: { padding: 80, alignItems: 'center', justifyContent: 'center' },
});
