import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/services/supabase';
import { userService } from '@/services/userService';
import { Avatar } from '@/components/common/Avatar';
import { router } from 'expo-router';
import { Heart, Repeat2, MessageCircle, UserPlus, AtSign, Bell, ArrowLeft } from 'lucide-react-native';
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
    case 'like': return <Heart size={18} color="#EF4444" fill="#EF4444" />;
    case 'rezap': return <Repeat2 size={18} color="#10B981" />;
    case 'reply': return <MessageCircle size={18} color={ACCENT} />;
    case 'follow': return <UserPlus size={18} color="#8B5CF6" />;
    case 'mention': return <AtSign size={18} color="#F59E0B" />;
    default: return <Bell size={18} color="#888" />;
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

export default function NotificationsScreen() {
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
        .limit(50);
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

      // Mark all as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? '#09090B' : '#FFF';
  const border = isDark ? '#1C1917' : '#F4F4F5';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]}>Notifications</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => item.id}
          onRefresh={loadNotifs}
          refreshing={loading}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.row,
                { borderBottomColor: border, backgroundColor: item.isRead ? 'transparent' : isDark ? '#1C1917' : '#F0F9FF' },
              ]}
              onPress={() => {
                if (item.type === 'follow') router.push(`/profile/${item.fromUserId}`);
                else if (item.type === 'message') router.push('/messages');
              }}
              activeOpacity={0.7}
            >
              <TouchableOpacity onPress={() => router.push(`/profile/${item.fromUserId}`)}>
                <Avatar uri={item.fromAvatar} name={item.fromName} size={44} />
              </TouchableOpacity>
              <View style={styles.notifContent}>
                <Text style={[styles.notifText, { color: isDark ? '#E4E4E7' : '#18181B' }]}>
                  {notifText(item.type, item.fromName)}
                </Text>
                <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
              </View>
              <View style={styles.notifIcon}>{notifIcon(item.type)}</View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Bell size={48} color={isDark ? '#27272A' : '#E4E4E7'} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: isDark ? '#52525B' : '#A1A1AA' }]}>
                You're all caught up
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  iconBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  notifContent: { flex: 1 },
  notifText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  notifTime: { fontSize: 12, color: '#888', marginTop: 3 },
  notifIcon: { padding: 4 },
  emptyText: { marginTop: 12, fontSize: 14 },
});
