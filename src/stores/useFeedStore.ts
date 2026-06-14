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
  bookmarkedIds: Set<string>;
}

const INITIAL: FeedSlice = {
  zaps: [],
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  page: 0,
  likedIds: new Set(),
  bookmarkedIds: new Set(),
};

interface FeedStore {
  forYou: FeedSlice;
  following: FeedSlice;
  shorts: FeedSlice;

  loadForYou: (refresh?: boolean) => Promise<void>;
  loadMoreForYou: () => Promise<void>;
  loadFollowing: (userId: string, refresh?: boolean) => Promise<void>;
  loadShorts: (refresh?: boolean) => Promise<void>;
  loadMoreShorts: () => Promise<void>;

  toggleLike: (zapId: string, userId: string, isShort?: boolean) => Promise<void>;
  toggleBookmark: (zapId: string, userId: string) => Promise<void>;
  isLiked: (zapId: string) => boolean;
  isBookmarked: (zapId: string) => boolean;
  setLiked: (zapId: string, liked: boolean) => void;
  setBookmarked: (zapId: string, bookmarked: boolean) => void;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  forYou: { ...INITIAL },
  following: { ...INITIAL },
  shorts: { ...INITIAL },

  // ── For You Feed ────────────────────────────────────────────────
  async loadForYou(refresh = false) {
    const slice = get().forYou;
    if (!refresh && (slice.isLoading || !slice.hasMore)) return;

    const page = refresh ? 0 : slice.page;
    set((s) => ({
      forYou: { ...s.forYou, isLoading: true, isRefreshing: refresh },
    }));

    try {
      const zaps = await zapService.getForYouFeed(false, PAGE_SIZE, page * PAGE_SIZE);
      set((s) => ({
        forYou: {
          ...s.forYou,
          zaps: refresh ? zaps : [...s.forYou.zaps, ...zaps],
          isLoading: false,
          isRefreshing: false,
          hasMore: zaps.length === PAGE_SIZE,
          page: page + 1,
        },
      }));
    } catch (e) {
      AppLogger.error('FeedStore', 'loadForYou failed', e);
      set((s) => ({ forYou: { ...s.forYou, isLoading: false, isRefreshing: false } }));
    }
  },

  async loadMoreForYou() {
    return get().loadForYou(false);
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
      set((s) => ({
        following: {
          ...s.following,
          zaps: refresh ? zaps : [...s.following.zaps, ...zaps],
          isLoading: false,
          isRefreshing: false,
          hasMore: false, // Following feed loads all in one shot
          page: 1,
        },
      }));
    } catch (e) {
      AppLogger.error('FeedStore', 'loadFollowing failed', e);
      set((s) => ({ following: { ...s.following, isLoading: false, isRefreshing: false } }));
    }
  },

  // ── Shorts Feed ─────────────────────────────────────────────────
  async loadShorts(refresh = false) {
    const slice = get().shorts;
    if (!refresh && (slice.isLoading || !slice.hasMore)) return;

    const page = refresh ? 0 : slice.page;
    set((s) => ({
      shorts: { ...s.shorts, isLoading: true, isRefreshing: refresh },
    }));

    try {
      const zaps = await zapService.getForYouFeed(true, PAGE_SIZE, page * PAGE_SIZE);
      set((s) => ({
        shorts: {
          ...s.shorts,
          zaps: refresh ? zaps : [...s.shorts.zaps, ...zaps],
          isLoading: false,
          isRefreshing: false,
          hasMore: zaps.length === PAGE_SIZE,
          page: page + 1,
        },
      }));
    } catch (e) {
      AppLogger.error('FeedStore', 'loadShorts failed', e);
      set((s) => ({ shorts: { ...s.shorts, isLoading: false, isRefreshing: false } }));
    }
  },

  async loadMoreShorts() {
    return get().loadShorts(false);
  },

  // ── Interactions ────────────────────────────────────────────────
  async toggleLike(zapId, userId, isShort = false) {
    const wasLiked = get().isLiked(zapId);
    // Optimistic update
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
      // Revert on failure
      get().setLiked(zapId, wasLiked);
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
    return get().forYou.likedIds.has(zapId) ||
      get().following.likedIds.has(zapId) ||
      get().shorts.likedIds.has(zapId);
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

  setBookmarked(zapId, bookmarked) {
    set((s) => {
      const ids = new Set(s.forYou.bookmarkedIds);
      bookmarked ? ids.add(zapId) : ids.delete(zapId);
      return { forYou: { ...s.forYou, bookmarkedIds: ids } };
    });
  },
}));
