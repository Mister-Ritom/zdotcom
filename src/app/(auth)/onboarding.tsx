/**
 * Onboarding screen — 3-slide carousel.
 * Port of flutter/lib/screens/onboarding/onboarding_screen.dart
 *
 * Uses a FlatList for swipeable pages + Reanimated 4 for animated
 * progress dots (mirrors Flutter's AnimatedContainer approach).
 */

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useRouter } from "expo-router";
import { Compass, Share2, Users } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Data ─────────────────────────────────────────────────────────────────────
type LucideIcon = typeof Users;

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  Icon: LucideIcon;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "1",
    title: "Connect with Friends",
    description:
      "Z makes it easy to stay in touch with your friends and family instantly.",
    Icon: Users,
  },
  {
    id: "2",
    title: "Share Moments",
    description:
      "Share your life updates with Zaps, Stories, and short videos.",
    Icon: Share2,
  },
  {
    id: "3",
    title: "Discover Content",
    description:
      "Explore trending topics and discover new creators you'll love.",
    Icon: Compass,
  },
];

// ─── Dot component ─────────────────────────────────────────────────────────────
function Dot({ index, activeIndex }: { index: number; activeIndex: number }) {
  const isActive = index === activeIndex;
  const width = useSharedValue(isActive ? 24 : 8);

  useEffect(() => {
    width.value = withTiming(isActive ? 24 : 8, { duration: 300 });
  }, [isActive, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        isActive ? styles.dotActive : styles.dotInactive,
        animatedStyle,
      ]}
    />
  );
}

// ─── Slide component ──────────────────────────────────────────────────────────
function Slide({ item, width }: { item: OnboardingSlide; width: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { Icon } = item;

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.iconContainer}>
        <Icon size={72} color="#fff" strokeWidth={1.5} />
      </View>
      <Text style={[styles.slideTitle, isDark && styles.textLight]}>
        {item.title}
      </Text>
      <Text
        style={[styles.slideDescription, isDark && styles.textSecondaryLight]}
      >
        {item.description}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const markOnboardingSeen = useSettingsStore((s) => s.markOnboardingSeen);

  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      if (Platform.OS === "web") {
        setActiveIndex(activeIndex + 1);
      } else {
        listRef.current?.scrollToIndex({
          index: activeIndex + 1,
          animated: true,
        });
      }
    } else {
      markOnboardingSeen();
      router.replace("/(auth)/login");
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Slide pages */}
      {Platform.OS === "web" ? (
        <View style={styles.list}>
          <Slide item={SLIDES[activeIndex]} width={width} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={SLIDES}
          renderItem={({ item }) => <Slide item={item} width={width} />}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          style={styles.list}
        />
      )}

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} activeIndex={activeIndex} />
          ))}
        </View>

        <View style={styles.gap48} />

        {/* CTA button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {activeIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ACCENT = "#208AEF";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  list: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 24,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
    color: "#000",
  },
  slideDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: "#555",
  },
  textLight: {
    color: "#fff",
  },
  textSecondaryLight: {
    color: "#aaa",
  },
  bottomControls: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: ACCENT,
  },
  dotInactive: {
    backgroundColor: "#ccc",
  },
  gap48: {
    height: 48,
  },
  button: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignSelf: "stretch",
    alignItems: "center",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
