import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  Heart, MessageCircle, Share2, Bookmark, Ellipsis, Play,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { Avatar } from '@/components/common/Avatar';
import { type ZapModel, type UserModel } from '@/types/models';

const ACCENT = '#208AEF';

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

interface Props {
  zap: ZapModel;
  user?: UserModel | null;
  isActive: boolean; // true when this slide is the current page
  isLiked?: boolean;
  isBookmarked?: boolean;
  likesCount?: number;
  onLike?: () => void;
  onBookmark?: () => void;
  onComment?: () => void;
  onProfilePress?: () => void;
}

export function ShortVideoPlayer({
  zap,
  user,
  isActive,
  isLiked = false,
  isBookmarked = false,
  likesCount,
  onLike,
  onBookmark,
  onComment,
  onProfilePress,
}: Props) {
  const videoUrl = zap.mediaUrls[0];
  const [manualPaused, setManualPaused] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const player = useVideoPlayer(videoUrl ?? null, (p) => {
    p.loop = true;
    p.muted = false;
  });

  // Play / pause driven by isActive + manualPaused
  useEffect(() => {
    if (!player) return;
    if (isActive && !manualPaused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, manualPaused, player]);

  const togglePlayPause = useCallback(() => {
    setManualPaused((prev) => !prev);
  }, []);

  const handleShare = useCallback(async () => {
    await Share.share({ message: `Watch this short on Z! z://short/${zap.id}` });
  }, [zap.id]);

  if (!videoUrl) return null;

  const shouldPlay = isActive && !manualPaused;

  return (
    <View style={styles.container}>
      {/* Video */}
      <Pressable style={StyleSheet.absoluteFill} onPress={togglePlayPause}>
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
        {/* Tap-to-pause icon overlay */}
        {(!shouldPlay) && (
          <View style={styles.pauseOverlay}>
            <Play size={48} color="rgba(255,255,255,0.9)" fill="rgba(255,255,255,0.9)" />
          </View>
        )}
        {buffering && (
          <View style={styles.bufferOverlay}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}
      </Pressable>

      {/* Right actions column */}
      <View style={styles.actions}>
        {/* Avatar */}
        <TouchableOpacity onPress={onProfilePress} style={styles.avatarWrap}>
          <Avatar
            uri={user?.profilePictureUrl}
            name={user?.displayName ?? '?'}
            size={44}
            showBorder
          />
        </TouchableOpacity>

        <SideAction
          icon={<Heart size={26} color={isLiked ? '#EF4444' : '#fff'} fill={isLiked ? '#EF4444' : 'none'} strokeWidth={2} />}
          label={formatCount(likesCount ?? zap.likesCount)}
          onPress={onLike}
        />
        <SideAction
          icon={<MessageCircle size={26} color="#fff" strokeWidth={2} />}
          label={formatCount(zap.commentsCount)}
          onPress={onComment}
        />
        <SideAction
          icon={<Share2 size={26} color="#fff" strokeWidth={2} />}
          label={formatCount(zap.sharesCount)}
          onPress={handleShare}
        />
        <SideAction
          icon={
            <Bookmark
              size={26}
              color={isBookmarked ? ACCENT : '#fff'}
              fill={isBookmarked ? ACCENT : 'none'}
              strokeWidth={2}
            />
          }
          label=""
          onPress={onBookmark}
        />
        <SideAction
          icon={<Ellipsis size={26} color="#fff" strokeWidth={2} />}
          label=""
          onPress={() => {}}
        />
      </View>

      {/* Bottom overlay — creator info + caption */}
      <View style={styles.bottomOverlay}>
        <TouchableOpacity onPress={onProfilePress} style={styles.creatorRow}>
          <Text style={styles.creatorName}>@{user?.username ?? '...'}</Text>
          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
        {zap.text.trim().length > 0 && (
          <Text style={styles.caption} numberOfLines={3}>
            {zap.text}
          </Text>
        )}
      </View>
    </View>
  );
}

interface SideActionProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}

function SideAction({ icon, label, onPress }: SideActionProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.sideAction} activeOpacity={0.7}>
      {icon}
      {label.length > 0 && <Text style={styles.sideLabel}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  pauseOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: { marginBottom: 4 },
  sideAction: { alignItems: 'center', gap: 3 },
  sideLabel: { color: '#fff', fontSize: 12, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 80,
    bottom: 90,
  },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  creatorName: { color: '#fff', fontSize: 15, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  verifiedBadge: {
    backgroundColor: '#208AEF',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
    fontWeight: '500',
  },
});
