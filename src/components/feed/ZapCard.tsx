import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  useColorScheme,
  Share,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Heart, MessageCircle, Repeat2, Share2, Bookmark,
  ShieldCheck, Ellipsis, Zap,
} from 'lucide-react-native';
import { Avatar } from '@/components/common/Avatar';
import { ZapText } from '@/components/feed/ZapText';
import { ZapVideoPlayer } from '@/components/feed/ZapVideoPlayer';
import { type ZapModel } from '@/types/models';
import { type UserModel } from '@/types/models';

const isVideo = (url: string) => url.toLowerCase().includes('.mp4');

const { width: SCREEN_W } = Dimensions.get('window');
const ACCENT = '#208AEF';

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

interface Props {
  zap: ZapModel;
  user?: UserModel | null;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likesCount?: number;
  onPress?: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  onBoost?: () => void;
}

export function ZapCard({
  zap,
  user,
  isLiked = false,
  isBookmarked = false,
  likesCount,
  onPress,
  onLike,
  onBookmark,
  onBoost,
}: Props) {
  const isDark = useColorScheme() === 'dark';
  const hasMedia = zap.mediaUrls.length > 0;
  const hasText = zap.text.trim().length > 0;
  const [imgIndex, setImgIndex] = useState(0);

  const handleShare = useCallback(async () => {
    await Share.share({ message: `Check this out on Z! z://zap/${zap.id}` });
  }, [zap.id]);

  const cardBg = isDark ? '#18181B' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar
            uri={user?.profilePictureUrl}
            name={user?.displayName ?? '?'}
            size={42}
          />
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: isDark ? '#F4F4F5' : '#18181B' }]}>
                {user?.displayName ?? '...'}
              </Text>
              {user?.isVerified && (
                <ShieldCheck size={14} color={ACCENT} strokeWidth={2.5} style={{ marginLeft: 4 }} />
              )}
              <Text style={[styles.timeAgo, { color: isDark ? '#71717A' : '#A1A1AA' }]}>
                {'  /  '}{timeAgo(zap.createdAt)}
              </Text>
            </View>
            <Text style={[styles.username, { color: isDark ? '#52525B' : '#A1A1AA' }]}>
              @{user?.username ?? '...'}
              {zap.isThread && (
                <Text style={{ color: ACCENT }}> # thread</Text>
              )}
            </Text>
          </View>
        </View>
        <TouchableOpacity hitSlop={8}>
          <Ellipsis size={18} color={isDark ? '#52525B' : '#A1A1AA'} />
        </TouchableOpacity>
      </View>

      {/* Media */}
      {hasMedia ? (
        <View style={[styles.mediaContainer, { aspectRatio: zap.isShort ? 9 / 16 : 4 / 3 }]}>
          {isVideo(zap.mediaUrls[imgIndex]) ? (
            <ZapVideoPlayer uri={zap.mediaUrls[imgIndex]} />
          ) : (
            <Image
              source={{ uri: zap.mediaUrls[imgIndex] }}
              style={styles.mediaImage}
              contentFit="cover"
              transition={300}
            />
          )}
          {zap.mediaUrls.length > 1 && (
            <View style={styles.paginationDots}>
              {zap.mediaUrls.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.4)' },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        // Text-only big block
        <View style={[
          styles.textBlock,
          {
            backgroundColor: isDark
              ? 'linear-gradient(135deg, #0F172A 0%, #000 100%)'
              : undefined,
          },
        ]}>
          <View style={[styles.textBlockInner, {
            backgroundColor: isDark ? '#0F172A' : '#EFF6FF',
          }]}>
            <Zap size={36} color={ACCENT} strokeWidth={2.5} style={{ marginBottom: 12 }} />
            <Text style={[
              styles.textBlockQuote,
              { color: isDark ? '#93C5FD' : '#1D4ED8' },
            ]}>
              "{zap.text}"
            </Text>
          </View>
        </View>
      )}

      {/* Caption / Text if hasMedia */}
      {hasMedia && hasText && (
        <View style={styles.caption}>
          <ZapText text={zap.text} />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <ActionBtn
            icon={<Heart size={15} color={isLiked ? '#EF4444' : (isDark ? '#71717A' : '#A1A1AA')} fill={isLiked ? '#EF4444' : 'none'} strokeWidth={2} />}
            label={formatCount(likesCount ?? zap.likesCount)}
            active={isLiked}
            activeColor="#EF4444"
            onPress={onLike}
          />
          <ActionBtn
            icon={<MessageCircle size={15} color={isDark ? '#71717A' : '#A1A1AA'} strokeWidth={2} />}
            label={String(zap.repliesCount)}
            onPress={onPress}
          />
          <ActionBtn
            icon={<Repeat2 size={15} color={isDark ? '#71717A' : '#A1A1AA'} strokeWidth={2} />}
            label="Boost"
            isText
            onPress={onBoost}
          />
        </View>
        <View style={styles.actionsRight}>
          <TouchableOpacity onPress={handleShare} hitSlop={8} style={styles.iconBtn}>
            <Share2 size={17} color={isDark ? '#52525B' : '#A1A1AA'} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onBookmark} hitSlop={8} style={styles.iconBtn}>
            <Bookmark
              size={17}
              color={isBookmarked ? ACCENT : (isDark ? '#52525B' : '#A1A1AA')}
              fill={isBookmarked ? ACCENT : 'none'}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

interface ActionBtnProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeColor?: string;
  isText?: boolean;
  onPress?: () => void;
}

function ActionBtn({ icon, label, active = false, activeColor = ACCENT, isText = false, onPress }: ActionBtnProps) {
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#27272A' : '#F4F4F5';
  const textColor = active ? activeColor : (isDark ? '#71717A' : '#A1A1AA');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.actionBtn, { backgroundColor: bg }]}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerText: { marginLeft: 10, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  displayName: { fontSize: 14, fontWeight: '700' },
  timeAgo: { fontSize: 11, fontWeight: '500' },
  username: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginTop: 1 },
  mediaContainer: {
    marginHorizontal: 14,
    marginBottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 4 / 3,
    backgroundColor: '#000',
  },
  mediaImage: { width: '100%', height: '100%' },
  paginationDots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  textBlock: { marginHorizontal: 14, marginBottom: 4, borderRadius: 12, overflow: 'hidden' },
  textBlockInner: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  textBlockQuote: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  caption: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
  },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionsRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionLabel: { fontSize: 12, fontWeight: '800' },
  iconBtn: { padding: 6 },
});
