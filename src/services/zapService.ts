import { supabase } from '@/services/supabase';
import { AppLogger } from '@/utils/logger';
import { type ZapModel, zapFromRow } from '@/types/models';
import uuid from 'react-native-uuid';

const ZAPS_TABLE = 'zaps';
// Shorts are stored in the same 'zaps' table, filtered by is_short = true
const SHORTS_TABLE = 'zaps';
const ZAPS_PER_PAGE = 20;

function table(_isShort: boolean) {
  return ZAPS_TABLE; // Always 'zaps'
}

export const zapService = {
  async getForYouFeed(isShort: boolean, limit = ZAPS_PER_PAGE, offset = 0): Promise<ZapModel[]> {
    try {
      const { data, error } = await supabase
        .from(table(isShort))
        .select('*')
        .eq('is_deleted', false)
        .eq('is_short', isShort)
        .is('parent_zap_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return (data ?? []).map(zapFromRow);
    } catch (e) {
      AppLogger.error('ZapService', 'getForYouFeed failed', e);
      return [];
    }
  },

  async getFollowingFeed(userId: string, isShort = false, limit = ZAPS_PER_PAGE): Promise<ZapModel[]> {
    try {
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      if (followsError) throw followsError;
      const followingIds = (followsData ?? []).map((d) => d['following_id'] as string);
      if (followingIds.length === 0) return [];

      const { data, error } = await supabase
        .from(table(isShort))
        .select('*')
        .eq('is_deleted', false)
        .eq('is_short', isShort)
        .is('parent_zap_id', null)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map(zapFromRow);
    } catch (e) {
      AppLogger.error('ZapService', 'getFollowingFeed failed', e);
      return [];
    }
  },

  async toggleLike(userId: string, zapId: string, isShort = false): Promise<void> {
    try {
      const targetType = isShort ? 'short' : 'zap';
      const { data: existing } = await supabase
        .from('user_interactions')
        .select('liked')
        .eq('user_id', userId)
        .eq('target_id', zapId)
        .eq('target_type', targetType)
        .maybeSingle();

      if (existing?.liked) {
        await supabase
          .from('user_interactions')
          .update({ liked: false })
          .eq('user_id', userId)
          .eq('target_id', zapId)
          .eq('target_type', targetType);
        await supabase.rpc('increment_counter', {
          p_table: table(isShort),
          p_column: 'likes_count',
          p_id: zapId,
          p_amount: -1,
        });
      } else {
        await supabase.from('user_interactions').upsert({
          user_id: userId,
          target_id: zapId,
          target_type: targetType,
          liked: true,
          liked_at: new Date().toISOString(),
        });
        await supabase.rpc('increment_counter', {
          p_table: table(isShort),
          p_column: 'likes_count',
          p_id: zapId,
          p_amount: 1,
        });
      }
    } catch (e) {
      AppLogger.error('ZapService', 'toggleLike failed', e);
    }
  },

  async isLiked(userId: string, zapId: string, isShort = false): Promise<boolean> {
    try {
      const targetType = isShort ? 'short' : 'zap';
      const { data } = await supabase
        .from('user_interactions')
        .select('liked')
        .eq('user_id', userId)
        .eq('target_id', zapId)
        .eq('target_type', targetType)
        .maybeSingle();
      return data?.liked === true;
    } catch {
      return false;
    }
  },

  async toggleBookmark(userId: string, zapId: string): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('zap_id', zapId)
        .maybeSingle();
      if (existing) {
        await supabase.from('bookmarks').delete().eq('user_id', userId).eq('zap_id', zapId);
      } else {
        await supabase.from('bookmarks').upsert({ user_id: userId, zap_id: zapId });
      }
    } catch (e) {
      AppLogger.error('ZapService', 'toggleBookmark failed', e);
    }
  },

  async isBookmarked(userId: string, zapId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('zap_id', zapId)
        .maybeSingle();
      return data !== null;
    } catch {
      return false;
    }
  },

  async isReposted(userId: string, zapId: string, isShort = false): Promise<boolean> {
    try {
      const targetType = isShort ? 'short' : 'zap';
      const { data } = await supabase
        .from('user_interactions')
        .select('reshared')
        .eq('user_id', userId)
        .eq('target_id', zapId)
        .eq('target_type', targetType)
        .maybeSingle();
      return data?.reshared === true;
    } catch {
      return false;
    }
  },

  async toggleRepost(userId: string, zapId: string, isShort = false): Promise<void> {
    try {
      const targetType = isShort ? 'short' : 'zap';
      const { data: existing } = await supabase
        .from('user_interactions')
        .select('reshared')
        .eq('user_id', userId)
        .eq('target_id', zapId)
        .eq('target_type', targetType)
        .maybeSingle();
      const isReshared = existing?.reshared === true;
      await supabase.from('user_interactions').upsert({
        user_id: userId,
        target_id: zapId,
        target_type: targetType,
        reshared: !isReshared,
        reshared_at: new Date().toISOString(),
      });
      await supabase.rpc('increment_counter', {
        p_table: table(isShort),
        p_column: 'rezaps_count',
        p_id: zapId,
        p_amount: isReshared ? -1 : 1,
      });
    } catch (e) {
      AppLogger.error('ZapService', 'toggleRepost failed', e);
    }
  },

  async incrementShares(zapId: string, isShort = false): Promise<void> {
    try {
      await supabase.rpc('increment_counter', {
        p_table: table(isShort),
        p_column: 'shares_count',
        p_id: zapId,
        p_amount: 1,
      });
    } catch (e) {
      AppLogger.error('ZapService', 'incrementShares failed', e);
    }
  },

  async getComments(postId: string, limit = 20, offset = 0): Promise<Record<string, unknown>[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data ?? [];
    } catch (e) {
      AppLogger.error('ZapService', 'getComments failed', e);
      return [];
    }
  },

  async addComment(postId: string, userId: string, text: string): Promise<void> {
    try {
      await supabase.from('comments').insert({ post_id: postId, user_id: userId, text });
      await supabase.rpc('increment_counter', {
        p_table: 'zaps',
        p_column: 'comments_count',
        p_id: postId,
        p_amount: 1,
      });
      await supabase.rpc('increment_counter', {
        p_table: 'shorts',
        p_column: 'comments_count',
        p_id: postId,
        p_amount: 1,
      });
    } catch (e) {
      AppLogger.error('ZapService', 'addComment failed', e);
      throw e;
    }
  },

  async getUserZaps(userId: string, isShort = false): Promise<ZapModel[]> {
    try {
      const { data, error } = await supabase
        .from('zaps')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .eq('is_short', isShort)
        .is('parent_zap_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(zapFromRow);
    } catch (e) {
      AppLogger.error('ZapService', 'getUserZaps failed', e);
      return [];
    }
  },

  async getUserLikedZaps(userId: string): Promise<ZapModel[]> {
    try {
      const { data: interactionData, error: interactionError } = await supabase
        .from('user_interactions')
        .select('target_id')
        .eq('user_id', userId)
        .eq('liked', true)
        .eq('target_type', 'zap');
      if (interactionError) throw interactionError;
      const targetIds = (interactionData ?? []).map((d) => d['target_id'] as string);
      if (targetIds.length === 0) return [];

      const { data, error } = await supabase
        .from('zaps')
        .select('*')
        .eq('is_deleted', false)
        .in('id', targetIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(zapFromRow);
    } catch (e) {
      AppLogger.error('ZapService', 'getUserLikedZaps failed', e);
      return [];
    }
  },

  async createZap(zap: Partial<ZapModel>): Promise<void> {
    try {
      const id = zap.id || (uuid.v4() as string);
      const payload: Record<string, any> = {
        id,
        user_id: zap.userId,
        text: zap.text,
        media_urls: zap.mediaUrls ?? [],
        is_short: zap.isShort ?? false,
        is_thread: zap.isThread ?? false,
        privacy: zap.privacy ?? 'public',
        parent_zap_id: zap.parentZapId ?? null,
        quoted_zap_id: zap.quotedZapId ?? null,
        is_deleted: false,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('zaps').insert(payload);
      if (error) throw error;
      
      // Increment user's zaps count just like Flutter app did
      await supabase.rpc('increment_counter', {
        p_table: 'profiles',
        p_column: 'zaps_count',
        p_id: zap.userId,
        p_amount: 1,
      });
    } catch (e) {
      AppLogger.error('ZapService', 'createZap failed', e);
      throw e;
    }
  },

  async getZapById(zapId: string): Promise<ZapModel | null> {
    try {
      const { data, error } = await supabase
        .from('zaps')
        .select('*')
        .eq('id', zapId)
        .eq('is_deleted', false)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return zapFromRow(data as Record<string, unknown>);
    } catch (e) {
      AppLogger.error('ZapService', 'getZapById failed', e);
      return null;
    }
  },

  async getZapReplies(zapId: string): Promise<ZapModel[]> {
    try {
      const { data, error } = await supabase
        .from('zaps')
        .select('*')
        .eq('parent_zap_id', zapId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(zapFromRow);
    } catch (e) {
      AppLogger.error('ZapService', 'getZapReplies failed', e);
      return [];
    }
  },

  async getBookmarkedZaps(userId: string): Promise<ZapModel[]> {
    try {
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('zap_id')
        .eq('user_id', userId);
      if (bookmarkError) throw bookmarkError;
      const zapIds = (bookmarkData ?? []).map((d) => d['zap_id'] as string);
      if (zapIds.length === 0) return [];

      const { data, error } = await supabase
        .from('zaps')
        .select('*')
        .eq('is_deleted', false)
        .in('id', zapIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(zapFromRow);
    } catch (e) {
      AppLogger.error('ZapService', 'getBookmarkedZaps failed', e);
      return [];
    }
  },
};
