import { supabase } from '@/services/supabase';
import { AppLogger } from '@/utils/logger';
import { type UserModel, userFromRow } from '@/types/models';

// Cache users in memory for the session
const userCache = new Map<string, UserModel>();

export const userService = {
  async getById(userId: string): Promise<UserModel | null> {
    if (userCache.has(userId)) return userCache.get(userId)!;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const user = userFromRow(data as Record<string, unknown>);
      userCache.set(userId, user);
      return user;
    } catch (e) {
      AppLogger.error('UserService', 'getById failed', e);
      return null;
    }
  },

  async follow(followerId: string, followingId: string): Promise<void> {
    try {
      await supabase.from('follows').upsert({ follower_id: followerId, following_id: followingId });
    } catch (e) {
      AppLogger.error('UserService', 'follow failed', e);
    }
  },

  async unfollow(followerId: string, followingId: string): Promise<void> {
    try {
      await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
    } catch (e) {
      AppLogger.error('UserService', 'unfollow failed', e);
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();
      return data !== null;
    } catch {
      return false;
    }
  },

  async updateProfile(
    userId: string,
    updates: { displayName?: string; bio?: string; profilePictureUrl?: string; coverPhotoUrl?: string; messagePreference?: string }
  ): Promise<void> {
    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.displayName !== undefined) payload['display_name'] = updates.displayName;
      if (updates.bio !== undefined) payload['bio'] = updates.bio;
      if (updates.profilePictureUrl !== undefined) payload['profile_picture_url'] = updates.profilePictureUrl;
      if (updates.coverPhotoUrl !== undefined) payload['cover_photo_url'] = updates.coverPhotoUrl;
      if (updates.messagePreference !== undefined) payload['message_preference'] = updates.messagePreference;

      const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
      if (error) throw error;
      userCache.delete(userId);
    } catch (e) {
      AppLogger.error('UserService', 'updateProfile failed', e);
      throw e;
    }
  },

  async getByUsername(username: string): Promise<UserModel | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return userFromRow(data as Record<string, unknown>);
    } catch (e) {
      AppLogger.error('UserService', 'getByUsername failed', e);
      return null;
    }
  },

  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (error) throw error;
      return data === null;
    } catch {
      return false;
    }
  },

  async getUserFollowers(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);
      if (error) throw error;
      return (data ?? []).map((d) => d['follower_id'] as string);
    } catch (e) {
      AppLogger.error('UserService', 'getUserFollowers failed', e);
      return [];
    }
  },

  async getUserFollowing(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      if (error) throw error;
      return (data ?? []).map((d) => d['following_id'] as string);
    } catch (e) {
      AppLogger.error('UserService', 'getUserFollowing failed', e);
      return [];
    }
  },

  async searchUsers(query: string): Promise<UserModel[]> {
    try {
      if (!query.trim()) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);
      if (error) throw error;
      return (data ?? []).map((d) => userFromRow(d as Record<string, unknown>));
    } catch (e) {
      AppLogger.error('UserService', 'searchUsers failed', e);
      return [];
    }
  },

  clearCache() {
    userCache.clear();
  },
};
