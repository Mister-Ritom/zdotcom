import { ShortVideoPlayer } from "@/components/shorts/ShortVideoPlayer";
import { userService } from "@/services/userService";
import { zapService } from "@/services/zapService";
import { useAuthStore } from "@/stores/useAuthStore";
import { type UserModel, type ZapModel } from "@/types/models";
import { router } from "expo-router";
import { useEffect, useState } from "react";

interface Props {
  zap: ZapModel;
  isActive: boolean;
  onOpenComments?: () => void;
  onOpenOptions?: () => void;
}

export function ShortVideoContainer({
  zap,
  isActive,
  onOpenComments,
  onOpenOptions,
}: Props) {
  const [user, setUser] = useState<UserModel | null>(null);
  const { user: authUser } = useAuthStore();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(zap.likesCount);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    userService.getById(zap.userId).then(setUser);
  }, [zap.userId]);

  useEffect(() => {
    if (authUser?.id) {
      zapService.isLiked(authUser.id, zap.id, true).then(setLiked);
      zapService.isBookmarked(authUser.id, zap.id).then(setBookmarked);
    }
  }, [zap.id, authUser?.id]); // Intentionally omitting zap.likesCount to avoid resetting optimistic updates

  const handleLike = async () => {
    if (!authUser?.id) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => prev + (nextLiked ? 1 : -1));
    await zapService.toggleLike(authUser.id, zap.id, true);
  };

  const handleBookmark = async () => {
    if (!authUser?.id) return;
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    await zapService.toggleBookmark(authUser.id, zap.id);
  };

  return (
    <ShortVideoPlayer
      zap={zap}
      user={user}
      isActive={isActive}
      isLiked={liked}
      isBookmarked={bookmarked}
      likesCount={likesCount}
      onLike={handleLike}
      onBookmark={handleBookmark}
      onComment={onOpenComments}
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
