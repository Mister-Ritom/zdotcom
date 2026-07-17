import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Play, Heart } from 'lucide-react-native';
import { router } from 'expo-router';
import { type ZapModel } from '@/types/models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COL_GAP = 3;
const NUM_COLS = 2;
export const ITEM_WIDTH = (SCREEN_WIDTH - COL_GAP * (NUM_COLS + 1)) / NUM_COLS;

// Fallback height used before the image loads (portrait-ish ratio)
const FALLBACK_HEIGHT = Math.round(ITEM_WIDTH * 1.25);

// Min/max clamps so no item is absurdly tall or wide
const MIN_HEIGHT = 120;
const MAX_HEIGHT = Math.round(ITEM_WIDTH * 2.2);

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|m4v|webm|mkv)(\?|$)/i.test(url);
}

interface Props {
  item: ZapModel;
}

export const ExploreGridItem = React.memo(function ExploreGridItem({ item }: Props) {
  const thumbnailUrl = item.mediaUrls[0] ?? null;
  const isVideo = thumbnailUrl ? isVideoUrl(thumbnailUrl) : item.isShort;

  // Height starts at fallback; updated to the image's true aspect-ratio height on load
  const [height, setHeight] = useState(FALLBACK_HEIGHT);

  const handleImageLoad = useCallback((e: any) => {
    const w: number = e?.source?.width;
    const h: number = e?.source?.height;
    if (w > 0 && h > 0) {
      const natural = Math.round((ITEM_WIDTH * h) / w);
      setHeight(Math.min(Math.max(natural, MIN_HEIGHT), MAX_HEIGHT));
    }
  }, []);

  const handlePress = useCallback(() => {
    router.push(`/zap/${item.id}`);
  }, [item.id]);

  return (
    <TouchableOpacity
      style={[styles.container, { height }]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      {thumbnailUrl ? (
        <Image
          source={{ uri: thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          // cover fills the cell; because height now matches the image's natural
          // aspect ratio, nothing is cropped — the image simply fills its container.
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
          recyclingKey={item.id}
          onLoad={handleImageLoad}
        />
      ) : (
        <View style={styles.textFallback}>
          <Text style={styles.textFallbackContent} numberOfLines={6}>
            {item.text}
          </Text>
        </View>
      )}

      {/* Video / Short badge */}
      {isVideo && (
        <View style={styles.videoBadge}>
          <Play size={10} color="#FFF" fill="#FFF" />
        </View>
      )}

      {/* Likes count */}
      {item.likesCount > 0 && (
        <View style={styles.likesBadge}>
          <Heart size={10} color="#FFF" fill="#FFF" />
          <Text style={styles.likesText}>{formatCount(item.likesCount)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: ITEM_WIDTH,
    backgroundColor: '#18181B',
    overflow: 'hidden',
    borderRadius: 4,
    margin: COL_GAP / 2,
  },
  textFallback: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
  },
  textFallbackContent: {
    color: '#E4E4E7',
    fontSize: 12,
    lineHeight: 18,
  },
  videoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    padding: 4,
  },
  likesBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  likesText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
