import { create } from 'zustand';
import { type ZapModel } from '@/types/models';
import { zapService } from '@/services/zapService';
import { AppLogger } from '@/utils/logger';

const PAGE_SIZE = 20;

interface FeedSlice {
  zaps: ZapModel[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  page: number;
  likedIds: Set<string>;
  resharedIds: Set<string>;
  bookmarkedIds: Set<string>;
}

const INITIAL: FeedSlice = {
  zaps: [],
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  page: 0,
  likedIds: new Set(),
  resharedIds: new Set(),
  bookmarkedIds: new Set(),
};

interface FeedStore {
  forYou: FeedSlice;
  following: FeedSlice;
  shorts: FeedSlice;

  loadForYou: (userId?: string, refresh?: boolean) => Promise<void>;
  loadMoreForYou: (userId?: string) => Promise<void>;
  loadFollowing: (userId: string, refresh?: boolean) => Promise<void>;
  loadShorts: (userId?: string, refresh?: boolean) => Promise<void>;
  loadMoreShorts: (userId?: string) => Promise<void>;

  toggleLike: (zapId: string, userId: string, isShort?: boolean) => Promise<void>;
  toggleRepost: (zapId: string, userId: string, isShort?: boolean) => Promise<void>;
  toggleBookmark: (zapId: string, userId: string) => Promise<void>;
  isLiked: (zapId: string) => boolean;
  isReshared: (zapId: string) => boolean;
  isBookmarked: (zapId: string) => boolean;
  setLiked: (zapId: string, liked: boolean) => void;
  setReshared: (zapId: string, reshared: boolean) => void;
  setBookmarked: (zapId: string, bookmarked: boolean) => void;
  incrementCommentCount: (zapId: string) => void;
  removeZap: (zapId: string) => void;
  updateZapContent: (zapId: string, text: string, mediaUrls?: string[]) => void;
  deletedIds: Set<string>;
}

// Helper: batch-fetch liked + reshared IDs for a set of zaps in parallel
async function seedInteractions(userId: string, zapIds: string[], isShort: boolean) {
  const [likedIds, resharedIds] = await Promise.all([
    zapService.getLikedZapIds(userId, zapIds, isShort),
    zapService.getResharedZapIds(userId, zapIds, isShort),
  ]);
  return { likedIds, resharedIds };
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  forYou: { ...INITIAL },
  following: { ...INITIAL },
  shorts: { ...INITIAL },
  deletedIds: new Set<string>(),

  // ── For You Feed ────────────────────────────────────────────────
  async loadForYou(userId?: string, refresh = false) {
    const slice = get().forYou;
    if (!refresh && (slice.isLoading || !slice.hasMore)) return;

    const page = refresh ? 0 : slice.page;
    set((s) => ({
      forYou: { ...s.forYou, isLoading: true, isRefreshing: refresh },
    }));

    try {
      const zaps = await zapService.getForYouFeed(false, PAGE_SIZE, page * PAGE_SIZE);
      const { likedIds, resharedIds } = userId
        ? await seedInteractions(userId, zaps.map((z) => z.id), false)
        : { likedIds: new Set<string>(), resharedIds: new Set<string>() };
      set((s) => ({
        forYou: {
          ...s.forYou,
          zaps: refresh ? zaps : [...s.forYou.zaps, ...zaps],
          isLoading: false,
          isRefreshing: false,
          hasMore: zaps.length === PAGE_SIZE,
          page: page + 1,
          likedIds: refresh ? likedIds : new Set([...s.forYou.likedIds, ...likedIds]),
          resharedIds: refresh ? resharedIds : new Set([...s.forYou.resharedIds, ...resharedIds]),
        },
      }));
    } catch (e) {
      AppLogger.error('FeedStore', 'loadForYou failed', e);
      set((s) => ({ forYou: { ...s.forYou, isLoading: false, isRefreshing: false } }));
    }
  },

  async loadMoreForYou(userId?: string) {
    return get().loadForYou(userId, false);
  },

  // ── Following Feed ───────────────────────────────────────────────
  async loadFollowing(userId, refresh = false) {
    const slice = get().following;
    if (!refresh && (slice.isLoading || !slice.hasMore)) return;

    set((s) => ({
      following: { ...s.following, isLoading: true, isRefreshing: refresh },
    }));

    try {
      const zaps = await zapService.getFollowingFeed(userId);
      const { likedIds, resharedIds } = await seedInteractions(userId, zaps.map((z) => z.id), false);
      set((s) => ({
        following: {
          ...s.following,
          zaps: refresh ? zaps : [...s.following.zaps, ...zaps],
          isLoading: false,
          isRefreshing: false,
          hasMore: false, // Following feed loads all in one shot
          page: 1,
          likedIds: refresh ? likedIds : new Set([...s.following.likedIds, ...likedIds]),
          resharedIds: refresh ? resharedIds : new Set([...s.following.resharedIds, ...resharedIds]),
        },
      }));
    } catch (e) {
      AppLogger.error('FeedStore', 'loadFollowing failed', e);
      set((s) => ({ following: { ...s.following, isLoading: false, isRefreshing: false } }));
    }
  },

  // ── Shorts Feed ─────────────────────────────────────────────────
  async loadShorts(userId?: string, refresh = false) {
    const slice = get().shorts;
    if (!refresh && (slice.isLoading || !slice.hasMore)) return;

    const page = refresh ? 0 : slice.page;
    set((s) => ({
      shorts: { ...s.shorts, isLoading: true, isRefreshing: refresh },
    }));

    try {
      const zaps = await zapService.getForYouFeed(true, PAGE_SIZE, page * PAGE_SIZE);
      const { likedIds, resharedIds } = userId
        ? await seedInteractions(userId, zaps.map((z) => z.id), true)
        : { likedIds: new Set<string>(), resharedIds: new Set<string>() };
      set((s) => ({
        shorts: {
          ...s.shorts,
          zaps: refresh ? zaps : [...s.shorts.zaps, ...zaps],
          isLoading: false,
          isRefreshing: false,
          hasMore: zaps.length === PAGE_SIZE,
          page: page + 1,
          likedIds: refresh ? likedIds : new Set([...s.shorts.likedIds, ...likedIds]),
          resharedIds: refresh ? resharedIds : new Set([...s.shorts.resharedIds, ...resharedIds]),
        },
      }));
    } catch (e) {
      AppLogger.error('FeedStore', 'loadShorts failed', e);
      set((s) => ({ shorts: { ...s.shorts, isLoading: false, isRefreshing: false } }));
    }
  },

  async loadMoreShorts(userId?: string) {
    return get().loadShorts(userId, false);
  },

  // ── Interactions ────────────────────────────────────────────────
  async toggleLike(zapId, userId, isShort = false) {
    const wasLiked = get().isLiked(zapId);
    get().setLiked(zapId, !wasLiked);
    const updateCount = (z: ZapModel) =>
      z.id === zapId ? { ...z, likesCount: z.likesCount + (wasLiked ? -1 : 1) } : z;
    set((s) => ({
      forYou: { ...s.forYou, zaps: s.forYou.zaps.map(updateCount) },
      following: { ...s.following, zaps: s.following.zaps.map(updateCount) },
      shorts: { ...s.shorts, zaps: s.shorts.zaps.map(updateCount) },
    }));
    try {
      await zapService.toggleLike(userId, zapId, isShort);
    } catch {
      get().setLiked(zapId, wasLiked);
      // Revert count
      const revertCount = (z: ZapModel) =>
        z.id === zapId ? { ...z, likesCount: z.likesCount + (wasLiked ? 1 : -1) } : z;
      set((s) => ({
        forYou: { ...s.forYou, zaps: s.forYou.zaps.map(revertCount) },
        following: { ...s.following, zaps: s.following.zaps.map(revertCount) },
        shorts: { ...s.shorts, zaps: s.shorts.zaps.map(revertCount) },
      }));
    }
  },

  async toggleRepost(zapId, userId, isShort = false) {
    const wasReshared = get().isReshared(zapId);
    get().setReshared(zapId, !wasReshared);
    const updateCount = (z: ZapModel) =>
      z.id === zapId ? { ...z, rezapsCount: z.rezapsCount + (wasReshared ? -1 : 1) } : z;
    set((s) => ({
      forYou: { ...s.forYou, zaps: s.forYou.zaps.map(updateCount) },
      following: { ...s.following, zaps: s.following.zaps.map(updateCount) },
      shorts: { ...s.shorts, zaps: s.shorts.zaps.map(updateCount) },
    }));
    try {
      await zapService.toggleRepost(userId, zapId, isShort);
    } catch {
      get().setReshared(zapId, wasReshared);
      // Revert count
      const revertCount = (z: ZapModel) =>
        z.id === zapId ? { ...z, rezapsCount: z.rezapsCount + (wasReshared ? 1 : -1) } : z;
      set((s) => ({
        forYou: { ...s.forYou, zaps: s.forYou.zaps.map(revertCount) },
        following: { ...s.following, zaps: s.following.zaps.map(revertCount) },
        shorts: { ...s.shorts, zaps: s.shorts.zaps.map(revertCount) },
      }));
    }
  },

  async toggleBookmark(zapId, userId) {
    const wasBookmarked = get().isBookmarked(zapId);
    get().setBookmarked(zapId, !wasBookmarked);
    try {
      await zapService.toggleBookmark(userId, zapId);
    } catch {
      get().setBookmarked(zapId, wasBookmarked);
    }
  },

  isLiked(zapId) {
    return (
      get().forYou.likedIds.has(zapId) ||
      get().following.likedIds.has(zapId) ||
      get().shorts.likedIds.has(zapId)
    );
  },

  isReshared(zapId) {
    return (
      get().forYou.resharedIds.has(zapId) ||
      get().following.resharedIds.has(zapId) ||
      get().shorts.resharedIds.has(zapId)
    );
  },

  isBookmarked(zapId) {
    return get().forYou.bookmarkedIds.has(zapId);
  },

  setLiked(zapId, liked) {
    set((s) => {
      const update = (slice: FeedSlice): FeedSlice => {
        const ids = new Set(slice.likedIds);
        liked ? ids.add(zapId) : ids.delete(zapId);
        return { ...slice, likedIds: ids };
      };
      return { forYou: update(s.forYou), following: update(s.following), shorts: update(s.shorts) };
    });
  },

  setReshared(zapId, reshared) {
    set((s) => {
      const update = (slice: FeedSlice): FeedSlice => {
        const ids = new Set(slice.resharedIds);
        reshared ? ids.add(zapId) : ids.delete(zapId);
        return { ...slice, resharedIds: ids };
      };
      return { forYou: update(s.forYou), following: update(s.following), shorts: update(s.shorts) };
    });
  },

  setBookmarked(zapId, bookmarked) {
    set((s) => {
      const ids = new Set(s.forYou.bookmarkedIds);
      bookmarked ? ids.add(zapId) : ids.delete(zapId);
      return { forYou: { ...s.forYou, bookmarkedIds: ids } };
    });
  },

  incrementCommentCount(zapId) {
    const updateCount = (z: ZapModel) =>
      z.id === zapId ? { ...z, commentsCount: z.commentsCount + 1 } : z;
    set((s) => ({
      forYou: { ...s.forYou, zaps: s.forYou.zaps.map(updateCount) },
      following: { ...s.following, zaps: s.following.zaps.map(updateCount) },
      shorts: { ...s.shorts, zaps: s.shorts.zaps.map(updateCount) },
    }));
  },

  removeZap(zapId) {
    set((s) => {
      const newDeletedIds = new Set(s.deletedIds);
      newDeletedIds.add(zapId);
      return {
        deletedIds: newDeletedIds,
        forYou: { ...s.forYou, zaps: s.forYou.zaps.filter((z) => z.id !== zapId) },
        following: { ...s.following, zaps: s.following.zaps.filter((z) => z.id !== zapId) },
        shorts: { ...s.shorts, zaps: s.shorts.zaps.filter((z) => z.id !== zapId) },
      };
    });
  },

  updateZapContent(zapId, text, mediaUrls) {
    const applyUpdate = (z: ZapModel) => z.id === zapId ? { ...z, text, ...(mediaUrls ? { mediaUrls } : {}) } : z;
    set((s) => ({
      forYou: { ...s.forYou, zaps: s.forYou.zaps.map(applyUpdate) },
      following: { ...s.following, zaps: s.following.zaps.map(applyUpdate) },
      shorts: { ...s.shorts, zaps: s.shorts.zaps.map(applyUpdate) },
    }));
  },
}));
