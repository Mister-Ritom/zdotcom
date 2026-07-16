import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { StoryRing } from '@/components/stories/StoryRing';
import { storyService } from '@/services/storyService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/useAuthStore';
import { type GroupedStories } from '@/types/models';
import { StoryViewer } from '@/components/stories/StoryViewer';

export function StoriesRail() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);

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
      {groups.map((g, index) => (
        <StoryRing 
          key={g.userId} 
          group={g} 
          onPress={() => {
            setViewerStart(index);
            setViewerVisible(true);
          }} 
        />
      ))}
      <StoryViewer
        groups={groups}
        startGroupIndex={viewerStart}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
});
