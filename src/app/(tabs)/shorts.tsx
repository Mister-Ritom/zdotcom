import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View, Text, StyleSheet, useColorScheme, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { useFeedStore } from '@/stores/useFeedStore';
import { ShortVideoContainer } from '@/components/shorts/ShortVideoContainer';

const TAB_BAR_H = 60;

export default function ShortsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(true);
  const { height: winH } = useWindowDimensions();
  const itemH = winH - TAB_BAR_H - insets.bottom;

  const { shorts, loadShorts, loadMoreShorts } = useFeedStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => setIsFocused(true));
    const unsubscribeBlur = navigation.addListener('blur', () => setIsFocused(false));
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  useEffect(() => {
    loadShorts(true).then(() => setInitialized(true));
  }, []);

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  });
  const viewConfig = useRef({ itemVisiblePercentThreshold: 80 });

  if (!initialized || (shorts.zaps.length === 0 && shorts.isLoading)) {
    return <View style={[s.center, { backgroundColor: '#000' }]}><ActivityIndicator color="#fff" size="large" /></View>;
  }

  if (shorts.zaps.length === 0) {
    return (
      <View style={[s.center, { backgroundColor: '#000' }]}>
        <Text style={{ color: '#fff', fontSize: 15 }}>No shorts yet</Text>
        <Text style={{ color: '#888', fontSize: 13, marginTop: 6 }}>Come back soon ⚡</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={shorts.zaps}
      keyExtractor={(z) => z.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={itemH}
      snapToAlignment="start"
      getItemLayout={(_, index) => ({ length: itemH, offset: itemH * index, index })}
      onViewableItemsChanged={onViewRef.current}
      viewabilityConfig={viewConfig.current}
      onEndReached={loadMoreShorts}
      onEndReachedThreshold={2}
      renderItem={({ item, index }) => (
        <View style={{ height: itemH }}>
          <ShortVideoContainer zap={item} isActive={isFocused && index === activeIndex} />
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center' } });

