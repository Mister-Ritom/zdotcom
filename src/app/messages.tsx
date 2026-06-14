import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, MessageSquarePlus, Search } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { messageService } from '@/services/messageService';
import { userService } from '@/services/userService';
import { type ConversationModel, type UserModel } from '@/types/models';
import { Avatar } from '@/components/common/Avatar';

const ACCENT = '#208AEF';

export default function MessagesScreen() {
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

    // Load user profiles for recipients
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
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    const res = await userService.searchUsers(text);
    // Filter out self
    setSearchResults(res.filter((u) => u.id !== currentUser?.id));
  };

  const startNewChat = (recipient: UserModel) => {
    if (!currentUser?.id) return;
    setModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);

    const convId = messageService.getConversationId([currentUser.id, recipient.id]);
    router.push({
      pathname: '/chat/[id]',
      params: { id: convId, recipientId: recipient.id },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Direct Messages</Text>
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

            return (
              <TouchableOpacity
                style={styles.chatRow}
                onPress={() =>
                  router.push({
                    pathname: '/chat/[id]',
                    params: { id: item.id, recipientId: otherId ?? '' },
                  })
                }
              >
                <Avatar uri={otherUser?.profilePictureUrl} name={otherUser?.displayName ?? '?'} size={48} />
                <View style={styles.chatDetails}>
                  <View style={styles.row}>
                    <Text style={[styles.chatName, { color: isDark ? '#FFF' : '#000' }]}>
                      {otherUser?.displayName ?? 'User'}
                    </Text>
                    <Text style={styles.time}>
                      {item.lastMessageAt.toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage || '📎 Media'}
                  </Text>
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

      {/* Start New Chat Modal */}
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
                placeholder="Search by username or display name"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  chatRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  chatDetails: { flex: 1, borderBottomWidth: 1, borderBottomColor: 'rgba(128, 128, 128, 0.05)', paddingBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 16, fontWeight: '700' },
  time: { fontSize: 11, color: '#888' },
  lastMessage: { fontSize: 14, color: '#888', marginTop: 4 },
  empty: { padding: 80, alignItems: 'center' },
  // Modal Styles
  modalContent: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 10, borderRadius: 10 },
  searchResultRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  searchName: { fontSize: 15, fontWeight: '700' },
  searchUsername: { fontSize: 13, color: '#888', marginTop: 2 },
});
