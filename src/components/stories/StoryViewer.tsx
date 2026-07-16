import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  StatusBar,
  Animated,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ellipsis, X } from 'lucide-react-native';
import { Avatar } from '@/components/common/Avatar';
import { type GroupedStories, type StoryModel, type UserModel } from '@/types/models';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOptionsSheet } from '@/contexts/OptionsSheetContext';

const { width: W, height: H } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds each

interface Props {
  groups: GroupedStories[];
  startGroupIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export function StoryViewer({ groups, startGroupIndex = 0, visible, onClose }: Props) {
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [users, setUsers] = useState<Map<string, UserModel>>(new Map());
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof Animated.timing> | null>(null);
  const { user: authUser } = useAuthStore();
  const { showOptions } = useOptionsSheet();

  const currentGroup = groups[groupIndex];
  const currentStory: StoryModel | undefined = currentGroup?.stories[storyIndex];
  const currentUser = users.get(currentGroup?.userId ?? '');
  const isOwner = authUser?.id === currentGroup?.userId;

  // Pre-fetch users
  useEffect(() => {
    groups.forEach(async (g) => {
      if (!users.has(g.userId)) {
        const u = await userService.getById(g.userId);
        if (u) setUsers((prev) => new Map(prev).set(g.userId, u));
      }
    });
  }, [groups]);

  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    timerRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    timerRef.current.start(({ finished }) => {
      if (finished) advance();
    });
  }, [progressAnim, storyIndex, groupIndex]);

  useEffect(() => {
    if (visible && currentStory) {
      startProgress();
    }
    return () => {
      timerRef.current?.stop();
    };
  }, [visible, storyIndex, groupIndex]);

  const advance = useCallback(() => {
    timerRef.current?.stop();
    const stories = currentGroup?.stories ?? [];
    if (storyIndex < stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [storyIndex, groupIndex, groups, currentGroup, onClose]);

  const retreat = useCallback(() => {
    timerRef.current?.stop();
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((g) => g - 1);
      setStoryIndex(0);
    } else {
      progressAnim.setValue(0);
      startProgress();
    }
  }, [storyIndex, groupIndex, progressAnim, startProgress]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Blurred Background image */}
        {currentStory && (
          <Image
            source={{ uri: currentStory.mediaUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={50}
          />
        )}
        {/* Foreground complete image */}
        {currentStory && (
          <Image
            source={{ uri: currentStory.mediaUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />
        )}
        <View style={[StyleSheet.absoluteFill, styles.scrim]} />

        {/* Progress bars */}
        <View style={styles.progressBars}>
          {(currentGroup?.stories ?? []).map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width:
                      i < storyIndex
                        ? '100%'
                        : i === storyIndex
                        ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Top bar */}
        <View style={styles.topBar}>
          <Avatar
            uri={currentUser?.profilePictureUrl}
            name={currentUser?.displayName ?? '?'}
            size={36}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{currentUser?.username ?? '...'}</Text>
            {currentStory && (
              <Text style={styles.time}>
                {Math.floor((Date.now() - currentStory.createdAt.getTime()) / 60000)}m ago
              </Text>
            )}
          </View>
          <View style={styles.topBarActions}>
            {isOwner && currentStory && (
              <TouchableOpacity
                onPress={() => {
                  showOptions({
                    zapId: currentStory.id,
                    contentType: 'story',
                    isOwner: true,
                    currentText: currentStory.caption,
                    onClose: onClose,
                  });
                }}
                hitSlop={16}
                style={styles.topBarBtn}
              >
                <Ellipsis size={22} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} hitSlop={16} style={styles.topBarBtn}>
              <X size={24} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Caption */}
        {currentStory?.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{currentStory.caption}</Text>
          </View>
        )}

        {/* Tap zones: left = back, right = forward */}
        <View style={styles.tapZones}>
          <TouchableWithoutFeedback onPress={retreat}>
            <View style={styles.tapLeft} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={advance}>
            <View style={styles.tapRight} />
          </TouchableWithoutFeedback>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrim: { backgroundColor: 'rgba(0,0,0,0.2)' },
  progressBars: {
    position: 'absolute',
    top: 52,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 3,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  topBarBtn: { padding: 4 },
  userInfo: { flex: 1 },
  username: { color: '#fff', fontWeight: '700', fontSize: 14 },
  time: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  captionContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 8,
    lineHeight: 22,
  },
  tapZones: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    top: 100,
    zIndex: 5,
  },
  tapLeft: { flex: 1 },
  tapRight: { flex: 2 },
});
