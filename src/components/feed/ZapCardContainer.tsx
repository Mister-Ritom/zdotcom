import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { userService } from '@/services/userService';
import { zapService } from '@/services/zapService';
import { ZapCard } from '@/components/feed/ZapCard';
import { type ZapModel, type UserModel } from '@/types/models';
import { OptionsSheet } from '@/components/sheets/OptionsSheet';
import BottomSheet from '@gorhom/bottom-sheet';
import { useRef } from 'react';

interface Props {
  zap: ZapModel;
  isShort?: boolean;
  onPress?: () => void;
}

export function ZapCardContainer({ zap, isShort = false, onPress }: Props) {
  const [user, setUser] = useState<UserModel | null>(null);
  const { user: authUser } = useAuthStore();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(zap.likesCount);
  const [bookmarked, setBookmarked] = useState(false);
  const [boosted, setBoosted] = useState(false);
  const optionsSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    userService.getById(zap.userId).then(setUser);
  }, [zap.userId]);

  useEffect(() => {
    setLikesCount(zap.likesCount);
  }, [zap.likesCount]);

  useEffect(() => {
    if (authUser?.id) {
      zapService.isLiked(authUser.id, zap.id, isShort).then(setLiked);
      zapService.isBookmarked(authUser.id, zap.id).then(setBookmarked);
      zapService.isReposted(authUser.id, zap.id, isShort).then(setBoosted);
    }
  }, [zap.id, authUser?.id, isShort]);

  const handleLike = async () => {
    if (!authUser?.id) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => prev + (nextLiked ? 1 : -1));
    await zapService.toggleLike(authUser.id, zap.id, isShort);
  };

  const handleBoost = async () => {
    if (!authUser?.id) return;
    const nextBoosted = !boosted;
    setBoosted(nextBoosted);
    await zapService.toggleRepost(authUser.id, zap.id, isShort);
  };

  const handleBookmark = async () => {
    if (!authUser?.id) return;
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    await zapService.toggleBookmark(authUser.id, zap.id);
  };

  const handlePress = onPress ?? (() => {
    router.push({
      pathname: '/zap/[id]',
      params: { id: zap.id },
    });
  });

  // If we fetched the zap and it says 0 likes but user has liked it, show at least 1.
  const displayLikes = Math.max(likesCount, liked ? 1 : 0);

  return (
    <>
      <ZapCard
        zap={zap}
        user={user}
        isLiked={liked}
        isBookmarked={bookmarked}
        likesCount={displayLikes}
        onPress={handlePress}
        onLike={handleLike}
        onBookmark={handleBookmark}
        onBoost={handleBoost}
        onOptions={() => optionsSheetRef.current?.snapToIndex(0)}
      />
      <OptionsSheet ref={optionsSheetRef} />
    </>
  );
}
