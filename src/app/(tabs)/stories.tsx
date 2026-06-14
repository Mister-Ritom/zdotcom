import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, useColorScheme, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { storyService } from '@/services/storyService';
import { userService } from '@/services/userService';
import { StoryRing } from '@/components/stories/StoryRing';
import { StoryViewer } from '@/components/stories/StoryViewer';
import { type GroupedStories } from '@/types/models';

const ACCENT = '#208AEF';

export default function StoriesScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  const [friendGroups, setFriendGroups] = useState<GroupedStories[]>([]);
  const [publicGroups, setPublicGroups] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerGroups, setViewerGroups] = useState<GroupedStories[]>([]);
  const [viewerStart, setViewerStart] = useState(0);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [friends, pub] = await Promise.all([
      storyService.getStoriesForUser(user.id),
      storyService.getPublicStories(user.id),
    ]);
    // Hydrate users
    const hydrate = async (groups: GroupedStories[]) =>
      Promise.all(groups.map(async (g) => ({ ...g, user: (await userService.getById(g.userId)) ?? undefined })));
    setFriendGroups(await hydrate(friends));
    setPublicGroups(await hydrate(pub));
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const openStory = (groups: GroupedStories[], idx: number) => {
    setViewerGroups(groups);
    setViewerStart(idx);
    setViewerVisible(true);
  };

  const bg = isDark ? '#09090B' : '#F9F9F9';
  const cardBg = isDark ? '#18181B' : '#fff';
  const textColor = isDark ? '#F4F4F5' : '#18181B';
  const subColor = isDark ? '#71717A' : '#A1A1AA';

  if (loading) return <View style={[s.center, { backgroundColor: bg }]}><ActivityIndicator color={ACCENT} /></View>;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[s.header, { backgroundColor: cardBg, borderBottomColor: isDark ? '#27272A' : '#E4E4E7' }]}>
        <Text style={[s.title, { color: textColor }]}>Stories</Text>
      </View>
      <FlatList
        data={[{ key: 'friends', groups: friendGroups, title: "Friends' Stories" }, { key: 'public', groups: publicGroups, title: 'Discover' }]}
        keyExtractor={(i) => i.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        renderItem={({ item }) => {
          if (item.groups.length === 0) return null;
          return (
            <View style={s.section}>
              <Text style={[s.sectionTitle, { color: subColor }]}>{item.title}</Text>
              <FlatList
                data={item.groups}
                keyExtractor={(g) => g.userId}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
                renderItem={({ item: group, index }) => (
                  <StoryRing group={group} onPress={() => openStory(item.groups, index)} />
                )}
              />
            </View>
          );
        }}
      />
      <StoryViewer
        groups={viewerGroups}
        startGroupIndex={viewerStart}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { height: 52, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
});
