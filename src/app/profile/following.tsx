import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { userService } from '@/services/userService';
import { type UserModel } from '@/types/models';
import { Avatar } from '@/components/common/Avatar';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ACCENT = '#208AEF';

export default function FollowingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useColorScheme() === 'dark';
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    userService.getUserFollowing(id)
      .then((ids) => Promise.all(ids.map((uid) => userService.getById(uid))))
      .then((list) => {
        setUsers(list.filter((u): u is UserModel => u !== null));
        setLoading(false);
      });
  }, [id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Following</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => router.push(`/profile/${item.id}`)}
            >
              <Avatar uri={item.profilePictureUrl} name={item.displayName} size={44} />
              <View style={styles.details}>
                <Text style={[styles.name, { color: isDark ? '#FFF' : '#000' }]}>
                  {item.displayName}
                  {item.isVerified && <Text style={{ color: ACCENT }}> ✓</Text>}
                </Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: '#888' }}>Not following anyone yet</Text>
            </View>
          }
        />
      )}
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
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  details: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  username: { fontSize: 13, color: '#888', marginTop: 2 },
  empty: { padding: 40, alignItems: 'center' },
});
