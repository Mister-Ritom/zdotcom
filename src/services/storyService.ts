import { supabase } from '@/services/supabase';
import { AppLogger } from '@/utils/logger';
import { type StoryModel, type GroupedStories, storyFromRow } from '@/types/models';
import { userService } from '@/services/userService';

export const storyService = {
  async getStoriesForUser(currentUserId: string): Promise<GroupedStories[]> {
    try {
      // Fetch stories from followed users (24-hour window)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);
      const followingIds = (followsData ?? []).map((d) => d['following_id'] as string);

      const allIds = [...new Set([currentUserId, ...followingIds])];

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_deleted', false)
        .in('user_id', allIds)
        .gte('created_at', since)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const stories = (data ?? []).map((r) => storyFromRow(r as Record<string, unknown>));
      return groupByUser(stories);
    } catch (e) {
      AppLogger.error('StoryService', 'getStoriesForUser failed', e);
      return [];
    }
  },

  async getPublicStories(currentUserId: string): Promise<GroupedStories[]> {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_deleted', false)
        .eq('visibility', 'public')
        .gte('created_at', since)
        .neq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const stories = (data ?? []).map((r) => storyFromRow(r as Record<string, unknown>));
      return groupByUser(stories);
    } catch (e) {
      AppLogger.error('StoryService', 'getPublicStories failed', e);
      return [];
    }
  },

  async createStory(story: Partial<StoryModel>): Promise<void> {
    try {
      const payload: Record<string, any> = {
        user_id: story.userId,
        caption: story.caption,
        media_url: story.mediaUrl,
        visibility: story.visibility ?? 'public',
        is_deleted: false,
        created_at: new Date().toISOString(),
      };
      if (story.id) payload.id = story.id;

      const { error } = await supabase.from('stories').insert(payload);
      if (error) throw error;
    } catch (e) {
      AppLogger.error('StoryService', 'createStory failed', e);
      throw e;
    }
  },
};

function groupByUser(stories: StoryModel[]): GroupedStories[] {
  const map = new Map<string, StoryModel[]>();
  for (const s of stories) {
    const existing = map.get(s.userId) ?? [];
    existing.push(s);
    map.set(s.userId, existing);
  }
  return Array.from(map.entries()).map(([userId, stories]) => ({
    userId,
    stories,
    hasUnviewed: true, // TODO: track viewed state with MMKV
  }));
}
