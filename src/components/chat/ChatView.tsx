import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Play, Send, Zap } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { messageService } from '@/services/messageService';
import { userService } from '@/services/userService';
import { supabase } from '@/services/supabase';
import { type MessageModel, type UserModel } from '@/types/models';
import { Avatar } from '@/components/common/Avatar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ZAP_SHARE_PREFIX, type ZapSharePayload } from '@/components/sheets/SendSheet';

const ACCENT = '#208AEF';

interface Props {
  convId: string;
  recipientId: string;
  /** When true, hides the back arrow (used in split-view where nav is not needed) */
  hideBack?: boolean;
}

// ─── Parse zap share messages ─────────────────────────────────────────────────

function parseZapShare(text: string): { payload: ZapSharePayload; personalMessage: string } | null {
  if (!text.startsWith(ZAP_SHARE_PREFIX)) return null;
  const withoutPrefix = text.slice(ZAP_SHARE_PREFIX.length);
  const newlineIdx = withoutPrefix.indexOf('\n');
  const jsonStr = newlineIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, newlineIdx);
  const personalMessage = newlineIdx === -1 ? '' : withoutPrefix.slice(newlineIdx + 1);
  try {
    const payload = JSON.parse(jsonStr) as ZapSharePayload;
    return { payload, personalMessage };
  } catch {
    return null;
  }
}

// ─── Zap Share Card ───────────────────────────────────────────────────────────

