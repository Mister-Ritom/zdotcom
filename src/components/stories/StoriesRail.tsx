import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { StoryRing } from '@/components/stories/StoryRing';
import { storyService } from '@/services/storyService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/useAuthStore';
import { type GroupedStories } from '@/types/models';

export function StoriesRail() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    storyService.getStoriesForUser(user.id).then(async (groups) => {
      // Fetch user info for each group
      const enriched = await Promise.all(
        groups.map(async (g) => ({
          ...g,
          user: (await userService.getById(g.userId)) ?? undefined,
        }))
      );
      setGroups(enriched);
      setLoading(false);
    });
  }, [user?.id]);

  if (loading) return <ActivityIndicator style={{ margin: 16 }} />;
  if (groups.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {/* Add story button */}
      <StoryRing isAddButton onPress={() => { /* navigate to create story */ }} />
      {groups.map((g) => (
        <StoryRing key={g.userId} group={g} onPress={() => { /* navigate to story viewer */ }} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
});
