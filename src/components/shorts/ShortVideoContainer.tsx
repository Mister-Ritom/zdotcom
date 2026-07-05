import { ShortVideoPlayer } from "@/components/shorts/ShortVideoPlayer";
import { userService } from "@/services/userService";
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
  const { isLiked, toggleLike } = useFeedStore();
  const liked = isLiked(zap.id);

  // Read the current count from the store's copy of the zap rather than the
  // stale prop — the store's toggleLike already mutates z.likesCount in place.
  const storeLikesCount = useFeedStore(
    (s) => s.shorts.zaps.find((z) => z.id === zap.id)?.likesCount ?? zap.likesCount
  );

  useEffect(() => {
    userService.getById(zap.userId).then(setUser);
  }, [zap.userId]);

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
