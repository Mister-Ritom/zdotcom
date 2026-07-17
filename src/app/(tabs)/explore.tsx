import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { userService } from '@/services/userService';
import { type UserModel } from '@/types/models';
import { Avatar } from '@/components/common/Avatar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExploreGrid } from '@/components/feed/ExploreGrid';

const ACCENT = '#208AEF';

export default function SearchScreen() {
  const isDark = useColorScheme() === 'dark';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (!text.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const users = await userService.searchUsers(text.trim());
      setResults(users);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => handleSearch(''), [handleSearch]);

  const bg = isDark ? '#09090B' : '#FFF';
  const inputBg = isDark ? '#18181B' : '#F4F4F5';
  const border = isDark ? '#27272A' : '#E4E4E7';
  const isSearching = query.trim().length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]}>Explore</Text>
      </View>

      {/*
        Search bar is ALWAYS rendered here at the same level in the tree.
        This prevents the TextInput from being unmounted/remounted when
        switching between explore mode and search mode, which would dismiss
        the keyboard on the first keystroke.
      */}
      <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor: border }]}>
        <SearchIcon size={18} color="#888" />
        <TextInput
          style={[styles.input, { color: isDark ? '#FFF' : '#000' }]}
          placeholder="Search people by name or username..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={handleSearch}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content area — switches between explore grid and search results */}
      {isSearching ? (
        // ── Search results ──
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultRow, { borderBottomColor: border }]}
                onPress={() => router.push(`/profile/${item.id}`)}
                activeOpacity={0.7}
              >
                <Avatar uri={item.profilePictureUrl} name={item.displayName} size={46} />
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultName, { color: isDark ? '#FFF' : '#000' }]}>
                    {item.displayName}
                    {item.isVerified && <Text style={{ color: ACCENT }}> ✓</Text>}
                  </Text>
                  <Text style={styles.resultUsername}>@{item.username}</Text>
                  {!!item.bio && (
                    <Text style={styles.resultBio} numberOfLines={1}>{item.bio}</Text>
                  )}
                </View>
                <View style={styles.followersChip}>
                  <Text style={styles.followersCount}>{item.followersCount}</Text>
                  <Text style={styles.followersLabel}>followers</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                {searched ? (
                  <Text style={{ color: '#888', fontSize: 14 }}>No users found for "{query}"</Text>
                ) : (
                  <>
                    <SearchIcon size={48} color={isDark ? '#27272A' : '#E4E4E7'} strokeWidth={1.5} />
                    <Text style={[styles.emptyText, { color: isDark ? '#52525B' : '#A1A1AA' }]}>
                      Search for people to follow
                    </Text>
                  </>
                )}
              </View>
            }
          />
        )
      ) : (
        // ── Explore grid (no ListHeaderComponent — search bar is always above) ──
        <ExploreGrid />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700' },
  resultUsername: { fontSize: 13, color: '#888', marginTop: 2 },
  resultBio: { fontSize: 12, color: '#A1A1AA', marginTop: 4 },
  followersChip: { alignItems: 'center' },
  followersCount: { fontSize: 13, fontWeight: '700', color: '#888' },
  followersLabel: { fontSize: 11, color: '#A1A1AA' },
  emptyText: { marginTop: 12, fontSize: 14 },
});
