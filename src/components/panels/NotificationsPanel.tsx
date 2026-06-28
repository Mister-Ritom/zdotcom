import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/services/supabase';
import { userService } from '@/services/userService';
import { Avatar } from '@/components/common/Avatar';
import { router } from 'expo-router';
import { Heart, Repeat2, MessageCircle, UserPlus, AtSign, Bell, X, Check } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ACCENT = '#208AEF';

type NotifType = 'like' | 'rezap' | 'reply' | 'follow' | 'mention' | 'message';

interface AppNotification {
  id: string;
  userId: string;
  fromUserId: string;
  type: NotifType;
  zapId?: string;
  createdAt: Date;
  isRead: boolean;
}

interface EnrichedNotif extends AppNotification {
  fromName: string;
  fromAvatar?: string;
}

function notifIcon(type: NotifType) {
  switch (type) {
    case 'like': return <Heart size={16} color="#EF4444" fill="#EF4444" />;
    case 'rezap': return <Repeat2 size={16} color="#10B981" />;
    case 'reply': return <MessageCircle size={16} color={ACCENT} />;
    case 'follow': return <UserPlus size={16} color="#8B5CF6" />;
    case 'mention': return <AtSign size={16} color="#F59E0B" />;
    default: return <Bell size={16} color="#888" />;
  }
}

function notifText(type: NotifType, name: string) {
  switch (type) {
    case 'like': return `${name} liked your zap`;
    case 'rezap': return `${name} rezapped your zap`;
    case 'reply': return `${name} replied to your zap`;
    case 'follow': return `${name} followed you`;
    case 'mention': return `${name} mentioned you`;
    case 'message': return `${name} sent you a message`;
    default: return 'New notification';
  }
}

function timeAgo(date: Date) {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

interface NotificationsPanelProps {
  onClose: () => void;
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  const [notifs, setNotifs] = useState<EnrichedNotif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadNotifs();
  }, [user?.id]);

  const loadNotifs = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;

      const enriched: EnrichedNotif[] = await Promise.all(
        (data ?? []).map(async (n: Record<string, unknown>) => {
          const fromUser = await userService.getById(n['from_user_id'] as string);
          return {
            id: n['id'] as string,
            userId: n['user_id'] as string,
            fromUserId: n['from_user_id'] as string,
            type: (n['type'] as NotifType) ?? 'like',
            zapId: n['zap_id'] as string | undefined,
            createdAt: n['created_at'] ? new Date(n['created_at'] as string) : new Date(),
            isRead: (n['is_read'] as boolean) ?? false,
            fromName: fromUser?.displayName ?? 'Someone',
            fromAvatar: fromUser?.profilePictureUrl,
          };
        })
      );
      setNotifs(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      // Update local state
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const bg = isDark ? '#18181B' : '#FFF';
  const border = isDark ? '#27272A' : '#E4E4E7';
  const textColor = isDark ? '#FFF' : '#000';
  const textSecondary = isDark ? '#A1A1AA' : '#52525B';

  return (
    <View style={[styles.container, { backgroundColor: bg, borderLeftColor: border }]}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: textColor }]}>Notifications</Text>
          {notifs.some(n => !n.isRead) && (
            <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn} activeOpacity={0.7}>
              <Check size={14} color={ACCENT} style={{ marginRight: 4 }} />
              <Text style={[styles.markReadText, { color: ACCENT }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <X size={18} color={textColor} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={ACCENT} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1 }}>
          {notifs.length === 0 ? (
            <View style={styles.center}>
              <Bell size={32} color={isDark ? '#3F3F46' : '#D4D4D8'} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                You're all caught up
              </Text>
            </View>
          ) : (
            notifs.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.row,
                  { 
                    borderBottomColor: border,
                    borderLeftColor: item.isRead ? 'transparent' : ACCENT,
                    borderLeftWidth: item.isRead ? 0 : 3,
                    backgroundColor: item.isRead ? 'transparent' : isDark ? 'rgba(32, 138, 239, 0.05)' : 'rgba(32, 138, 239, 0.03)'
                  },
                ]}
                onPress={() => {
                  onClose();
                  if (item.type === 'follow') router.push(`/profile/${item.fromUserId}`);
                  else if (item.type === 'message') router.push('/messages');
                }}
                activeOpacity={0.7}
              >
                <Avatar uri={item.fromAvatar} name={item.fromName} size={36} />
                <View style={styles.notifContent}>
                  <Text style={[styles.notifText, { color: isDark ? '#E4E4E7' : '#18181B' }]}>
                    {notifText(item.type, item.fromName)}
                  </Text>
                  <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
                </View>
                <View style={styles.notifIcon}>{notifIcon(item.type)}</View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderLeftWidth: 1,
    height: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  notifIcon: {
    padding: 2,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
  },
});
