import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, Bookmark, Share2, XCircle } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type BottomSheet from '@gorhom/bottom-sheet';

export interface OptionsSheetProps {
  onClose?: () => void;
}

// Web shim — exposes the same snapToIndex / close surface as BottomSheet
// so shorts.tsx needs zero changes at the call site.
export const OptionsSheet = forwardRef<BottomSheet, OptionsSheetProps>(
  ({ onClose }, ref) => {
    const isDark = useColorScheme() === 'dark';
    const [visible, setVisible] = useState(false);

    const open = useCallback(() => setVisible(true), []);

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

    const bg = isDark ? '#18181B' : '#FFFFFF';
    const textColor = isDark ? '#F4F4F5' : '#18181B';
    const iconColor = isDark ? '#A1A1AA' : '#52525B';

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

        <View style={styles.sheetWrapper}>
          <View style={[styles.sheet, { backgroundColor: bg }]}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            <View style={styles.container}>
              <TouchableOpacity style={styles.option} onPress={close}>
                <Share2 size={22} color={iconColor} />
                <Text style={[styles.optionText, { color: textColor }]}>
                  Share via...
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={close}>
                <Bookmark size={22} color={iconColor} />
                <Text style={[styles.optionText, { color: textColor }]}>
                  Save to Bookmarks
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={close}>
                <AlertTriangle size={22} color="#EF4444" />
                <Text style={[styles.optionText, { color: '#EF4444' }]}>
                  Report content
                </Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.option} onPress={close}>
                <XCircle size={22} color={iconColor} />
                <Text style={[styles.optionText, { color: textColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  container: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  optionText: { fontSize: 16, fontWeight: '600' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#52525B',
    marginVertical: 8,
    opacity: 0.5,
  },
});
