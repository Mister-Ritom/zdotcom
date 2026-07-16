import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PixelRatio,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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

function clampHeight(ratio: number, width: number, maxHeight: number) {
  return Math.min(Math.max(width / ratio, MIN_HEIGHT), maxHeight);
}

interface Props {
  mediaUrls: string[];
  maxHeight?: number;
  borderRadius?: number;
}

export function MediaCarousel({
  mediaUrls,
  maxHeight = 700,
  borderRadius = 12,
}: Props) {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [aspectRatios, setAspectRatios] = useState<Record<number, number>>({});
  const [scrollWidth, setScrollWidth] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const heightAnim = useSharedValue(clampHeight(DEFAULT_RATIO, 300, maxHeight));

  useEffect(() => {
    if (scrollWidth === 0) return;
    const ratio = aspectRatios[currentIndex] ?? DEFAULT_RATIO;
    const target = clampHeight(ratio, scrollWidth, maxHeight);
    heightAnim.value = withSpring(target, { damping: 20, stiffness: 200, mass: 0.8 });
  }, [currentIndex, aspectRatios, scrollWidth, maxHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
  }));

  const handleScroll = useCallback(
    (e: any) => {
      if (scrollWidth === 0) return;
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / scrollWidth);
      setCurrentIndex(index);
    },
    [scrollWidth],
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
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          onLayout={(e) => setScrollWidth(PixelRatio.roundToNearestPixel(e.nativeEvent.layout.width))}
        >
          {scrollWidth > 0 && mediaUrls.map((url, index) => (
            <TouchableOpacity
              key={`${url}-${index}`}
              activeOpacity={0.9}
              onPress={() => openViewer(index)}
              style={{ width: scrollWidth, height: "100%" }}
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
                  transition={300}
                  onLoad={(e) => handleImageLoad(index, e)}
                />
              )}
            </TouchableOpacity>
          ))}
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
    backgroundColor: "#000",
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
