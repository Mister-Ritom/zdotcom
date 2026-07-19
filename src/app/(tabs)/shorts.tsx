import { CommentsSheet } from "@/components/sheets/CommentsSheet";
import { ShortVideoContainer } from "@/components/shorts/ShortVideoContainer";
import { DesktopLayout } from "@/components/DesktopLayout";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTabBarVisibility } from "@/contexts/TabBarVisibilityContext";
import { useFeedStore } from "@/stores/useFeedStore";
import { useOptionsSheet } from "@/contexts/OptionsSheetContext";
import { useSendSheet } from "@/contexts/SendSheetContext";
import BottomSheet from "@gorhom/bottom-sheet";
import { useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  RefreshControl,
} from "react-native";

export default function ShortsScreen() {
  const navigation = useNavigation();
  // Start as false — videos must NOT play until the shorts tab gains focus
  const [isFocused, setIsFocused] = useState(false);
  const { setTabBarHidden } = useTabBarVisibility();
  const { showOptions } = useOptionsSheet();
  const { showSend } = useSendSheet();

  const { shorts, loadShorts, loadMoreShorts } = useFeedStore();
  const { user: authUser } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Single source of truth — no onLayout, no double render.
  // Dimensions are derived once from useWindowDimensions and never change mid-render.
  const { height: windowH, width: windowW } = useWindowDimensions();
  const isWeb = Platform.OS === "web";

  // On web: center a 9:16 portrait card with black bars on the sides.
  // On native: full screen width and height.
  const cardW = isWeb ? Math.min(Math.floor(windowH * (9 / 16)), windowW) : windowW;
  const itemH = windowH;

  const commentsSheetRef = useRef<BottomSheet>(null);
  const [activeZapId, setActiveZapId] = useState<string | null>(null);

  // Single focus/blur listener — plays when tab gains focus, pauses when it loses it
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", () =>
      setIsFocused(true),
    );
    const unsubscribeBlur = navigation.addListener("blur", () =>
      setIsFocused(false),
    );
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  useEffect(() => {
    loadShorts(authUser?.id, true).then(() => setInitialized(true));
  }, []);

  // Index-based prefetch: when 3 items from the end of the loaded buffer,
  // fetch the next page. More precise than scroll-distance-based onEndReached.
  const PREFETCH_THRESHOLD = 3;
  useEffect(() => {
    if (
      shorts.zaps.length > 0 &&
      activeIndex >= shorts.zaps.length - PREFETCH_THRESHOLD
    ) {
      loadMoreShorts(authUser?.id);
    }
  }, [activeIndex, shorts.zaps.length]);

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  });
  const viewConfig = useRef({ itemVisiblePercentThreshold: 80 });

  if (!initialized || (shorts.zaps.length === 0 && shorts.isLoading)) {
    return (
      <View style={[s.center, { backgroundColor: "#000" }]}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (shorts.zaps.length === 0) {
    return (
      <View style={[s.center, { backgroundColor: "#000" }]}>
        <Text style={{ color: "#fff", fontSize: 15 }}>No shorts yet</Text>
        <Text style={{ color: "#888", fontSize: 13, marginTop: 6 }}>
          Come back soon ⚡
        </Text>
      </View>
    );
  }

  // On web: render a centered 9:16 card (like YouTube Shorts).
  // Card width is derived from the window height in a single pass.
  // On native: each item fills the full screen width.

  return (
    <DesktopLayout>
      <View style={s.root}>
        {/* FlatList always renders — itemH is seeded from useWindowDimensions */}
        <View style={isWeb ? [s.webWrapper, { width: cardW }] : s.nativeWrapper}>
          <FlatList
            data={shorts.zaps}
            keyExtractor={(z) => z.id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            refreshControl={
              <RefreshControl
                refreshing={shorts.isRefreshing}
                onRefresh={() => loadShorts(authUser?.id, true)}
                tintColor="#fff"
              />
            }
            snapToInterval={itemH}
            snapToAlignment="start"
            getItemLayout={(_, index) => ({
              length: itemH,
              offset: itemH * index,
              index,
            })}
            style={s.list}
            // Virtualization: keep only current + 1 above + 1 below rendered.
            // This ensures off-screen video players are unmounted and stop buffering.
            windowSize={3}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            removeClippedSubviews
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewConfig.current}
            // Pagination is driven by the index-based useEffect above,
            // not scroll-distance, so onEndReached is intentionally omitted.
            scrollIndicatorInsets={{ bottom: 0 }}
            automaticallyAdjustsScrollIndicatorInsets={false}
            renderItem={({ item, index }) => (
              // Explicit width + height required on web — without width,
              // RN Web renders FlatList items inline (side-by-side).
              <View style={{ height: itemH, width: cardW }}>
                <ShortVideoContainer
                  zap={item}
                  isActive={isFocused && activeIndex === index}
                  onOpenComments={() => {
                    setActiveZapId(item.id);
                    setTabBarHidden(true);
                    commentsSheetRef.current?.snapToIndex(0);
                  }}
                  onOpenOptions={() => {
                    setActiveZapId(item.id);
                    setTabBarHidden(true);
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
        <CommentsSheet ref={commentsSheetRef} postId={activeZapId ?? ""} onClose={() => setTabBarHidden(false)} />
      </View>
    </DesktopLayout>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  // Web: centered narrow card, black bars on the sides
  webWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  // Native: fill the screen
  nativeWrapper: {
    flex: 1,
    width: "100%",
  },
  list: {
    flex: 1,
    width: "100%",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
