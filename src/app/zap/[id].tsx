import { DesktopLayout } from "@/components/DesktopLayout";
import { ZapCardContainer } from "@/components/feed/ZapCardContainer";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { zapService } from "@/services/zapService";
import { useAuthStore } from "@/stores/useAuthStore";
import { type ZapModel } from "@/types/models";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, MessageCircle, Send } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#208AEF";

export default function ZapDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useColorScheme() === "dark";
  const { user: currentUser } = useAuthStore();

  const [zap, setZap] = useState<ZapModel | null>(null);
  const [replies, setReplies] = useState<ZapModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const mainZap = await zapService.getZapById(id);
      setZap(mainZap);
      if (mainZap) {
        const replyList = await zapService.getZapReplies(id);
        setReplies(replyList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const replyList = await zapService.getZapReplies(id);
      setReplies(replyList);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !currentUser?.id || !id) return;
    setSubmitting(true);
    const textToSend = replyText.trim();
    setReplyText("");
    inputRef.current?.blur();

    try {
      const replyId = Math.random().toString(36).substring(2, 15);
      await zapService.createZap({
        id: replyId,
        userId: currentUser.id,
        text: textToSend,
        mediaUrls: [],
        parentZapId: id,
        isShort: false,
      });
      // Refresh replies
      const updatedReplies = await zapService.getZapReplies(id);
      setReplies(updatedReplies);
      // Increment reply counter locally on the main zap if it is loaded
      if (zap) {
        setZap({ ...zap, repliesCount: zap.repliesCount + 1 });
      }
    } catch {
      Alert.alert("Error", "Failed to publish reply");
      setReplyText(textToSend); // Restore text on failure
    } finally {
      setSubmitting(false);
    }
  };

  const bg = isDark ? "#09090B" : "#FFF";
  const border = isDark ? "#1C1917" : "#F4F4F5";
  const textColor = isDark ? "#FFF" : "#000";

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: bg }]}
        edges={["top"]}
      >
        <DesktopLayout>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
            >
              <ArrowLeft size={22} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>Zap</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        </DesktopLayout>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={["top", "bottom"]}
    >
      <DesktopLayout>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: border }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
            >
              <ArrowLeft size={22} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              Thread
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Content list */}
          <FlatList
            data={replies}
            keyExtractor={(item) => item.id}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListHeaderComponent={
              <View>
                {zap ? (
                  // Disable navigation to detail screen since we are already on it
                  <ZapCardContainer zap={zap} onPress={() => {}} />
                ) : (
                  <View style={styles.notFound}>
                    <Text style={{ color: "#888" }}>Zap not found</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.sectionTitleRow,
                    { borderBottomColor: border },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    Replies
                  </Text>
                </View>
              </View>
            }
            renderItem={({ item }) => <ZapCardContainer zap={item} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MessageCircle
                  size={36}
                  color={isDark ? "#27272A" : "#E4E4E7"}
                  strokeWidth={1.5}
                />
                <Text style={styles.emptyText}>
                  No replies yet. Be the first to reply!
                </Text>
              </View>
            }
          />

          {/* Reply input composer */}
          <View
            style={[
              styles.composer,
              {
                borderTopColor: border,
                backgroundColor: isDark ? "#09090B" : "#FFF",
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                {
                  color: textColor,
                  backgroundColor: isDark ? "#18181B" : "#F4F4F5",
                },
              ]}
              placeholder="Write a reply..."
              placeholderTextColor="#666"
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={280}
            />
            <TouchableOpacity
              onPress={handleSendReply}
              disabled={!replyText.trim() || submitting}
              style={[styles.sendBtn, { opacity: replyText.trim() ? 1 : 0.5 }]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </DesktopLayout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  notFound: { padding: 32, alignItems: "center" },
  sectionTitleRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  empty: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
});
