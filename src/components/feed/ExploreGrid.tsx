import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { zapService } from '@/services/zapService';
import { type ZapModel } from '@/types/models';
import { ExploreGridItem } from './ExploreGridItem';
import { useColorScheme } from '@/hooks/use-color-scheme';

const PAGE_SIZE = 20;

export function ExploreGrid() {
  const isDark = useColorScheme() === 'dark';
  const [items, setItems] = useState<ZapModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const fetchPage = useCallback(async (offset: number): Promise<ZapModel[]> => {
    const page = await zapService.getExploreFeed(PAGE_SIZE, offset);
    if (page.length < PAGE_SIZE) setHasMore(false);
    return page;
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const page = await fetchPage(0);
      if (!cancelled) {
        setItems(page);
        offsetRef.current = page.length;
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setHasMore(true);
    const page = await fetchPage(0);
    setItems(page);
    offsetRef.current = page.length;
    setRefreshing(false);
  }, [fetchPage]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const page = await fetchPage(offsetRef.current);
    setItems(prev => {
      const existingIds = new Set(prev.map(z => z.id));
      const fresh = page.filter(z => !existingIds.has(z.id));
      offsetRef.current += fresh.length;
      return [...prev, ...fresh];
    });
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchPage]);

  const renderItem = useCallback(({ item }: { item: ZapModel; index: number }) => {
    return <ExploreGridItem item={item} />;
  }, []);

  const keyExtractor = useCallback((item: ZapModel) => item.id, []);

  const ListFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#208AEF" />
      </View>
    );
  }, [loadingMore]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
        <ActivityIndicator size="large" color="#208AEF" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
        <Text style={[styles.emptyText, { color: isDark ? '#52525B' : '#A1A1AA' }]}>
          No posts to explore yet
        </Text>
      </View>
    );
  }

  return (
    // FlashList v2: masonry prop replaces the deprecated MasonryFlashList component.
    // No estimatedItemSize needed — v2 auto-measures all items.
    // overrideItemLayout only supports `span` in v2, so we omit it entirely here.
    <FlashList
      data={items}
      numColumns={2}
      masonry
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={ListFooter}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#208AEF"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
