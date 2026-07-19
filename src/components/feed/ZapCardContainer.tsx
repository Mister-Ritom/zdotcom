import React, { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { userService } from '@/services/userService';
import { zapService } from '@/services/zapService';
import { ZapCard } from '@/components/feed/ZapCard';
import { type ZapModel, type UserModel } from '@/types/models';
import { useOptionsSheet } from '@/contexts/OptionsSheetContext';
import { useSendSheet } from '@/contexts/SendSheetContext';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';
import { useFeedStore } from '@/stores/useFeedStore';

interface Props {
  zap: ZapModel;
  isShort?: boolean;
  onPress?: () => void;
}

export function ZapCardContainer({ zap, isShort = false, onPress }: Props) {
  const [user, setUser] = useState<UserModel | null>(null);
  const { user: authUser } = useAuthStore();
  const [bookmarked, setBookmarked] = useState(false);
  const { showOptions } = useOptionsSheet();
  const { showSend } = useSendSheet();
  const { setTabBarHidden } = useTabBarVisibility();
  const { deletedIds } = useFeedStore();

  const isDeleted = deletedIds.has(zap.id);

  // Drive liked/rezapped state and counts from the store so they are consistent
  // across remounts and reflect the seeded server state on load.
  const { toggleLike, toggleRepost } = useFeedStore();
  const liked = useFeedStore((s) => s.forYou.likedIds.has(zap.id) || s.following.likedIds.has(zap.id) || s.shorts.likedIds.has(zap.id));
  const boosted = useFeedStore((s) => s.forYou.resharedIds.has(zap.id) || s.following.resharedIds.has(zap.id) || s.shorts.resharedIds.has(zap.id));

  // Try to find the latest zap from the store if we have it, otherwise fallback to prop
  const storeZap = useFeedStore((s) =>
    [...s.forYou.zaps, ...s.following.zaps, ...s.shorts.zaps].find((z) => z.id === zap.id)
  );
  const displayZap = storeZap ?? zap;

  const likesCount = displayZap.likesCount;
  const rezapsCount = displayZap.rezapsCount;

  useEffect(() => {
    userService.getById(zap.userId).then(setUser);
  }, [zap.userId]);

  useEffect(() => {
    if (authUser?.id) {
      zapService.isBookmarked(authUser.id, zap.id).then(setBookmarked);
      
      // For zaps loaded outside the main feeds (e.g. profile), fetch state if missing
      zapService.isLiked(authUser.id, zap.id, isShort).then((res) => {
        if (res && !useFeedStore.getState().isLiked(zap.id)) {
          useFeedStore.getState().setLiked(zap.id, true);
        }
      });
      zapService.isReposted(authUser.id, zap.id, isShort).then((res) => {
        if (res && !useFeedStore.getState().isReshared(zap.id)) {
          useFeedStore.getState().setReshared(zap.id, true);
        }
      });
    }
  }, [zap.id, authUser?.id, isShort]);

  const handleLike = async () => {
    if (!authUser?.id) return;
    await toggleLike(zap.id, authUser.id, isShort);
  };

  const handleBoost = async () => {
    if (!authUser?.id) return;
    if (authUser.id === zap.userId) return; // Can't rezap own post
    await toggleRepost(zap.id, authUser.id, isShort);
  };

  const handleBookmark = async () => {
    if (!authUser?.id) return;
    const next = !bookmarked;
    setBookmarked(next);
    await zapService.toggleBookmark(authUser.id, zap.id);
  };

  const handleShare = () => {
    setTabBarHidden(true);
    showSend({
      zapId: displayZap.id,
      zapText: displayZap.text,
      onClose: () => setTabBarHidden(false),
    });
  };

  const handlePress = onPress ?? (() => {
    router.push({
      pathname: '/zap/[id]',
      params: { id: zap.id },
    });
  });

  if (isDeleted) return null;

  return (
    <ZapCard
      zap={displayZap}
      user={user}
      isLiked={liked}
      isBookmarked={bookmarked}
      isBoosted={boosted}
      likesCount={likesCount}
      rezapsCount={rezapsCount}
      disableBoost={authUser?.id === displayZap.userId}
      onPress={handlePress}
      onLike={handleLike}
      onBookmark={handleBookmark}
      onBoost={handleBoost}
      onShare={handleShare}
      onOptions={() => {
        setTabBarHidden(true);
        showOptions({
          zapId: displayZap.id,
          contentType: isShort ? 'short' : 'zap',
          isOwner: authUser?.id === displayZap.userId,
          currentText: displayZap.text,
          currentMediaUrls: displayZap.mediaUrls,
          onClose: () => setTabBarHidden(false),
        });
      }}
    />
  );
}
