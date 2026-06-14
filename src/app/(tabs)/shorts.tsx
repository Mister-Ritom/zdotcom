import { ShortVideoContainer } from "@/components/shorts/ShortVideoContainer";
import { useFeedStore } from "@/stores/useFeedStore";
import { useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { CommentsSheet } from "@/components/sheets/CommentsSheet";
import { OptionsSheet } from "@/components/sheets/OptionsSheet";

export default function ShortsScreen() {
  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(true);

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

  const { shorts, loadShorts, loadMoreShorts } = useFeedStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const [itemH, setItemH] = useState(0);

  const commentsSheetRef = useRef<BottomSheet>(null);
  const optionsSheetRef = useRef<BottomSheet>(null);
  const [activeZapId, setActiveZapId] = useState<string | null>(null);

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
    loadShorts(true).then(() => setInitialized(true));
  }, []);

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

  return (
    <View 
      style={{ flex: 1, backgroundColor: "#000" }}
      onLayout={(e) => setItemH(e.nativeEvent.layout.height)}
    >
      {itemH > 0 && (
        <FlatList
          data={shorts.zaps}
          keyExtractor={(z) => z.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={itemH}
          snapToAlignment="start"
          getItemLayout={(_, index) => ({
            length: itemH,
            offset: itemH * index,
            index,
          })}
          onViewableItemsChanged={onViewRef.current}
          viewabilityConfig={viewConfig.current}
          onEndReached={loadMoreShorts}
          onEndReachedThreshold={2}
          renderItem={({ item, index }) => (
            <View style={{ height: itemH }}>
              <ShortVideoContainer
                zap={item}
                isActive={isFocused && activeIndex === index}
                onOpenComments={() => {
                  setActiveZapId(item.id);
                  commentsSheetRef.current?.snapToIndex(0);
                }}
                onOpenOptions={() => {
                  setActiveZapId(item.id);
                  optionsSheetRef.current?.snapToIndex(0);
                }}
              />
            </View>
          )}
        />
      )}
      <CommentsSheet ref={commentsSheetRef} postId={activeZapId ?? ''} />
      <OptionsSheet ref={optionsSheetRef} />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
