import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, FileText, Zap, Film, X, Video, Image as ImageIcon } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { zapService } from '@/services/zapService';
import { storyService } from '@/services/storyService';
import { runPostUpdateJob } from '@/services/storageService';
import { useFeedStore } from '@/stores/useFeedStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUploadStore } from '@/stores/useUploadStore';
import { AppLogger } from '@/utils/logger';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

const TAG = 'EditingScreen';
const ACCENT = '#208AEF';

type ContentType = 'zap' | 'short' | 'story';

interface SelectedMedia {
  uri: string;
  isRemote: boolean;
  type: 'image' | 'video';
}

const LABELS: Record<ContentType, { title: string; placeholder: string; hint: string; icon: React.ComponentType<any> }> = {
  zap: {
    title: 'Edit Post',
    placeholder: "What's on your mind?",
    hint: 'Edit your post text and media.',
    icon: FileText,
  },
  short: {
    title: 'Edit Short',
    placeholder: 'Add a caption…',
    hint: 'Edit the caption for your short video. Media cannot be changed.',
    icon: Film,
  },
  story: {
    title: 'Edit Story',
    placeholder: 'Add a caption…',
    hint: 'Edit the caption on your story. Media cannot be changed.',
    icon: Zap,
  },
};

export default function EditingScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user: authUser } = useAuthStore();
  const { id, type, text: initialText, mediaUrls } = useLocalSearchParams<{
    id: string;
    type: ContentType;
    text: string;
    mediaUrls: string;
  }>();

  const contentType: ContentType = (['zap', 'short', 'story'].includes(type) ? type : 'zap') as ContentType;
  const label = LABELS[contentType];
  const Icon = label.icon;

  const [text, setText] = useState(initialText ?? '');
  const [mediaItems, setMediaItems] = useState<SelectedMedia[]>([]);
  const [initialMediaItems, setInitialMediaItems] = useState<SelectedMedia[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { updateZapContent } = useFeedStore();

  useEffect(() => {
    if (mediaUrls) {
      try {
        const parsed = JSON.parse(mediaUrls) as string[];
        const items = parsed.map((url) => ({
          uri: url,
          isRemote: true,
          type: (url.includes('.mp4') || url.includes('.mov')) ? 'video' as const : 'image' as const,
        }));
        setMediaItems(items);
        setInitialMediaItems(items);
      } catch (e) {
        AppLogger.error(TAG, 'Failed to parse initial mediaUrls', e);
      }
    }
  }, [mediaUrls]);

  const bg = isDark ? '#09090B' : '#FFF';
  const cardBg = isDark ? '#18181B' : '#F9F9F9';
  const border = isDark ? '#27272A' : '#E4E4E7';
  const textColor = isDark ? '#FFF' : '#09090B';
  const subColor = isDark ? '#71717A' : '#A1A1AA';
  const charCount = text.length;

  const isTextChanged = text.trim() !== (initialText ?? '').trim();
  const isMediaChanged = contentType === 'zap' && (
    mediaItems.length !== initialMediaItems.length ||
    mediaItems.some((m, i) => m.uri !== initialMediaItems[i]?.uri)
  );
  const isChanged = isTextChanged || isMediaChanged;

  const handleSave = async () => {
    if (!id || !authUser) {
      Alert.alert('Error', 'Missing ID or unauthenticated.');
      return;
    }
    if (!isChanged) {
      router.back();
      return;
    }

    setIsSaving(true);
    try {
      if (contentType === 'story') {
        await storyService.updateStory(id, text.trim());
        AppLogger.info(TAG, `Story ${id} caption updated`);
        router.back();
      } else if (contentType === 'short') {
        await zapService.updateZap(id, text.trim());
        updateZapContent(id, text.trim());
        AppLogger.info(TAG, `Short ${id} text updated`);
        router.back();
      } else {
        const hasNewMedia = mediaItems.some(m => !m.isRemote);
        if (hasNewMedia) {
          // Use background upload job because we have local files to upload
          const jobId = `${Date.now()}_update_${Math.random().toString(36).slice(2, 7)}`;
          useUploadStore.getState().addJob({ id: jobId, type: 'post', label: 'Updating Post...' });
          // Fire and forget
          runPostUpdateJob({
            type: 'update_post',
            jobId,
            userId: authUser.id,
            zapId: id,
            text: text.trim(),
            mediaItems: mediaItems.map(m => ({ uri: m.uri, isRemote: m.isRemote }))
          });
          router.replace('/(tabs)');
        } else {
          // Fast path: only text/media removals, sync execution
          const validUrls = mediaItems.map(m => m.uri);
          await zapService.updateZap(id, text.trim(), validUrls);
          updateZapContent(id, text.trim(), validUrls);
          AppLogger.info(TAG, `Zap ${id} text and remote media updated synchronously`);
          router.back();
        }
      }
    } catch (err) {
      AppLogger.error(TAG, 'Failed to save edits', err);
      Alert.alert('Save Failed', 'Could not save your changes. Please try again.');
      setIsSaving(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your media library.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.85,
        allowsMultipleSelection: true,
      });
      if (!result.canceled && result.assets) {
        const newItems = result.assets.map(asset => ({
          uri: asset.uri,
          isRemote: false,
          type: asset.type === 'video' ? ('video' as const) : ('image' as const)
        }));
        setMediaItems(prev => [...prev, ...newItems]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select media.');
    }
  };

  const pickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera access.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        const newItem = {
          uri: asset.uri,
          isRemote: false,
          type: asset.type === 'video' ? ('video' as const) : ('image' as const)
        };
        setMediaItems(prev => [...prev, newItem]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture media.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={textColor} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Icon size={16} color={ACCENT} strokeWidth={2.5} />
          <Text style={[styles.headerTitle, { color: textColor }]}>{label.title}</Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveBtn,
            { backgroundColor: isChanged ? ACCENT : isDark ? '#27272A' : '#E4E4E7' },
          ]}
          activeOpacity={0.8}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, { color: isChanged ? '#fff' : subColor }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Content type badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isDark ? '#1C2A3A' : '#EFF6FF', borderColor: isDark ? '#1D4ED8' : '#BFDBFE' }]}>
              <Icon size={13} color={ACCENT} strokeWidth={2.5} />
              <Text style={[styles.badgeText, { color: ACCENT }]}>
                Editing {contentType === 'zap' ? 'Post' : contentType === 'short' ? 'Short' : 'Story'}
              </Text>
            </View>
          </View>

          {/* Text editor card */}
          <View style={[styles.editorCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={[styles.editorAccentStrip, { backgroundColor: ACCENT }]} />

            <TextInput
              ref={inputRef}
              style={[styles.textArea, { color: textColor }]}
              value={text}
              onChangeText={setText}
              placeholder={label.placeholder}
              placeholderTextColor={subColor}
              multiline
              textAlignVertical="top"
              selectionColor={ACCENT}
            />

            {/* Media previews for Zaps */}
            {contentType === 'zap' && mediaItems.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaScroll}>
                {mediaItems.map((item, idx) => (
                  <View key={`${item.uri}-${idx}`} style={styles.mediaItemWrap}>
                    <Image source={{ uri: item.uri }} style={styles.mediaItemPreview} contentFit="cover" />
                    <TouchableOpacity
                      style={styles.removeMediaItem}
                      onPress={() => setMediaItems(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <X size={16} color="#FFF" />
                    </TouchableOpacity>
                    {item.type === 'video' && (
                      <View style={styles.videoBadge}>
                        <Video size={12} color="#FFF" />
                        <Text style={styles.videoBadgeText}>Video</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Char count & media tools */}
            <View style={[styles.editorFooter, { borderTopColor: border }]}>
              <View style={styles.footerLeft}>
                <Text style={[styles.charCount, { color: charCount > 500 ? '#EF4444' : subColor }]}>
                  {charCount} {charCount > 500 && '— too long'}
                </Text>
                {isChanged && (
                  <View style={styles.changedBadge}>
                    <CheckCircle2 size={12} color="#10B981" strokeWidth={2.5} />
                    <Text style={styles.changedText}>Edited</Text>
                  </View>
                )}
              </View>

              {contentType === 'zap' && (
                <View style={styles.mediaAddBtns}>
                  <TouchableOpacity onPress={pickImage} style={styles.addBtn}>
                    <ImageIcon size={20} color={ACCENT} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={pickCamera} style={styles.addBtn}>
                    <Video size={20} color={ACCENT} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Hint */}
          <View style={[styles.hintCard, { backgroundColor: isDark ? '#1A1A1A' : '#FAFAFA', borderColor: border }]}>
            <Text style={[styles.hintTitle, { color: subColor }]}>Note</Text>
            <Text style={[styles.hintText, { color: subColor }]}>{label.hint}</Text>
          </View>

          {/* Discard button */}
          {isChanged && (
            <TouchableOpacity
              style={[styles.discardBtn, { borderColor: '#EF4444' }]}
              onPress={() => {
                Alert.alert('Discard changes?', 'Your edits will not be saved.', [
                  { text: 'Keep editing', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: () => router.back() },
                ]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.discardText}>Discard Changes</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 6, width: 38 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 60,
    gap: 16,
  },
  badgeRow: { flexDirection: 'row' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  editorCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  editorAccentStrip: {
    height: 3,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 2,
    opacity: 0.7,
  },
  textArea: {
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    minHeight: 120,
  },
  mediaScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  mediaItemWrap: {
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginRight: 12,
  },
  mediaItemPreview: { width: '100%', height: '100%' },
  removeMediaItem: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  editorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  charCount: { fontSize: 12, fontWeight: '600' },
  changedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changedText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  mediaAddBtns: { flexDirection: 'row', gap: 12 },
  addBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(32, 138, 239, 0.1)',
  },
  hintCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  hintTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  hintText: { fontSize: 13, lineHeight: 19 },
  discardBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  discardText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
});
