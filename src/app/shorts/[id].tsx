import { CommentsSheet } from '@/components/sheets/CommentsSheet';
import { ShortVideoContainer } from '@/components/shorts/ShortVideoContainer';
import { useAuthStore } from '@/stores/useAuthStore';
import { zapService } from '@/services/zapService';
import { type ZapModel } from '@/types/models';
import { ZAP_SHARE_PREFIX } from '@/components/sheets/SendSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { OptionsSheetProvider, useOptionsSheet } from '@/contexts/OptionsSheetContext';
import { SendSheetProvider, useSendSheet } from '@/contexts/SendSheetContext';

const PREFETCH_THRESHOLD = 3;
const isWeb = Platform.OS === 'web';

// ── Inner screen — consumes the local OptionsSheetProvider ─────────────────

function ShortsDeepLinkInner({ id }: { id: string }) {
  const { user: authUser } = useAuthStore();
  const { showOptions } = useOptionsSheet();
  const { showSend } = useSendSheet();

  const { height: windowH, width: windowW } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const cardW = isWeb ? Math.min(Math.floor(windowH * (9 / 16)), windowW) : windowW;
  const itemH = windowH;

  const [zaps, setZaps] = useState<ZapModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeZapId, setActiveZapId] = useState<string | null>(null);
  const [tabBarHidden, setTabBarHidden] = useState(false);

  const commentsSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<FlatList>(null);
  const hasScrolledToStart = useRef(false);

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  });
  const viewConfig = useRef({ itemVisiblePercentThreshold: 80 });

  useEffect(() => {
    if (!id) return;
    loadFeed();
  }, [id]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const [targetZap, feedZaps] = await Promise.all([
        zapService.getZapById(id),
        zapService.getForYouFeed(true, 30, 0),
      ]);

      let merged = feedZaps;
      if (targetZap) {
        const withoutTarget = feedZaps.filter((z) => z.id !== targetZap.id);
        merged = [targetZap, ...withoutTarget];
      }
      setZaps(merged);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to index 0 after list is ready.
  // On web, initialScrollIndex is not supported — scroll manually instead.
  useEffect(() => {
    if (zaps.length > 0 && !hasScrolledToStart.current) {
      hasScrolledToStart.current = true;
      // Small delay to ensure the FlatList has measured itself
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: false });
      }, 100);
    }
  }, [zaps]);

  // Prefetch more shorts when nearing the end
  useEffect(() => {
    if (zaps.length > 0 && activeIndex >= zaps.length - PREFETCH_THRESHOLD) {
      zapService.getForYouFeed(true, 20, zaps.length).then((more) => {
        if (more.length > 0) {
          setZaps((prev) => {
            const existingIds = new Set(prev.map((z) => z.id));
            return [...prev, ...more.filter((z) => !existingIds.has(z.id))];
          });
        }
      });
    }
  }, [activeIndex, zaps.length]);

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: '#000' }]}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (zaps.length === 0) {
    return (
      <View style={[s.center, { backgroundColor: '#000' }]}>
        <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Short not found</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Text style={{ color: '#208AEF', fontSize: 14 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Back button — floats above the video */}
      <TouchableOpacity
        style={[s.backBtn, { top: insets.top + 10 }]}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        activeOpacity={0.8}
      >
        <ArrowLeft size={20} color="#fff" />
      </TouchableOpacity>

      <View style={isWeb ? [s.webWrapper, { width: cardW }] : s.nativeWrapper}>
        <FlatList
          ref={flatListRef}
          data={zaps}
          keyExtractor={(z) => z.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={itemH}
          snapToAlignment="start"
          // Do NOT pass initialScrollIndex — it triggers "operation not supported"
          // on web. We use scrollToIndex in useEffect instead.
          getItemLayout={(_, index) => ({
            length: itemH,
            offset: itemH * index,
            index,
          })}
          style={s.list}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          removeClippedSubviews
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfig.current}
          scrollIndicatorInsets={{ bottom: 0 }}
          automaticallyAdjustsScrollIndicatorInsets={false}
          renderItem={({ item, index }) => (
            <View style={{ height: itemH, width: cardW }}>
              <ShortVideoContainer
                zap={item}
                isActive={activeIndex === index}
                onOpenComments={() => {
                  setActiveZapId(item.id);
                  setTabBarHidden(true);
                  commentsSheetRef.current?.snapToIndex(0);
                }}
                onOpenOptions={() => {
                  setActiveZapId(item.id);
                  showOptions({
                    zapId: item.id,
                    contentType: 'short',
                    isOwner: authUser?.id === item.userId,
                    currentText: item.text,
                    onClose: () => setTabBarHidden(false),
                  });
                }}
                onOpenSend={() => {
                  setTabBarHidden(true);
                  showSend({
                    zapId: item.id,
                    zapText: item.text,
                    onClose: () => setTabBarHidden(false),
                  });
                }}
              />
            </View>
          )}
        />
      </View>

      <CommentsSheet
        ref={commentsSheetRef}
        postId={activeZapId ?? ''}
        onClose={() => setTabBarHidden(false)}
      />
    </View>
  );
}

// ── Public wrapper — provides its own OptionsSheetProvider ─────────────────

export default function ShortsDeepLinkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <OptionsSheetProvider>
      <SendSheetProvider>
        <ShortsDeepLinkInner id={id ?? ''} />
      </SendSheetProvider>
    </OptionsSheetProvider>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webWrapper: { flex: 1, overflow: 'hidden' },
  nativeWrapper: { flex: 1, width: '100%' },
  list: { flex: 1, width: '100%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute',
    left: 14,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.45)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
