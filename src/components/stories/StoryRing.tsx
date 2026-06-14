import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { type GroupedStories } from '@/types/models';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  group?: GroupedStories;
  // If no group — it's the "Your Story" add button
  isAddButton?: boolean;
  currentUserAvatar?: string;
  currentUserName?: string;
  onPress: () => void;
}

export function StoryRing({ group, isAddButton = false, currentUserAvatar, currentUserName, onPress }: Props) {
  const isDark = useColorScheme() === 'dark';
  const name = isAddButton ? (currentUserName ?? 'You') : (group?.stories?.[0]?.caption ? group.userId.slice(0, 8) : group?.userId.slice(0, 8) ?? '');
  const avatarUri = isAddButton ? currentUserAvatar : group?.user?.profilePictureUrl;
  const label = isAddButton ? 'Your Story' : (group?.user?.username ?? name);
  const hasUnviewed = !isAddButton && (group?.hasUnviewed ?? false);

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <View style={[styles.ring, hasUnviewed && styles.ringActive]}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: isDark ? '#3F3F46' : '#D4D4D8', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#A1A1AA' : '#71717A' }}>
              {label.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        {isAddButton && (
          <View style={styles.addBadge}>
            <Plus size={10} color="#fff" strokeWidth={3} />
          </View>
        )}
      </View>
      <Text
        style={[styles.label, { color: isDark ? '#A1A1AA' : '#52525B' }]}
        numberOfLines={1}
      >
        {isAddButton ? 'Your Story' : label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 70 },
  ring: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#3F3F46',
    padding: 2,
    marginBottom: 4,
  },
  ringActive: { borderColor: '#208AEF' },
  avatar: { width: '100%', height: '100%', borderRadius: 26, overflow: 'hidden' },
  addBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#208AEF',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  label: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
