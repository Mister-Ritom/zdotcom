import { useColorScheme } from "@/hooks/use-color-scheme";
import { runPostUploadJob, runStoryUploadJob } from "@/services/storageService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUploadStore } from "@/stores/useUploadStore";
import { AppLogger } from "@/utils/logger";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ArrowLeft, Image as ImageIcon, Video, X } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TAG = "CreateScreen";
const ACCENT = "#208AEF";
type CreationType = "post" | "story" | "short";

interface SelectedMedia {
  uri: string;
  type: "image" | "video";
}

export default function CreationScreen() {
  const isDark = useColorScheme() === "dark";
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<CreationType>("post");
  const [text, setText] = useState("");
  const [mediaItems, setMediaItems] = useState<SelectedMedia[]>([]);

  const resetMedia = () => {
    setMediaItems([]);
  };

  const pickImage = async () => {
    AppLogger.info(TAG, "Requesting media library permissions...");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      AppLogger.warn(TAG, "Media library permission denied by user");
      Alert.alert("Permission needed", "We need access to your media library.");
      return;
    }

    try {
      const isPost = activeTab === "post";
      AppLogger.info(TAG, `Launching image library. Multiple selection allowed: ${isPost}`);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          activeTab === "short"
            ? ['videos']
            : ['images', 'videos'],
        quality: 0.85,
        allowsMultipleSelection: isPost,
        allowsEditing: !isPost, // Crop/edit only for single item selection (stories/shorts)
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type === "video" ? ("video" as const) : ("image" as const)
        }));

        if (isPost) {
          setMediaItems(prev => {
            const updated = [...prev, ...newItems];
            AppLogger.info(TAG, `Added ${newItems.length} items. Total selected media: ${updated.length}`);
            return updated;
          });
        } else {
          setMediaItems(newItems.slice(0, 1));
          AppLogger.info(TAG, `Selected single item for ${activeTab}: ${newItems[0].uri}`);
        }
      } else {
        AppLogger.info(TAG, "Media library picker cancelled");
      }
    } catch (err) {
      AppLogger.error(TAG, "Error picking media from library", err);
      Alert.alert("Error", "Failed to select media.");
    }
  };

  const pickCamera = async () => {
    AppLogger.info(TAG, "Requesting camera permissions...");
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      AppLogger.warn(TAG, "Camera permission denied by user");
      Alert.alert("Permission needed", "We need camera access.");
      return;
    }

    try {
      const isShort = activeTab === "short";
      AppLogger.info(TAG, `Launching camera. Media type restriction: ${isShort ? "videos" : "images/videos"}`);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: isShort ? ['videos'] : ['images', 'videos'],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newItem = {
          uri: asset.uri,
          type: asset.type === "video" ? ("video" as const) : ("image" as const)
        };

        if (activeTab === "post") {
          setMediaItems(prev => {
            const updated = [...prev, newItem];
            AppLogger.info(TAG, `Added camera captured item. Total selected media: ${updated.length}`);
            return updated;
          });
        } else {
          setMediaItems([newItem]);
          AppLogger.info(TAG, `Selected camera captured item for ${activeTab}: ${newItem.uri}`);
        }
      } else {
        AppLogger.info(TAG, "Camera capture cancelled");
      }
    } catch (err) {
      AppLogger.error(TAG, "Error capturing media with camera", err);
      Alert.alert("Error", "Failed to capture media.");
    }
  };

  const handleCreate = () => {
    if (!user?.id) {
      AppLogger.error(TAG, "Failed to create: User is not authenticated");
      Alert.alert("Error", "Not authenticated");
      return;
    }

    const hasMedia = mediaItems.length > 0;
    if (activeTab === "post" && !text.trim() && !hasMedia) {
      AppLogger.warn(TAG, "Failed to create: Post has neither text nor media");
      Alert.alert("Error", "Add some text or media");
      return;
    }
    if ((activeTab === "story" || activeTab === "short") && !hasMedia) {
      AppLogger.warn(TAG, `Failed to create: Media is required for ${activeTab}s`);
      Alert.alert("Error", `Media is required for ${activeTab}s`);
      return;
    }

    // Build a unique job ID and label for the upload banner
    const jobId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const label = text.trim()
      ? text.trim().slice(0, 32) + (text.length > 32 ? "…" : "")
      : activeTab === "story"
        ? "Story"
        : activeTab === "short"
          ? "Short"
          : "Post";

    AppLogger.info(TAG, `Registering background upload job [${jobId}] of type '${activeTab}'`);

    // Register the job — the banner will immediately show "Waiting…"
    useUploadStore.getState().addJob({ id: jobId, type: activeTab, label });

    // Fire-and-forget: kick off the background upload WITHOUT awaiting
    if (activeTab === "story") {
      runStoryUploadJob({
        type: "story",
        jobId,
        userId: user.id,
        caption: text.trim(),
        mediaUri: mediaItems[0].uri,
        visibility: "public",
      });
    } else {
      runPostUploadJob({
        type: activeTab,
        jobId,
        userId: user.id,
        text: text.trim(),
        mediaUris: hasMedia ? mediaItems.map(item => item.uri) : null,
        isShort: activeTab === "short",
      });
    }

    // Close the screen immediately — user can see upload progress in the banner
    router.replace("/(tabs)");
  };

  const bg = isDark ? "#09090B" : "#FFF";
  const border = isDark ? "#27272A" : "#E4E4E7";
  const textColor = isDark ? "#FFF" : "#000";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Create New
        </Text>
        <TouchableOpacity onPress={handleCreate} style={styles.publishWrap}>
          <Text style={styles.publishBtn}>Publish</Text>
        </TouchableOpacity>
      </View>

      {/* Type Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: border }]}>
        {(["post", "story", "short"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              setActiveTab(tab);
              resetMedia();
              setText("");
            }}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: ACCENT },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? ACCENT : "#888" },
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Media Preview */}
        {mediaItems.length > 0 ? (
          <View style={styles.mediaContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaScrollContent}
            >
              {mediaItems.map((item, idx) => (
                <View key={item.uri} style={styles.mediaItemWrap}>
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.mediaItemPreview}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeMediaItem}
                    onPress={() => {
                      setMediaItems(prev => {
                        const updated = prev.filter((_, i) => i !== idx);
                        AppLogger.info(TAG, `Removed media item at index ${idx}. Remaining: ${updated.length}`);
                        return updated;
                      });
                    }}
                  >
                    <X size={16} color="#FFF" />
                  </TouchableOpacity>
                  {item.type === "video" && (
                    <View style={styles.videoBadge}>
                      <Video size={12} color="#FFF" />
                      <Text style={styles.videoBadgeText}>Video</Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Add More card if activeTab is "post" */}
              {activeTab === "post" && (
                <View style={[styles.addMoreCard, { borderColor: border, backgroundColor: isDark ? "#18181B" : "#F4F4F5" }]}>
                  <Text style={[styles.addMoreTitle, { color: "#888" }]}>Add More</Text>
                  <View style={styles.addMoreBtns}>
                    <TouchableOpacity style={styles.addMoreBtn} onPress={pickImage}>
                      <ImageIcon size={20} color={ACCENT} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addMoreBtn} onPress={pickCamera}>
                      <Video size={20} color={ACCENT} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          <View style={[styles.mediaPicker, { borderColor: border }]}>
            <Text style={[styles.mediaPickerLabel, { color: "#888" }]}>
              {activeTab === "short" ? "Select a video" : "Add photo or video"}
            </Text>
            <View style={styles.mediaPickerBtns}>
              <TouchableOpacity
                style={[
                  styles.mediaBtn,
                  { backgroundColor: isDark ? "#18181B" : "#F4F4F5" },
                ]}
                onPress={pickImage}
              >
                <ImageIcon size={22} color={ACCENT} />
                <Text style={[styles.mediaBtnText, { color: textColor }]}>
                  Library
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mediaBtn,
                  { backgroundColor: isDark ? "#18181B" : "#F4F4F5" },
                ]}
                onPress={pickCamera}
              >
                <Video size={22} color={ACCENT} />
                <Text style={[styles.mediaBtnText, { color: textColor }]}>
                  Camera
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Caption */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: "#888" }]}>
            {activeTab === "story"
              ? "Caption (optional)"
              : activeTab === "short"
                ? "Caption"
                : "What's on your mind?"}
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                color: textColor,
                borderColor: border,
                backgroundColor: isDark ? "#18181B" : "#F9F9F9",
              },
            ]}
            placeholder={
              activeTab === "post" ? "Share your thoughts…" : "Add a caption…"
            }
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 4, width: 36 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  publishWrap: { width: 70, alignItems: "flex-end" },
  publishBtn: { fontSize: 16, fontWeight: "700", color: ACCENT },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 13, fontWeight: "700" },
  scroll: { flex: 1 },
  mediaPicker: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    padding: 28,
    alignItems: "center",
    gap: 16,
  },
  mediaPickerLabel: { fontSize: 14, fontWeight: "600" },
  mediaPickerBtns: { flexDirection: "row", gap: 16 },
  mediaBtn: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  mediaBtnText: { fontSize: 13, fontWeight: "600" },
  mediaPreviewWrap: {
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    height: 260,
  },
  mediaPreview: { width: "100%", height: "100%" },
  removeMedia: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  videoLabel: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoLabelText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  mediaContainer: {
    marginVertical: 16,
  },
  mediaScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  mediaItemWrap: {
    width: 160,
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  mediaItemPreview: {
    width: "100%",
    height: "100%",
  },
  removeMediaItem: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  videoBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  addMoreCard: {
    width: 120,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 8,
  },
  addMoreTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  addMoreBtns: {
    flexDirection: "row",
    gap: 8,
  },
  addMoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(32, 138, 239, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  form: { paddingHorizontal: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
  },
});
