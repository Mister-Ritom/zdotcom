import { ShortVideoPlayer } from "@/components/shorts/ShortVideoPlayer";
import { userService } from "@/services/userService";
import { zapService } from "@/services/zapService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFeedStore } from "@/stores/useFeedStore";
import { type UserModel, type ZapModel } from "@/types/models";
import { router } from "expo-router";
import { useEffect, useState } from "react";

interface Props {
  zap: ZapModel;
  isActive: boolean;
  onOpenComments?: () => void;
  onOpenOptions?: () => void;
  onOpenSend?: () => void;
}

export function ShortVideoContainer({
  zap,
  isActive,
  onOpenComments,
  onOpenOptions,
  onOpenSend,
}: Props) {
  const [user, setUser] = useState<UserModel | null>(null);
  const { user: authUser } = useAuthStore();

  // Drive liked state and count from the store so that:
  // 1. Optimistic updates made while scrolling survive a remount.
  // 2. The displayed count always matches what the store thinks.
  const { toggleLike } = useFeedStore();
  const liked = useFeedStore((s) => s.forYou.likedIds.has(zap.id) || s.following.likedIds.has(zap.id) || s.shorts.likedIds.has(zap.id));

  // Read the current count from the store's copy of the zap rather than the
  // stale prop — the store's toggleLike already mutates z.likesCount in place.
  const storeLikesCount = useFeedStore(
    (s) => s.shorts.zaps.find((z) => z.id === zap.id)?.likesCount ?? zap.likesCount
  );

  useEffect(() => {
    userService.getById(zap.userId).then(setUser);
  }, [zap.userId]);

  useEffect(() => {
    if (authUser?.id) {
      // For zaps loaded outside the main feeds (e.g. profile), fetch state if missing
      zapService.isLiked(authUser.id, zap.id, true).then((res) => {
        if (res && !useFeedStore.getState().isLiked(zap.id)) {
          useFeedStore.getState().setLiked(zap.id, true);
        }
      });
      zapService.isReposted(authUser.id, zap.id, true).then((res) => {
        if (res && !useFeedStore.getState().isReshared(zap.id)) {
          useFeedStore.getState().setReshared(zap.id, true);
        }
      });
    }
  }, [zap.id, authUser?.id]);

  const handleLike = async () => {
    if (!authUser?.id) return;
    await toggleLike(zap.id, authUser.id, true);
  };

  return (
    <ShortVideoPlayer
      zap={zap}
      user={user}
      isActive={isActive}
      isLiked={liked}
      likesCount={storeLikesCount}
      onLike={handleLike}
      onComment={onOpenComments}
      onSend={onOpenSend}
      onOptions={onOpenOptions}
      onProfilePress={() => {
        if (zap.userId) {
          router.push({
            pathname: "/profile/[id]",
            params: { id: zap.userId },
          });
        }
      }}
    />
  );
}
