import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Zap, ShieldCheck, Sparkles, Video } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const ACCENT = '#208AEF';

interface AuthLayoutContainerProps {
  children: React.ReactNode;
}

export function AuthLayoutContainer({ children }: AuthLayoutContainerProps) {
  const { isDesktopWeb } = useBreakpoint();
  const isDark = useColorScheme() === 'dark';

  // Floating micro-animation for the hero badge
  const floatY = useSharedValue(0);
  useEffect(() => {
    if (isDesktopWeb) {
      floatY.value = withRepeat(
        withTiming(-8, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isDesktopWeb, floatY]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  if (!isDesktopWeb) {
    return <>{children}</>;
  }

  const bg = isDark ? '#09090B' : '#FAFAFA';
  const panelBg = isDark ? '#121215' : '#FFFFFF';
  const borderColor = isDark ? '#27272A' : '#E4E4E7';
  const textPrimary = isDark ? '#FFFFFF' : '#09090B';
  const textSecondary = isDark ? '#A1A1AA' : '#52525B';
  const cardBg = isDark ? '#18181B' : '#F4F4F6';

  return (
    <View style={[styles.webContainer, { backgroundColor: bg }]}>
      {/* ── Left Hero Panel (Stunning Brand & Features Showcase) ── */}
      <View style={[styles.heroPanel, { backgroundColor: panelBg, borderRightColor: borderColor }]}>
        <View style={styles.heroContent}>
          {/* Logo Brand Header */}
          <View style={styles.brandHeader}>
            <Image
              source={
                isDark
                  ? require("@/../assets/images/icon_dark.png")
                  : require("@/../assets/images/icon_black.png")
              }
              style={{ width: 44, height: 44 }}
              resizeMode="contain"
            />
            <Text style={[styles.brandName, { color: textPrimary }]}>Zapcom</Text>
          </View>

          {/* Headline & Value Proposition */}
          <Text style={[styles.heroHeadline, { color: textPrimary }]}>
            Where conversations come alive.
          </Text>
          <Text style={[styles.heroSubheadline, { color: textSecondary }]}>
            Experience real-time Zaps, immersive Stories, high-definition Shorts, and end-to-end privacy across every device.
          </Text>

          <View style={styles.gap32} />

          {/* Interactive Feature Cards */}
          <View style={styles.featureGrid}>
            <Animated.View style={[styles.featureCard, { backgroundColor: cardBg, borderColor: borderColor }, floatStyle]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(32, 138, 239, 0.15)' }]}>
                <Zap size={20} color={ACCENT} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={[styles.featureTitle, { color: textPrimary }]}>Lightning-Fast Zaps</Text>
                <Text style={[styles.featureDesc, { color: textSecondary }]}>Real-time updates, instant replies, and buttery-smooth interactions.</Text>
              </View>
            </Animated.View>

            <View style={[styles.featureCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Video size={20} color="#EC4899" />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={[styles.featureTitle, { color: textPrimary }]}>Shorts & Stories</Text>
                <Text style={[styles.featureDesc, { color: textSecondary }]}>Share your daily highlights with crisp vertical video and dynamic stickers.</Text>
              </View>
            </View>

            <View style={[styles.featureCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <ShieldCheck size={20} color="#10B981" />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={[styles.featureTitle, { color: textPrimary }]}>Uncompromised Privacy</Text>
                <Text style={[styles.featureDesc, { color: textSecondary }]}>Granular controls, ghost mode, and secure verification built from day one.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer info */}
        <Text style={[styles.heroFooter, { color: textSecondary }]}>
          © {new Date().getFullYear()} Zapcom Inc. Crafted for modern creators and communities.
        </Text>
      </View>

      {/* ── Right Form Panel (Elevated Card Container) ── */}
      <ScrollView
        style={styles.formPanelScroll}
        contentContainerStyle={styles.formPanelContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.formCard, { backgroundColor: panelBg, borderColor: borderColor }]}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
  },
  heroPanel: {
    flex: 1.1,
    borderRightWidth: 1,
    paddingHorizontal: 56,
    paddingVertical: 48,
    justifyContent: 'space-between',
  },
  heroContent: {
    maxWidth: 540,
    alignSelf: 'center',
    width: '100%',
    marginVertical: 'auto',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 40,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  logoLetter: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroHeadline: {
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 50,
    letterSpacing: -1,
    marginBottom: 16,
  },
  heroSubheadline: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400',
  },
  gap32: {
    height: 36,
  },
  featureGrid: {
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroFooter: {
    fontSize: 13,
    marginTop: 24,
  },
  formPanelScroll: {
    flex: 1,
  },
  formPanelContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  formCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    padding: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
  },
});
