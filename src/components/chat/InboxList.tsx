import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ArrowLeft, MessageSquarePlus, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { messageService } from '@/services/messageService';
import { userService } from '@/services/userService';
import { type ConversationModel, type UserModel } from '@/types/models';
import { Avatar } from '@/components/common/Avatar';
import { ZAP_SHARE_PREFIX } from '@/components/sheets/SendSheet';

/** Map raw message text to a human-readable inbox preview. */
function formatLastMessage(text: string | undefined): string {
  if (!text) return '📎 Media';
  if (text.startsWith(ZAP_SHARE_PREFIX)) {
    try {
      const withoutPrefix = text.slice(ZAP_SHARE_PREFIX.length);
      const newlineIdx = withoutPrefix.indexOf('\n');
      const jsonStr = newlineIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, newlineIdx);
      const payload = JSON.parse(jsonStr);
      if (payload?.isShort === false || (payload?.url && payload.url.includes('/zap/'))) {
        return '⚡ Sent a Zap';
      }
    } catch {}
    return '⚡ Sent a Short';
  }
  return text;
}

const ACCENT = '#208AEF';

interface Props {
  selectedId?: string;
  onSelect?: (convId: string, recipientId: string) => void;
}

export function InboxList({ selectedId, onSelect }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { user: currentUser } = useAuthStore();

  const [conversations, setConversations] = useState<ConversationModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserModel[]>([]);
  const [convUsers, setConvUsers] = useState<Record<string, UserModel>>({});

  useEffect(() => {
    if (!currentUser?.id) return;
    loadConversations();
  }, [currentUser?.id]);

  const loadConversations = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    const list = await messageService.getConversations(currentUser.id);
    setConversations(list);

    const usersMap: Record<string, UserModel> = {};
    for (const c of list) {
      const otherId = c.recipients.find((uid) => uid !== currentUser.id);
      if (otherId && !usersMap[otherId]) {
        const u = await userService.getById(otherId);
        if (u) usersMap[otherId] = u;
      }
    }
    setConvUsers(usersMap);
    setLoading(false);
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) { setSearchResults([]); return; }
    const res = await userService.searchUsers(text);
    setSearchResults(res.filter((u) => u.id !== currentUser?.id));
  };

  const startNewChat = (recipient: UserModel) => {
    if (!currentUser?.id) return;
    setModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    const convId = messageService.getConversationId([currentUser.id, recipient.id]);
    if (onSelect) {
      onSelect(convId, recipient.id);
    } else {
      router.push({ pathname: '/chat/[id]', params: { id: convId, recipientId: recipient.id } });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF', borderRightColor: isDark ? '#27272A' : '#E4E4E7' }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? '#27272A' : '#E4E4E7' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {!onSelect && (
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.iconBtn}>
              <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Messages</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconBtn}>
          <MessageSquarePlus size={22} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const otherId = item.recipients.find((uid) => uid !== currentUser?.id);
            const otherUser = otherId ? convUsers[otherId] : null;
            const isSelected = selectedId === item.id;

            return (
              <TouchableOpacity
                style={[
                  styles.chatRow,
                  isSelected && { backgroundColor: isDark ? '#18181B' : '#F4F4F5' },
                ]}
                onPress={() => {
                  if (onSelect) {
                    onSelect(item.id, otherId ?? '');
                  } else {
                    router.push({ pathname: '/chat/[id]', params: { id: item.id, recipientId: otherId ?? '' } });
                  }
                }}
              >
                <Avatar uri={otherUser?.profilePictureUrl} name={otherUser?.displayName ?? '?'} size={48} />
                <View style={[styles.chatDetails, { borderBottomColor: isDark ? '#27272A' : '#E4E4E7' }]}>
                  <View style={styles.row}>
                    <Text style={[styles.chatName, { color: isDark ? '#FFF' : '#000' }]} numberOfLines={1}>
                      {otherUser?.displayName ?? 'User'}
                    </Text>
                    <Text style={styles.time}>
                      {item.lastMessageAt.toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>{formatLastMessage(item.lastMessage)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: '#888' }}>No conversations yet</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#18181B' : '#FFF' }]}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>New Chat</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: ACCENT, fontSize: 16, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.searchBox, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}>
              <Search size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, color: isDark ? '#FFF' : '#000' }}
                placeholder="Search users..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.searchResultRow} onPress={() => startNewChat(item)}>
                  <Avatar uri={item.profilePictureUrl} name={item.displayName} size={40} />
                  <View>
                    <Text style={[styles.searchName, { color: isDark ? '#FFF' : '#000' }]}>{item.displayName}</Text>
                    <Text style={styles.searchUsername}>@{item.username}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRightWidth: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  chatDetails: { flex: 1, borderBottomWidth: 1, paddingBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  time: { fontSize: 11, color: '#888' },
  lastMessage: { fontSize: 13, color: '#888', marginTop: 2 },
  empty: { padding: 80, alignItems: 'center' },
  modalContent: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 10, borderRadius: 10 },
  searchResultRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  searchName: { fontSize: 15, fontWeight: '700' },
  searchUsername: { fontSize: 13, color: '#888', marginTop: 2 },
});
