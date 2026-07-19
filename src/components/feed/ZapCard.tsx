import { Avatar } from "@/components/common/Avatar";
import { MediaCarousel } from "@/components/feed/MediaCarousel";
import { ZapText } from "@/components/feed/ZapText";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { type UserModel, type ZapModel } from "@/types/models";
import {
  Bookmark,
  Ellipsis,
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  ShieldCheck,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";


const ACCENT = "#208AEF";

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
  isBoosted?: boolean;
  likesCount?: number;
  rezapsCount?: number;
  onPress?: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  onBoost?: () => void;
  onShare?: () => void;
  disableBoost?: boolean;
  onOptions?: () => void;
}

export function ZapCard({
  zap,
  user,
  isLiked = false,
  isBookmarked = false,
  isBoosted = false,
  likesCount,
  rezapsCount,
  onPress,
  onLike,
  onBookmark,
  onBoost,
  onShare,
  disableBoost = false,
  onOptions,
}: Props) {
  const isDark = useColorScheme() === "dark";
  const [isHovered, setIsHovered] = useState(false);
  const [mediaWidth, setMediaWidth] = useState<number | null>(null);
  const hasMedia = zap.mediaUrls.length > 0;
  const hasText = zap.text.trim().length > 0;

  const handleWidthCalculated = useCallback((w: number) => {
    setMediaWidth((prev) => {
      if (prev !== null && Math.abs(prev - w) < 2) return prev;
      return w;
    });
  }, []);

  const cardBg = isDark ? "#18181B" : "#FFFFFF";
  const borderColor = isHovered && Platform.OS === "web"
    ? (isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.20)")
    : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)");

  const webShadowStyle = isHovered && Platform.OS === "web" ? {
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.6)" : "0 4px 20px rgba(0,0,0,0.08)",
  } as any : {};

  const { width: windowWidth } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && windowWidth >= 768;

  const dynamicCardStyle = isDesktopWeb && hasMedia && mediaWidth !== null && mediaWidth < 610 ? {
    width: Math.max(260, Math.min(640, mediaWidth + 28)),
    alignSelf: "center" as const,
    ...(Platform.OS === "web" ? ({ transition: "width 0.35s cubic-bezier(0.16, 1, 0.3, 1)" } as any) : {}),
  } : {
    width: "100%" as const,
    ...(Platform.OS === "web" ? ({ transition: "width 0.35s cubic-bezier(0.16, 1, 0.3, 1)" } as any) : {}),
  };

  return (
    <Pressable
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        styles.card,
        { backgroundColor: cardBg, borderColor },
        dynamicCardStyle,
        webShadowStyle,
      ]}
    >
      {/* Header — tapping navigates to zap */}
      <Pressable
        onPress={onPress}
        style={({ hovered }: any) => [
          styles.header,
          hovered && Platform.OS === "web" && { backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" },
          Platform.OS === "web" && ({ cursor: "pointer" } as any),
        ]}
      >
        <View style={styles.headerLeft}>
          <Avatar
            uri={user?.profilePictureUrl}
            name={user?.displayName ?? "?"}
            size={42}
          />
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text
                style={[
                  styles.displayName,
                  { color: isDark ? "#F4F4F5" : "#18181B" },
                ]}
              >
                {user?.displayName ?? "..."}
              </Text>
              {user?.isVerified && (
                <ShieldCheck
                  size={14}
                  color={ACCENT}
                  strokeWidth={2.5}
                  style={{ marginLeft: 4 }}
                />
              )}
              <Text
                style={[
                  styles.timeAgo,
                  { color: isDark ? "#71717A" : "#A1A1AA" },
                ]}
              >
                {"  /  "}
                {timeAgo(zap.createdAt)}
              </Text>
            </View>
            <Text
              style={[
                styles.username,
                { color: isDark ? "#52525B" : "#A1A1AA" },
              ]}
            >
              @{user?.username ?? "..."}
              {zap.isThread && <Text style={{ color: ACCENT }}> # thread</Text>}
            </Text>
          </View>
        </View>
        <Pressable
          hitSlop={8}
          onPress={onOptions}
          style={({ hovered }: any) => [
            styles.iconBtn,
            hovered && Platform.OS === "web" && { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", borderRadius: 20 },
            Platform.OS === "web" && ({ cursor: "pointer" } as any),
          ]}
        >
          <Ellipsis size={18} color={isDark ? "#52525B" : "#A1A1AA"} />
        </Pressable>
      </Pressable>

      {/* Media */}
      {hasMedia && (
        <MediaCarousel mediaUrls={zap.mediaUrls} onWidthCalculated={handleWidthCalculated} />
      )}

      {/* Text-only big block — tappable */}
      {!hasMedia && (
        <Pressable
          onPress={onPress}
          style={({ hovered }: any) => [
            styles.textBlock,
            {
              backgroundColor: isDark
                ? "linear-gradient(135deg, #0F172A 0%, #000 100%)"
                : undefined,
              opacity: hovered && Platform.OS === "web" ? 0.95 : 1,
            },
            Platform.OS === "web" && ({ cursor: "pointer" } as any),
          ]}
        >
          <View
            style={[
              styles.textBlockInner,
              {
                backgroundColor: isDark ? "#0F172A" : "#EFF6FF",
              },
            ]}
          >
            <Zap
              size={36}
              color={ACCENT}
              strokeWidth={2.5}
              style={{ marginBottom: 12 }}
            />
            <Text
              style={[
                styles.textBlockQuote,
                { color: isDark ? "#93C5FD" : "#1D4ED8" },
              ]}
            >
              &quot;{zap.text}&quot;
            </Text>
          </View>
        </Pressable>
      )}

      {/* Caption — tapping navigates to zap */}
      {hasMedia && hasText && (
        <Pressable
          onPress={onPress}
          style={({ hovered }: any) => [
            styles.caption,
            hovered && Platform.OS === "web" && { opacity: 0.85 },
            Platform.OS === "web" && ({ cursor: "pointer" } as any),
          ]}
        >
          <ZapText text={zap.text} />
        </Pressable>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <ActionBtn
            icon={
              <Heart
                size={15}
                color={isLiked ? "#EF4444" : isDark ? "#71717A" : "#A1A1AA"}
                fill={isLiked ? "#EF4444" : "none"}
                strokeWidth={2}
              />
            }
            label={formatCount(likesCount ?? zap.likesCount)}
            active={isLiked}
            activeColor="#EF4444"
            onPress={onLike}
          />
          <ActionBtn
            icon={
              <MessageCircle
                size={15}
                color={isDark ? "#71717A" : "#A1A1AA"}
                strokeWidth={2}
              />
            }
            label={String(zap.repliesCount)}
            onPress={onPress}
          />
          <ActionBtn
            icon={
              <Repeat2
                size={15}
                color={isBoosted ? "#10B981" : isDark ? "#71717A" : "#A1A1AA"}
                strokeWidth={2}
              />
            }
            label={formatCount(rezapsCount ?? zap.rezapsCount)}
            active={isBoosted}
            activeColor="#10B981"
            onPress={onBoost}
            disabled={disableBoost}
          />
        </View>
        <View style={styles.actionsRight}>
          <Pressable
            onPress={onShare}
            hitSlop={8}
            style={({ hovered }: any) => [
              styles.iconBtn,
              hovered && Platform.OS === "web" && { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", borderRadius: 20 },
              Platform.OS === "web" && ({ cursor: "pointer" } as any),
            ]}
          >
            <Share2
              size={17}
              color={isDark ? "#52525B" : "#A1A1AA"}
              strokeWidth={2}
            />
          </Pressable>
          <Pressable
            onPress={onBookmark}
            hitSlop={8}
            style={({ hovered }: any) => [
              styles.iconBtn,
              hovered && Platform.OS === "web" && { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", borderRadius: 20 },
              Platform.OS === "web" && ({ cursor: "pointer" } as any),
            ]}
          >
            <Bookmark
              size={17}
              color={isBookmarked ? ACCENT : isDark ? "#52525B" : "#A1A1AA"}
              fill={isBookmarked ? ACCENT : "none"}
              strokeWidth={2}
            />
          </Pressable>
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
  disabled?: boolean;
  isText?: boolean;
  onPress?: () => void;
}

function ActionBtn({
  icon,
  label,
  active = false,
  activeColor = ACCENT,
  disabled = false,
  isText = false,
  onPress,
}: ActionBtnProps) {
  const isDark = useColorScheme() === "dark";
  const bg = isDark ? "#27272A" : "#F4F4F5";
  const hoverBg = isDark ? "#3F3F46" : "#E4E4E7";
  const textColor = active ? activeColor : isDark ? "#71717A" : "#A1A1AA";

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }: any) => [
        styles.actionBtn,
        { backgroundColor: hovered && Platform.OS === "web" ? hoverBg : bg },
        (pressed || disabled) && { opacity: 0.6 },
        Platform.OS === "web" && ({ cursor: disabled ? "not-allowed" : "pointer" } as any),
      ]}
      disabled={disabled}
    >
      {icon}
      <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  headerText: { marginLeft: 10, flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  displayName: { fontSize: 14, fontWeight: "700" },
  timeAgo: { fontSize: 11, fontWeight: "500" },
  username: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  mediaContainer: {
    marginHorizontal: 14,
    marginBottom: 4,
    borderRadius: 12,
    overflow: "hidden",
    aspectRatio: 4 / 3,
    backgroundColor: "#000",
  },
  mediaImage: { width: "100%", height: "100%" },
  paginationDots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  textBlock: {
    marginHorizontal: 14,
    marginBottom: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  textBlockInner: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  textBlockQuote: {
    fontSize: 22,
    fontWeight: "900",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  caption: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
  },
  actionsLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionsRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionLabel: { fontSize: 12, fontWeight: "800" },
  iconBtn: { padding: 6 },
});
