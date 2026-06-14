import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, Edit3, Settings } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { userService } from '@/services/userService';
import { zapService } from '@/services/zapService';
import { type UserModel, type ZapModel } from '@/types/models';
import { Avatar } from '@/components/common/Avatar';
import { ZapCardContainer } from '@/components/feed/ZapCardContainer';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');
const ACCENT = '#208AEF';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useColorScheme() === 'dark';
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [zaps, setZaps] = useState<ZapModel[]>([]);
  const [activeTab, setActiveTab] = useState<'zaps' | 'likes' | 'shorts'>('zaps');
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      userService.getById(id),
      currentUser ? userService.isFollowing(currentUser.id, id) : Promise.resolve(false),
    ]).then(([p, following]) => {
      setProfile(p);
      setIsFollowing(following);
      setLoading(false);
    });
  }, [id, currentUser]);

  useEffect(() => {
    if (!id) return;
    if (activeTab === 'zaps') {
      zapService.getUserZaps(id, false).then(setZaps);
    } else if (activeTab === 'shorts') {
      zapService.getUserZaps(id, true).then(setZaps);
    } else {
      zapService.getUserLikedZaps(id).then(setZaps);
    }
  }, [id, activeTab]);

  const handleFollowToggle = async () => {
    if (!currentUser || !id || isOwnProfile) return;
    if (isFollowing) {
      await userService.unfollow(currentUser.id, id);
      setIsFollowing(false);
      if (profile) setProfile({ ...profile, followersCount: Math.max(0, profile.followersCount - 1) });
    } else {
      await userService.follow(currentUser.id, id);
      setIsFollowing(true);
      if (profile) setProfile({ ...profile, followersCount: profile.followersCount + 1 });
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
        <Text style={{ color: isDark ? '#FFF' : '#000' }}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#09090B' : '#FFF' }}>
      <FlatList
        data={zaps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ZapCardContainer zap={item} />}
        ListHeaderComponent={
          <View>
            {/* Cover photo */}
            <View style={styles.coverContainer}>
              {profile.coverPhotoUrl ? (
                <Image source={{ uri: profile.coverPhotoUrl }} style={styles.coverImage} contentFit="cover" />
              ) : (
                <View style={[styles.coverPlaceholder, { backgroundColor: isDark ? '#1C1917' : '#E7E5E4' }]} />
              )}

              {/* Navigation Back */}
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Profile Detail Block */}
            <View style={styles.profileDetails}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarOutline}>
                  <Avatar uri={profile.profilePictureUrl} name={profile.displayName} size={80} />
                </View>

                {/* Edit profile or Follow button */}
                {isOwnProfile ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: isDark ? '#27272A' : '#E4E4E7' }]}
                    onPress={() => router.push('/profile/edit')}
                  >
                    <Edit3 size={16} color={isDark ? '#FFF' : '#000'} />
                    <Text style={[styles.actionBtnText, { color: isDark ? '#FFF' : '#000' }]}>Edit Profile</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.followBtn, { backgroundColor: isFollowing ? 'transparent' : ACCENT, borderColor: ACCENT }]}
                    onPress={handleFollowToggle}
                  >
                    <Text style={[styles.followBtnText, { color: isFollowing ? ACCENT : '#FFF' }]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.displayName, { color: isDark ? '#FFF' : '#000' }]}>
                {profile.displayName}
                {profile.isVerified && <Text style={styles.verified}> ✓</Text>}
              </Text>
              <Text style={styles.username}>@{profile.username}</Text>

              {profile.bio && <Text style={[styles.bio, { color: isDark ? '#D4D4D8' : '#3F3F46' }]}>{profile.bio}</Text>}

              {/* Follow counters */}
              <View style={styles.statsRow}>
                <TouchableOpacity onPress={() => router.push(`/profile/following?id=${id}`)}>
                  <Text style={[styles.statText, { color: isDark ? '#FFF' : '#000' }]}>
                    {profile.followingCount} <Text style={styles.statLabel}>Following</Text>
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push(`/profile/followers?id=${id}`)}>
                  <Text style={[styles.statText, { color: isDark ? '#FFF' : '#000' }]}>
                    {profile.followersCount} <Text style={styles.statLabel}>Followers</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs Bar */}
            <View style={[styles.tabBar, { borderBottomColor: isDark ? '#1C1917' : '#E7E5E4' }]}>
              <TouchableOpacity
                onPress={() => setActiveTab('zaps')}
                style={[styles.tab, activeTab === 'zaps' && styles.activeTab]}
              >
                <Text style={[styles.tabText, { color: activeTab === 'zaps' ? ACCENT : '#888' }]}>Zaps</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('shorts')}
                style={[styles.tab, activeTab === 'shorts' && styles.activeTab]}
              >
                <Text style={[styles.tabText, { color: activeTab === 'shorts' ? ACCENT : '#888' }]}>Shorts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('likes')}
                style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
              >
                <Text style={[styles.tabText, { color: activeTab === 'likes' ? ACCENT : '#888' }]}>Likes</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: '#888' }}>No posts yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  coverContainer: { height: 160, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 50,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: { paddingHorizontal: 16, marginTop: -40 },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  avatarOutline: { borderWidth: 4, borderRadius: 44, borderColor: '#000', overflow: 'hidden' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  followBtn: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  followBtnText: { fontSize: 13, fontWeight: '700' },
  displayName: { fontSize: 22, fontWeight: '800' },
  verified: { color: ACCENT, fontWeight: '900' },
  username: { fontSize: 14, color: '#888', marginTop: 2 },
  bio: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12, marginBottom: 16 },
  statText: { fontSize: 14, fontWeight: '700' },
  statLabel: { color: '#888', fontWeight: '400' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 8 },
  tab: { flex: 1, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', paddingVertical: 12 },
  activeTab: { borderBottomColor: ACCENT },
  tabText: { fontSize: 15, fontWeight: '700' },
  empty: { padding: 40, alignItems: 'center' },
});
