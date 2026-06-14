import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetFlatList, BottomSheetBackdrop, BottomSheetTextInput, BottomSheetFooter } from '@gorhom/bottom-sheet';
import { zapService } from '@/services/zapService';
import { useAuthStore } from '@/stores/useAuthStore';
import { Send } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface CommentsSheetProps {
  postId: string;
}

export const CommentsSheet = forwardRef<BottomSheet, CommentsSheetProps>(({ postId }, ref) => {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const snapPoints = useMemo(() => ['50%', '90%'], []);

  const fetchComments = async () => {
    setLoading(true);
    const data = await zapService.getComments(postId);
    setComments(data);
    setLoading(false);
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index >= 0) {
      fetchComments();
    }
  }, [postId]);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const handlePost = async () => {
    if (!text.trim() || !user?.id) return;
    setSubmitting(true);
    try {
      await zapService.addComment(postId, user.id, text.trim());
      setText('');
      fetchComments();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFooter = useCallback(
    (props: any) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <View style={[styles.inputRow, { borderTopColor: isDark ? '#27272A' : '#E4E4E7', backgroundColor: isDark ? '#18181B' : '#FFFFFF' }]}>
          <BottomSheetTextInput
            style={[styles.input, { color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}
            placeholder="Add a comment..."
            placeholderTextColor={isDark ? '#A1A1AA' : '#71717A'}
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity onPress={handlePost} disabled={submitting || !text.trim()} style={styles.sendBtn}>
            {submitting ? (
              <ActivityIndicator size="small" color="#208AEF" />
            ) : (
              <Send size={20} color={text.trim() ? '#208AEF' : '#A1A1AA'} />
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ),
    [text, isDark, submitting, handlePost]
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={{ backgroundColor: isDark ? '#18181B' : '#FFFFFF' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#52525B' : '#A1A1AA' }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      enablePanDownToClose
    >
      <View style={styles.container}>
        <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]}>Comments</Text>
        <BottomSheetFlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#208AEF" />
            ) : (
              <Text style={[styles.emptyText, { color: isDark ? '#A1A1AA' : '#71717A' }]}>No comments yet. Be the first to comment!</Text>
            )
          }
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Text style={{ color: isDark ? '#A1A1AA' : '#52525B', fontSize: 13, fontWeight: 'bold' }}>
                User {item.user_id?.substring(0, 4)}...
              </Text>
              <Text style={{ color: isDark ? '#F4F4F5' : '#18181B', marginTop: 4 }}>
                {item.text}
              </Text>
            </View>
          )}
        />
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  listContent: { padding: 16 },
  commentItem: { marginBottom: 16 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendBtn: { marginLeft: 12, padding: 8 },
});