function ZapShareCard({
  payload,
  personalMessage,
  isSelf,
  isDark,
}: {
  payload: ZapSharePayload;
  personalMessage: string;
  isSelf: boolean;
  isDark: boolean;
}) {
  const cardBg = isSelf
    ? 'rgba(32,138,239,0.15)'
    : isDark ? '#1C1C1E' : '#F4F4F5';
  const borderCol = isSelf ? 'rgba(32,138,239,0.4)' : isDark ? '#27272A' : '#E4E4E7';
  const textCol = isDark ? '#FFF' : '#000';
  const subCol = isDark ? '#A1A1AA' : '#71717A';

  let isShortRoute = payload.isShort === true || (payload.url && payload.url.includes('/shorts/'));
  if (payload.isShort === false || (payload.url && payload.url.includes('/zap/'))) {
    isShortRoute = false;
  }

  const handleWatch = () => {
    let targetId = payload.zapId;
    let isShort = isShortRoute;
    if (!targetId && payload.url) {
      const match = payload.url.match(/\/(shorts|zap)\/([a-zA-Z0-9_-]+)/);
      if (match && match[2]) {
        targetId = match[2];
        if (match[1] === 'shorts') isShort = true;
        if (match[1] === 'zap') isShort = false;
      }
    }

    if (targetId) {
      const pathname = isShort ? '/shorts/[id]' : '/zap/[id]';
      router.push({ pathname, params: { id: targetId } });
    } else if (payload.url) {
      if (payload.url.startsWith('http')) {
        Linking.openURL(payload.url).catch(() => {
          Alert.alert('Could not open link', payload.url);
        });
      } else {
        router.push(payload.url as any);
      }
    }
  };

  return (
    <TouchableOpacity
      style={[card.container, { backgroundColor: cardBg, borderColor: borderCol }]}
      onPress={handleWatch}
      activeOpacity={0.85}
    >
      {/* Personal message if any */}
      {personalMessage.trim().length > 0 && (
        <Text style={[card.personalMsg, { color: textCol }]}>{personalMessage.trim()}</Text>
      )}

      {/* Thumbnail + meta row */}
      <View style={card.mediaRow}>
        {/* Thumbnail */}
        <View style={card.thumbWrap}>
          {payload.thumbnailUrl ? (
            <Image
              source={{ uri: payload.thumbnailUrl }}
              style={card.thumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[card.thumb, card.thumbPlaceholder]}>
              {isShortRoute ? <Play size={20} color="#fff" fill="#fff" /> : <Zap size={20} color="#fff" fill="#fff" />}
            </View>
          )}
          {isShortRoute && (
            <View style={card.playOverlay}>
              <Play size={14} color="#fff" fill="#fff" />
            </View>
          )}
        </View>

        {/* Meta */}
        <View style={card.meta}>
          {(payload.creatorUsername || payload.creatorName) && (
            <View style={card.creatorRow}>
              {payload.creatorAvatarUrl && (
                <Avatar
                  uri={payload.creatorAvatarUrl}
                  name={payload.creatorName ?? '?'}
                  size={18}
                />
              )}
              <Text style={[card.creatorName, { color: textCol }]} numberOfLines={1}>
                @{payload.creatorUsername ?? payload.creatorName}
              </Text>
            </View>
          )}
          {payload.caption?.trim().length > 0 && (
            <Text style={[card.caption, { color: subCol }]} numberOfLines={2}>
              {payload.caption.trim()}
            </Text>
          )}

          {/* CTA */}
          <View style={card.watchBtn}>
            {isShortRoute ? <Play size={12} color="#fff" fill="#fff" /> : <Zap size={12} color="#fff" fill="#fff" />}
            <Text style={card.watchBtnText}>{isShortRoute ? 'Watch Short' : 'View Zap'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    maxWidth: 280,
    padding: 10,
    gap: 8,
  },
  personalMsg: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  thumbWrap: {
    width: 70,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: {
    width: 70,
    height: 90,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ACCENT,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  watchBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

// ─── Message bubble (text or zap share) ──────────────────────────────────────

function MessageBubble({
  item,
  isSelf,
  isDark,
}: {
  item: MessageModel;
  isSelf: boolean;
  isDark: boolean;
}) {
  const zapShare = parseZapShare(item.text);

  if (zapShare) {
    return (
      <ZapShareCard
        payload={zapShare.payload}
        personalMessage={zapShare.personalMessage}
        isSelf={isSelf}
        isDark={isDark}
      />
    );
  }

  return (
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
  );
}

// ─── ChatView ─────────────────────────────────────────────────────────────────

export function ChatView({ convId, recipientId, hideBack = false }: Props) {
  const isDark = useColorScheme() === 'dark';
  const { user: currentUser } = useAuthStore();

  const [recipient, setRecipient] = useState<UserModel | null>(null);
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (recipientId) userService.getById(recipientId).then(setRecipient);
  }, [recipientId]);

  useEffect(() => {
    if (!convId || !currentUser?.id) return;

    setLoading(true);
    messageService.getMessages(convId).then((list) => {
      setMessages(list);
      setLoading(false);
      messageService.markAsRead(convId, currentUser.id);
    });

    const channel = supabase
      .channel(`chat:${convId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
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
        if (newMsg.sender_id !== currentUser.id) {
          messageService.markAsRead(convId, currentUser.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [convId, currentUser?.id]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser?.id || !recipientId) return;
    const msgText = text.trim();
    setText('');

    const newMsg = await messageService.sendMessage({
      senderId: currentUser.id,
      recipients: [currentUser.id, recipientId],
      text: msgText,
    });

    if (!newMsg) {
      Alert.alert('Message Not Sent', "The recipient's privacy settings restrict who can message them.", [{ text: 'OK' }]);
    }
  };

  if (!convId) {
    return (
      <View style={[styles.emptyState, { backgroundColor: isDark ? '#0A0A0B' : '#F9F9F9' }]}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>💬</Text>
        <Text style={[styles.emptyStateText, { color: isDark ? '#52525B' : '#A1A1AA' }]}>
          Select a conversation
        </Text>
        <Text style={[styles.emptyStateSubText, { color: isDark ? '#3F3F46' : '#D4D4D8' }]}>
          Choose from your messages on the left
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#27272A' : '#E4E4E7' }]}>
          {!hideBack && (
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
            </TouchableOpacity>
          )}
          <View style={[styles.headerTitleWrap, { marginLeft: hideBack ? 0 : 8 }]}>
            <Avatar uri={recipient?.profilePictureUrl} name={recipient?.displayName ?? '?'} size={34} />
            <View>
              <Text style={[styles.headerName, { color: isDark ? '#FFF' : '#000' }]}>
                {recipient?.displayName ?? 'User'}
              </Text>
              <Text style={styles.headerUsername}>@{recipient?.username ?? '...'}</Text>
            </View>
          </View>
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
                  <MessageBubble item={item} isSelf={isSelf} isDark={isDark} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyStateText: { fontSize: 18, fontWeight: '600' },
  emptyStateSubText: { fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  iconBtn: { padding: 4 },
  headerTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
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
    width: 40, height: 40, borderRadius: 20, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
});
