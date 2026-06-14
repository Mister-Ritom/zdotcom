import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Image as ImageIcon, Video, X } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { zapService } from '@/services/zapService';
import { storyService } from '@/services/storyService';

const ACCENT = '#208AEF';
type CreationType = 'post' | 'story' | 'short';

export default function CreationScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<CreationType>('post');
  const [text, setText] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your media library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: activeTab === 'short' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
    }
  };

  const pickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: activeTab === 'short' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
    }
  };

  const handleCreate = async () => {
    if (!user?.id) { Alert.alert('Error', 'Not authenticated'); return; }
    if (activeTab === 'post' && !text.trim() && !mediaUri) {
      Alert.alert('Error', 'Add some text or media'); return;
    }
    if ((activeTab === 'story' || activeTab === 'short') && !mediaUri) {
      Alert.alert('Error', `Media is required for ${activeTab}s`); return;
    }

    setSubmitting(true);
    try {
      // NOTE: In production, upload mediaUri to Supabase Storage first, then use the remote URL
      const remoteUrl = mediaUri ?? '';

      if (activeTab === 'post') {
        await zapService.createZap({
          userId: user.id, text: text.trim(),
          mediaUrls: remoteUrl ? [remoteUrl] : [], isShort: false,
        });
      } else if (activeTab === 'short') {
        await zapService.createZap({
          userId: user.id, text: text.trim(),
          mediaUrls: [remoteUrl], isShort: true,
        });
      } else {
        await storyService.createStory({
          userId: user.id, caption: text.trim(), mediaUrl: remoteUrl, visibility: 'public',
        });
      }
      Alert.alert('Success', 'Published!', [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]);
    } catch {
      Alert.alert('Error', 'Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  const bg = isDark ? '#09090B' : '#FFF';
  const border = isDark ? '#27272A' : '#E4E4E7';
  const textColor = isDark ? '#FFF' : '#000';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Create New</Text>
        <TouchableOpacity onPress={handleCreate} disabled={submitting} style={styles.publishWrap}>
          {submitting ? (
            <ActivityIndicator size="small" color={ACCENT} />
          ) : (
            <Text style={styles.publishBtn}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Type Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: border }]}>
        {(['post', 'story', 'short'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => { setActiveTab(tab); setMediaUri(null); setMediaType(null); setText(''); }}
            style={[styles.tab, activeTab === tab && { borderBottomColor: ACCENT }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? ACCENT : '#888' }]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Media Preview */}
        {mediaUri ? (
          <View style={styles.mediaPreviewWrap}>
            <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeMedia} onPress={() => { setMediaUri(null); setMediaType(null); }}>
              <X size={18} color="#FFF" />
            </TouchableOpacity>
            {mediaType === 'video' && (
              <View style={styles.videoLabel}>
                <Video size={14} color="#FFF" />
                <Text style={styles.videoLabelText}>Video</Text>
              </View>
            )}
          </View>
        ) : (
          /* Media Picker Buttons */
          <View style={[styles.mediaPicker, { borderColor: border }]}>
            <Text style={[styles.mediaPickerLabel, { color: '#888' }]}>
              {activeTab === 'short' ? 'Select a video' : 'Add photo or video'}
            </Text>
            <View style={styles.mediaPickerBtns}>
              <TouchableOpacity style={[styles.mediaBtn, { backgroundColor: isDark ? '#18181B' : '#F4F4F5' }]} onPress={pickImage}>
                <ImageIcon size={22} color={ACCENT} />
                <Text style={[styles.mediaBtnText, { color: textColor }]}>Library</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mediaBtn, { backgroundColor: isDark ? '#18181B' : '#F4F4F5' }]} onPress={pickCamera}>
                <Video size={22} color={ACCENT} />
                <Text style={[styles.mediaBtnText, { color: textColor }]}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Caption */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: '#888' }]}>
            {activeTab === 'story' ? 'Caption (optional)' : activeTab === 'short' ? 'Caption' : 'What\'s on your mind?'}
          </Text>
          <TextInput
            style={[styles.textArea, { color: textColor, borderColor: border, backgroundColor: isDark ? '#18181B' : '#F9F9F9' }]}
            placeholder={activeTab === 'post' ? 'Share your thoughts...' : 'Add a caption...'}
            placeholderTextColor="#666"
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 4, width: 36 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  publishWrap: { width: 70, alignItems: 'flex-end' },
  publishBtn: { fontSize: 16, fontWeight: '700', color: ACCENT },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  mediaPicker: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    gap: 16,
  },
  mediaPickerLabel: { fontSize: 14, fontWeight: '600' },
  mediaPickerBtns: { flexDirection: 'row', gap: 16 },
  mediaBtn: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10, gap: 6 },
  mediaBtnText: { fontSize: 13, fontWeight: '600' },
  mediaPreviewWrap: { margin: 16, borderRadius: 12, overflow: 'hidden', position: 'relative', height: 260 },
  mediaPreview: { width: '100%', height: '100%' },
  removeMedia: {
    position: 'absolute',
    top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  videoLabel: {
    position: 'absolute',
    bottom: 10, left: 10,
    flexDirection: 'row', gap: 4, alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  videoLabelText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  form: { paddingHorizontal: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
  },
});
