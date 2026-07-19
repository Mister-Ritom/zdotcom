import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Search } from 'lucide-react-native';
import { StoriesRail } from './stories/StoriesRail';
import { userService } from '@/services/userService';
import { type UserModel } from '@/types/models';
import { Avatar } from './common/Avatar';
import { router } from 'expo-router';

export function RightSidebar({ showStories = false }: { showStories?: boolean }) {
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#27272A' : '#F4F4F5'; // slightly lighter than pure black for search bar
  const textColor = isDark ? '#F4F4F5' : '#18181B';
  const subText = isDark ? '#A1A1AA' : '#71717A';
  
  const [suggestedUsers, setSuggestedUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetching suggested users by searching for a common letter
    let mounted = true;
    userService.searchUsers('a').then(users => {
      if (mounted) {
        setSuggestedUsers(users.slice(0, 3));
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      {/* Search Bar Placeholder */}
      <View style={[styles.searchBar, { backgroundColor: bg }]}>
        <Search size={18} color={subText} />
        <Text style={[styles.searchText, { color: subText }]}>Search Z...</Text>
      </View>

      {/* Stories Rail */}
      {showStories && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 12 }]}>Stories</Text>
          <StoriesRail />
        </View>
      )}

      {/* Suggested Users */}
      <View style={[styles.cardSection, { backgroundColor: isDark ? '#000' : '#FFF', borderColor: isDark ? '#27272A' : '#E4E4E7' }]}>
        <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 16 }]}>Who to follow</Text>
        
        {loading ? (
          <ActivityIndicator size="small" color="#208AEF" />
        ) : (
          suggestedUsers.map(user => (
            <TouchableOpacity 
              key={user.id} 
              style={styles.userRow}
              onPress={() => router.push(`/profile/${user.id}`)}
              activeOpacity={0.7}
            >
              <Avatar uri={user.profilePictureUrl} name={user.displayName} size={40} />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>{user.displayName}</Text>
                <Text style={[styles.userHandle, { color: subText }]} numberOfLines={1}>@{user.username}</Text>
              </View>
              <TouchableOpacity style={styles.followBtn} activeOpacity={0.7}>
                <Text style={styles.followBtnText}>Follow</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Trending Topics Placeholder */}
      <View style={[styles.cardSection, { backgroundColor: isDark ? '#000' : '#FFF', borderColor: isDark ? '#27272A' : '#E4E4E7' }]}>
        <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 16 }]}>Trending for you</Text>
        
        {[
          { tag: 'Technology', count: '12.4K Zaps' },
          { tag: 'React Native', count: '5.2K Zaps' },
          { tag: 'Web Design', count: '2.1K Zaps' },
        ].map((trend, i) => (
          <TouchableOpacity key={i} style={styles.trendRow} activeOpacity={0.7}>
            <View style={styles.trendInfo}>
              <Text style={[styles.trendHandle, { color: subText }]}>Trending in Tech</Text>
              <Text style={[styles.trendName, { color: textColor }]}>#{trend.tag}</Text>
              <Text style={[styles.trendHandle, { color: subText }]}>{trend.count}</Text>
            </View>
            <TouchableOpacity hitSlop={10}>
              <Text style={{ color: subText, fontSize: 16, fontWeight: '700' }}>⋯</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    paddingRight: 16,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    gap: 12,
  },
  searchText: {
    fontSize: 15,
  },
  section: {
    // No background or border
  },
  cardSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  userHandle: {
    fontSize: 14,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followBtnText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 13,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trendInfo: {
    gap: 3,
  },
  trendName: {
    fontSize: 15,
    fontWeight: '700',
  },
  trendHandle: {
    fontSize: 13,
  },
});
