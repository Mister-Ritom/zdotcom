import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { zapService } from '@/services/zapService';
import { type ZapModel } from '@/types/models';
import { ZapCardContainer } from '@/components/feed/ZapCardContainer';
import { ExploreGridItem } from '@/components/feed/ExploreGridItem';
import { DesktopLayout } from '@/components/DesktopLayout';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ACCENT = '#208AEF';
const COL_GAP = 3;

export default function BookmarksScreen() {
  const isDark = useColorScheme() === 'dark';
  const { isDesktopWeb } = useBreakpoint();
  const { user } = useAuthStore();

  const [zaps, setZaps] = useState<ZapModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    zapService.getBookmarkedZaps(user.id).then((list) => {
      setZaps(list);
      setLoading(false);
    });
  }, [user?.id]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const numColumns = isDesktopWeb ? 3 : 1;
  const itemWidth = containerWidth > 0 && numColumns > 1
    ? (containerWidth - COL_GAP * (numColumns + 1)) / numColumns
    : containerWidth;

  const renderItem = useCallback(({ item }: { item: ZapModel; index: number }) => {
    if (isDesktopWeb && numColumns > 1) {
      if (itemWidth === 0) return null;
      return <ExploreGridItem item={item} itemWidth={itemWidth} colGap={COL_GAP} />;
    }
    return <ZapCardContainer zap={item} />;
  }, [isDesktopWeb, numColumns, itemWidth]);

  return (
    <DesktopLayout>
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]} edges={['top']}>
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
          <View style={{ flex: 1 }} onLayout={onLayout}>
            <FlatList
              data={zaps}
              key={isDesktopWeb ? 'grid-3' : 'list-1'}
              numColumns={numColumns}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Bookmark size={48} color="#888" style={{ marginBottom: 12 }} />
                  <Text style={{ color: '#888', fontSize: 15, fontWeight: '600' }}>No bookmarks yet</Text>
                  <Text style={{ color: '#555', fontSize: 13, marginTop: 4 }}>Save posts to view them here later</Text>
                </View>
              }
            />
          </View>
        )}
      </SafeAreaView>
    </DesktopLayout>
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
