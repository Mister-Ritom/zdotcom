import { Avatar } from "@/components/common/Avatar";
import { type UserModel, type ZapModel } from "@/types/models";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Ellipsis,
  Heart,
  MessageCircle,
  Play,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACCENT = "#208AEF";

const isWebPlatform = Platform.OS === "web";
let globalMutedState = isWebPlatform; // module-level global mute state

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

interface Props {
  zap: ZapModel;
  user?: UserModel | null;
  isActive: boolean; // true when this slide is the current page
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
  onLike?: () => void;
  onComment?: () => void;
  onSend?: () => void;
  onOptions?: () => void;
  onProfilePress?: () => void;
}

export function ShortVideoPlayer({
  zap,
  user,
  isActive,
  isLiked = false,
  likesCount,
  commentsCount,
  onLike,
  onComment,
  onSend,
  onOptions,
  onProfilePress,
}: Props) {
  const videoUrl = zap.mediaUrls[0];
  const [manualPaused, setManualPaused] = useState(false);
  const [buffering, setBuffering] = useState(false);
  // On web, browsers block unmuted autoplay. Start muted and let the user unmute.
  const isWeb = Platform.OS === "web";
  const [isMuted, setIsMuted] = useState(globalMutedState);

  const [tempVisible, setTempVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const insets = useSafeAreaInsets();
  const BASE_TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 : 60;
  const bottomOffset = insets.bottom + BASE_TAB_BAR_HEIGHT + 20;

  const showControlsTemporarily = useCallback(() => {
    setTempVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setTempVisible(false);
    }, 1500); // Hide after 1.5 seconds
  }, []);

  const player = useVideoPlayer(videoUrl ?? null, (p) => {
    p.loop = true;
    p.muted = globalMutedState;
    if (Platform.OS === "web") {
      const origMount = (p as any).mountVideoView;
      if (typeof origMount === "function") {
        (p as any).mountVideoView = (video: any) => {
          if (video && typeof video.play === "function" && !video._playWrapped) {
            video._playWrapped = true;
            video.setAttribute("playsinline", "true");
            video.playsInline = true;
            const origVideoPlay = video.play.bind(video);
            video.play = () => {
              const prom = origVideoPlay();
              if (prom && typeof prom.catch === "function") {
                prom.catch((err: any) => {
                  console.warn(
                    `[ShortVideoPlayer] web video.play() promise rejected (${err?.name || "Error"}): ${err?.message}`,
                    "\nStacktrace:\n",
                    err?.stack || "No stack trace available",
                    "\nFull Error Object:",
                    err
                  );
                  // If browser blocked unmuted autoplay, fallback to muted autoplay
                  if (err?.name === "NotAllowedError" && !video.muted) {
                    console.info("[ShortVideoPlayer] Autoplay blocked without interaction. Falling back to muted autoplay.");
                    video.muted = true;
                    p.muted = true;
                    globalMutedState = true;
                    setIsMuted(true);
                    origVideoPlay().catch((e2: any) => {
                      console.warn(
                        `[ShortVideoPlayer] Fallback muted autoplay also rejected: ${e2?.message}`,
                        "\nStacktrace:\n",
                        e2?.stack
                      );
                    });
                  }
                });
              }
              return prom;
            };
          }
          return origMount.call(p, video);
        };
      }
    }
  });

  const playerRef = useRef(player);
  playerRef.current = player;

  // Play / pause driven by isActive + manualPaused
  useEffect(() => {
    if (!player) return;
    if (isActive && !manualPaused) {
      try {
        const prom = (player as any).play();
        if (prom && typeof prom.catch === "function") {
          prom.catch((err: any) => {
            console.warn(
              `[ShortVideoPlayer] useEffect player.play() promise rejected (${err?.name || "Error"}): ${err?.message}`,
              "\nStacktrace:\n",
              err?.stack || "No stack trace available",
              "\nFull Error Object:",
              err
            );
          });
        }
      } catch (e: any) {
        console.warn(
          `[ShortVideoPlayer] useEffect play() threw synchronous error (${e?.name || "Error"}): ${e?.message}`,
          "\nStacktrace:\n",
          e?.stack || "No stack trace available",
          "\nFull Error Object:",
          e
        );
      }
    } else {
      player.pause();
    }
  }, [isActive, manualPaused, player]);

  // Synchronize player muted changes back to state and update the global state
  useEffect(() => {
    if (!player) return;
    setIsMuted(player.muted);
    const sub = player.addListener("mutedChange", ({ muted }) => {
      setIsMuted(muted);
      globalMutedState = muted; // Update global state so next/other videos respect it
    });
    return () => {
      sub.remove();
    };
  }, [player]);

  // Show temporary controls on mount, active state change, or when player changes.
  // Also sync player muted state with the global muted state when this video becomes active.
  useEffect(() => {
    if (isActive) {
      showControlsTemporarily();
      if (playerRef.current) {
        playerRef.current.muted = globalMutedState;
        setIsMuted(globalMutedState);
      }
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isActive, showControlsTemporarily]);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const next = !p.muted;
    p.muted = next;
    setIsMuted(next);
    globalMutedState = next; // Update global state
    showControlsTemporarily();
    // First unmute may be blocked if user hasn't interacted — handle gracefully
    if (!next && !p.playing) {
      try {
        const promise = (p as any).play();
        if (promise && typeof promise.catch === "function") {
          promise.catch((err: any) => {
            console.warn(
              `[ShortVideoPlayer] toggleMute p.play() promise rejected (${err?.name || "Error"}): ${err?.message}`,
              "\nStacktrace:\n",
              err?.stack || "No stack trace available",
              "\nFull Error Object:",
              err
            );
          });
        }
      } catch (e: any) {
        console.warn(
          `[ShortVideoPlayer] toggleMute play() threw synchronous error (${e?.name || "Error"}): ${e?.message}`,
          "\nStacktrace:\n",
          e?.stack || "No stack trace available",
          "\nFull Error Object:",
          e
        );
      }
    }
  }, [showControlsTemporarily]);

  const togglePlayPause = useCallback(() => {
    setManualPaused((prev) => !prev);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleShare = useCallback(async () => {
    onSend?.();
  }, [onSend]);

  if (!videoUrl) return null;

  const shouldPlay = isActive && !manualPaused;

  return (
    <View
      style={styles.container}
      {...({ onMouseEnter: isWeb ? showControlsTemporarily : undefined } as any)}
    >
      {/* Video */}
      <Pressable style={styles.videoPressable} onPress={togglePlayPause}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="contain"
          nativeControls={false}
          playsInline={true}
        />
        {/* Tap-to-pause icon overlay */}
        {!shouldPlay && (
          <View style={styles.pauseOverlay}>
            <Play
              size={48}
              color="rgba(255,255,255,0.9)"
              fill="rgba(255,255,255,0.9)"
            />
          </View>
        )}
        {buffering && (
          <View style={styles.bufferOverlay}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}
      </Pressable>

      {/* Mute/unmute button — fixed at top right */}
      <TouchableOpacity
        style={[styles.muteButton, { top: isWeb ? 20 : 60 }]}
        onPress={toggleMute}
        activeOpacity={0.7}
      >
        {isMuted ? (
          <VolumeX size={18} color="#fff" strokeWidth={2.5} />
        ) : (
          <Volume2 size={18} color="#fff" strokeWidth={2.5} />
        )}
      </TouchableOpacity>

      {/* Right actions column */}
      <View style={[styles.actions, { bottom: bottomOffset }]}>
        {/* Avatar */}
        <TouchableOpacity onPress={onProfilePress} style={styles.avatarWrap}>
          <Avatar
            uri={user?.profilePictureUrl}
            name={user?.displayName ?? "?"}
            size={44}
            showBorder
          />
        </TouchableOpacity>

        <SideAction
          icon={
            <Heart
              size={26}
              color={isLiked ? "#EF4444" : "#fff"}
              fill={isLiked ? "#EF4444" : "none"}
              strokeWidth={2}
            />
          }
          label={formatCount(likesCount ?? zap.likesCount)}
          onPress={onLike}
        />
        <SideAction
          icon={<MessageCircle size={26} color="#fff" strokeWidth={2.5} />}
          label={formatCount(commentsCount ?? zap.commentsCount)}
          onPress={onComment}
        />
        <SideAction
          icon={<Send size={26} color="#fff" strokeWidth={2.5} />}
          label={formatCount(zap.sharesCount)}
          onPress={handleShare}
        />
        <SideAction
          icon={<Ellipsis size={26} color="#fff" strokeWidth={2.5} />}
          label=""
          onPress={onOptions}
        />
      </View>

      {/* Bottom overlay — creator info + caption */}
      <View style={[styles.bottomOverlay, { bottom: bottomOffset }]}>
        <TouchableOpacity onPress={onProfilePress} style={styles.creatorRow}>
          <Text style={styles.creatorName}>@{user?.username ?? "..."}</Text>
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
    <TouchableOpacity
      onPress={onPress}
      style={styles.sideAction}
      activeOpacity={0.7}
    >
      {icon}
      {label.length > 0 && <Text style={styles.sideLabel}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  videoPressable: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
  },
  muteButton: {
    position: "absolute",
    right: 16,
    zIndex: 99,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    position: "absolute",
    right: 12,
    alignItems: "center",
    gap: 16,
  },
  avatarWrap: { marginBottom: 6 },
  sideAction: { alignItems: "center", gap: 4 },
  sideLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 4,
    marginTop: 2,
  },
  bottomOverlay: {
    position: "absolute",
    left: 16,
    right: 80,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  creatorName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 6,
  },
  verifiedBadge: {
    backgroundColor: "#208AEF",
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  caption: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 6,
    fontWeight: "500",
  },
});
