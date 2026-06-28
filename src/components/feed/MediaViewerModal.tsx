import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  Modal,
  PixelRatio,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ZapVideoPlayer } from "./ZapVideoPlayer";

const isVideo = (url: string) => url.toLowerCase().includes(".mp4");

interface Props {
  visible: boolean;
  mediaUrls: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function MediaViewerModal({
  visible,
  mediaUrls,
  initialIndex = 0,
  onClose,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const { width, height } = Dimensions.get("window");
  const slideWidth = PixelRatio.roundToNearestPixel(width);

  // Jump to the correct slide when the modal opens
  useEffect(() => {
    if (visible && initialIndex > 0) {
      // Small delay to let the modal finish mounting
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: initialIndex * slideWidth,
          animated: false,
        });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [visible, initialIndex, slideWidth]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Close button */}
        <SafeAreaView style={styles.header} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            hitSlop={12}
          >
            <X size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Media pager */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          style={StyleSheet.absoluteFill}
        >
          {mediaUrls.map((url, index) => (
            <View
              key={`${url}-${index}`}
              style={{ width: slideWidth, height }}
            >
              {isVideo(url) ? (
                <View style={{ width: slideWidth, height }}>
                  <ZapVideoPlayer uri={url} />
                </View>
              ) : (
                /* Wrap in a zoomable ScrollView for pinch-to-zoom */
                <ScrollView
                  style={{ width: slideWidth, height }}
                  contentContainerStyle={styles.zoomContent}
                  maximumZoomScale={4}
                  minimumZoomScale={1}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  centerContent
                >
                  <Image
                    source={{ uri: url }}
                    style={{ width: slideWidth, height }}
                    contentFit="contain"
                    transition={200}
                  />
                </ScrollView>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "flex-end",
    paddingTop: 48,
    paddingRight: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
});
