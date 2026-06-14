import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { messageService } from '@/services/messageService';
import { userService } from '@/services/userService';
import { supabase } from '@/services/supabase';
import { type MessageModel, type UserModel } from '@/types/models';
import { Avatar } from '@/components/common/Avatar';

const ACCENT = '#208AEF';

export default function ChatScreen() {
  const { id, recipientId } = useLocalSearchParams<{ id: string; recipientId: string }>();
  const isDark = useColorScheme() === 'dark';
  const { user: currentUser } = useAuthStore();

  const [recipient, setRecipient] = useState<UserModel | null>(null);
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (recipientId) {
      userService.getById(recipientId).then(setRecipient);
    }
  }, [recipientId]);

  useEffect(() => {
    if (!id || !currentUser?.id) return;

    // Load initial messages
    messageService.getMessages(id).then((list) => {
      setMessages(list);
      setLoading(false);
      messageService.markAsRead(id, currentUser.id);
    });

    // Realtime channel subscription
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => {
            // Avoid duplicate additions
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            
            // Convert database columns (snake_case) to model (camelCase)
            const mappedMsg: MessageModel = {
              id: newMsg.id,
              conversationId: newMsg.conversation_id,
              senderId: newMsg.sender_id,
              recipientIds: newMsg.recipient_ids ?? [],
              text: newMsg.text ?? '',
              mediaUrls: newMsg.media_urls ?? undefined,
              createdAt: new Date(newMsg.created_at),
              isRead: newMsg.is_read ?? false,
              isDeleted: newMsg.is_deleted ?? false,
              isPending: newMsg.is_pending ?? false,
            };
            return [mappedMsg, ...prev];
          });

          // Mark message read if we are viewing the chat
          if (newMsg.sender_id !== currentUser.id) {
            messageService.markAsRead(id, currentUser.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, currentUser?.id]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser?.id || !recipientId) return;
    const msgText = text.trim();
    setText('');

    await messageService.sendMessage({
      senderId: currentUser.id,
      recipients: [currentUser.id, recipientId],
      text: msgText,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Avatar uri={recipient?.profilePictureUrl} name={recipient?.displayName ?? '?'} size={34} />
            <View>
              <Text style={[styles.headerName, { color: isDark ? '#FFF' : '#000' }]}>
                {recipient?.displayName ?? 'User'}
              </Text>
              <Text style={styles.headerUsername}>@{recipient?.username ?? '...'}</Text>
            </View>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => {
              const isSelf = item.senderId === currentUser?.id;
              return (
                <View style={[styles.messageRow, isSelf ? styles.selfRow : styles.otherRow]}>
                  <View
                    style={[
                      styles.bubble,
                      isSelf
                        ? { backgroundColor: ACCENT }
                        : { backgroundColor: isDark ? '#27272A' : '#F4F4F5' },
                    ]}
                  >
                    <Text style={[styles.messageText, { color: isSelf ? '#FFF' : isDark ? '#FFF' : '#000' }]}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { borderTopColor: isDark ? '#27272A' : '#E4E4E7' }]}>
          <TextInput
            style={[styles.input, { color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#18181B' : '#F4F4F5' }]}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={!text.trim()}>
            <Send size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  iconBtn: { padding: 4 },
  headerTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 8 },
  headerName: { fontSize: 15, fontWeight: '700' },
  headerUsername: { fontSize: 12, color: '#888' },
  messagesList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row', width: '100%' },
  selfRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start' },
  bubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, maxWidth: '75%' },
  messageText: { fontSize: 15 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, gap: 10 },
  input: { flex: 1, height: 40, borderRadius: 20, paddingHorizontal: 16, fontSize: 15 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
