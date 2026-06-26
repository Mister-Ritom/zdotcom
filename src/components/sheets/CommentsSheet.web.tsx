import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Send, X } from 'lucide-react-native';
import { zapService } from '@/services/zapService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type BottomSheet from '@gorhom/bottom-sheet';

export interface CommentsSheetProps {
  postId: string;
  onClose?: () => void;
}

// Web shim — exposes the same snapToIndex / close surface as BottomSheet
// so shorts.tsx needs zero changes at the call site.
export const CommentsSheet = forwardRef<BottomSheet, CommentsSheetProps>(
  ({ postId, onClose }, ref) => {
    const isDark = useColorScheme() === 'dark';
    const { user } = useAuthStore();

    const [visible, setVisible] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = useCallback(async () => {
      setLoading(true);
      const data = await zapService.getComments(postId);
      setComments(data);
      setLoading(false);
    }, [postId]);

    const open = useCallback(() => {
      setVisible(true);
      fetchComments();
    }, [fetchComments]);

    const close = useCallback(() => {
      setVisible(false);
      onClose?.();
    }, [onClose]);

    // Match the BottomSheet imperative API used in shorts.tsx
    useImperativeHandle(
      ref,
      () =>
        ({
          snapToIndex: (_index: number) => open(),
          close,
          expand: open,
          collapse: close,
          forceClose: close,
        }) as unknown as BottomSheet,
      [open, close],
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

    const bg = isDark ? '#18181B' : '#FFFFFF';
    const textColor = isDark ? '#F4F4F5' : '#18181B';
    const subColor = isDark ? '#A1A1AA' : '#71717A';
    const inputBg = isDark ? '#27272A' : '#F4F4F5';
    const borderColor = isDark ? '#27272A' : '#E4E4E7';

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={close} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrapper}
        >
          <View style={[styles.sheet, { backgroundColor: bg }]}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            <View style={[styles.header, { borderBottomColor: borderColor }]}>
              <Text style={[styles.title, { color: textColor }]}>Comments</Text>
              <TouchableOpacity style={styles.closeButton} onPress={close}>
                <X size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Comments list */}
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <ActivityIndicator
                  style={{ marginTop: 20 }}
                  color="#208AEF"
                />
              ) : comments.length === 0 ? (
                <Text style={[styles.emptyText, { color: subColor }]}>
                  No comments yet. Be the first to comment!
                </Text>
              ) : (
                comments.map((item) => (
                  <View key={item.id} style={styles.commentItem}>
                    <Text
                      style={{ color: subColor, fontSize: 13, fontWeight: 'bold' }}
                    >
                      User {item.user_id?.substring(0, 4)}...
                    </Text>
                    <Text style={{ color: textColor, marginTop: 4 }}>
                      {item.text}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Input footer */}
            <View
              style={[
                styles.inputRow,
                { borderTopColor: borderColor, backgroundColor: bg },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  { color: textColor, backgroundColor: inputBg },
                ]}
                placeholder="Add a comment..."
                placeholderTextColor={subColor}
                value={text}
                onChangeText={setText}
                onSubmitEditing={handlePost}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={handlePost}
                disabled={submitting || !text.trim()}
                style={styles.sendBtn}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#208AEF" />
                ) : (
                  <Send size={20} color={text.trim() ? '#208AEF' : subColor} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    minHeight: '50%',
    overflow: 'hidden',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#52525B',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8 },
  commentItem: { marginBottom: 16 },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: { marginLeft: 12, padding: 8 },
});
