import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { MediaViewerModal } from "./MediaViewerModal";
import { ZapVideoPlayer } from "./ZapVideoPlayer";

const isVideo = (url: string) => url.toLowerCase().includes(".mp4");
const MIN_HEIGHT = 120;
const DEFAULT_RATIO = 4 / 3;

interface Props {
  mediaUrls: string[];
  maxHeight?: number;
  borderRadius?: number;
  onWidthCalculated?: (width: number) => void;
}

export function MediaCarousel({
  mediaUrls,
  maxHeight = 700,
  borderRadius = 12,
  onWidthCalculated,
}: Props) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && windowWidth >= 768;
  const capHeight = isDesktopWeb
    ? Math.min(maxHeight, windowHeight * 0.65)
    : maxHeight;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [aspectRatios, setAspectRatios] = useState<Record<number, number>>({});
  const [scrollWidth, setScrollWidth] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const currentRatio = aspectRatios[currentIndex] ?? DEFAULT_RATIO;
  const rawHeight = scrollWidth > 0 ? scrollWidth / currentRatio : 300;
  const targetHeight = Math.min(Math.max(rawHeight, MIN_HEIGHT), capHeight);
  const itemWidth = scrollWidth > 0 ? Math.min(scrollWidth, targetHeight * currentRatio) : scrollWidth;

  const heightAnim = useSharedValue(targetHeight);

  useEffect(() => {
    if (scrollWidth === 0) return;
    heightAnim.value = withSpring(targetHeight, { damping: 20, stiffness: 200, mass: 0.8 });
  }, [targetHeight, scrollWidth]);

  // Decoupled from scrollWidth so outer card width resizing never triggers a loop or flicker
  useEffect(() => {
    if (aspectRatios[currentIndex]) {
      const natW = Math.min(612, capHeight * (aspectRatios[currentIndex] ?? DEFAULT_RATIO));
      onWidthCalculated?.(natW);
    }
  }, [aspectRatios, currentIndex, capHeight, onWidthCalculated]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
  }));

  const handleScrollEnd = useCallback(
    (e: any) => {
      if (scrollWidth === 0) return;
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / scrollWidth);
      setCurrentIndex(index);
    },
    [scrollWidth],
  );

  const handleScroll = useCallback(
    (e: any) => {
      if (scrollWidth === 0) return;
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / scrollWidth);
      if (index !== currentIndex && index >= 0 && index < mediaUrls.length) {
        if (Math.abs(x - index * scrollWidth) <= 15) {
          setCurrentIndex(index);
        }
      }
    },
    [scrollWidth, currentIndex, mediaUrls.length],
  );

  const handleImageLoad = useCallback((index: number, e: any) => {
    const w = e?.source?.width;
    const h = e?.source?.height;
    if (w && h && h > 0) {
      setAspectRatios((prev) => ({ ...prev, [index]: w / h }));
    }
  }, []);

  const openViewer = useCallback((index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  }, []);

  const closeViewer = useCallback(() => setViewerVisible(false), []);

  const goToPage = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      scrollRef.current?.scrollTo({ x: index * scrollWidth, animated: true });
    },
    [scrollWidth],
  );

  if (mediaUrls.length === 0) return null;

  return (
    <View style={[styles.wrapper, { borderRadius }]}>
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={(e) => {
            if (e.nativeEvent.velocity?.x === 0) {
              handleScrollEnd(e);
            }
          }}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          onLayout={(e) => {
            const w = PixelRatio.roundToNearestPixel(e.nativeEvent.layout.width);
            if (Math.abs(scrollWidth - w) > 1) {
              setScrollWidth(w);
              if (scrollRef.current && currentIndex > 0) {
                scrollRef.current.scrollTo({ x: currentIndex * w, animated: false });
              }
            }
          }}
        >
          {scrollWidth > 0 && mediaUrls.map((url, index) => {
            const itemRatio = aspectRatios[index] ?? DEFAULT_RATIO;
            const currentItemWidth = Math.min(scrollWidth, targetHeight * itemRatio);

            return (
              <TouchableOpacity
                key={`${url}-${index}`}
                activeOpacity={0.9}
                onPress={() => openViewer(index)}
                style={{
                  width: scrollWidth,
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: currentItemWidth,
                    height: "100%",
                    overflow: "hidden",
                    borderRadius: 8,
                  }}
                >
                  {isVideo(url) ? (
                    <ZapVideoPlayer 
                      uri={url} 
                      onAspectRatioCalculated={(ratio) => setAspectRatios((prev) => ({ ...prev, [index]: ratio }))}
                    />
                  ) : (
                    <Image
                      source={{ uri: url }}
                      style={styles.image}
                      contentFit="cover"
                      onLoad={(e) => handleImageLoad(index, e)}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {mediaUrls.length > 1 && (
        <View style={styles.dots}>
          {mediaUrls.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToPage(i)} hitSlop={8}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === currentIndex ? "#fff" : "rgba(255,255,255,0.4)",
                    transform: [{ scale: i === currentIndex ? 1.3 : 1 }],
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <MediaViewerModal
        visible={viewerVisible}
        mediaUrls={mediaUrls}
        initialIndex={viewerIndex}
        onClose={closeViewer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 14,
    marginBottom: 4,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  animatedContainer: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
