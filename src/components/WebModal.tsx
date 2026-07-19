import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Platform, Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, FlatList, TextInput, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetProps, BottomSheetFlatList, BottomSheetTextInput, BottomSheetView, BottomSheetFooter, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { isWeb } from '@/utils/platform';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export interface WebModalProps extends BottomSheetProps {
  webTitle?: string;
  onWebClose?: () => void;
  footerComponent?: any;
}

// ─── Desktop Web Implementation ────────────────────────────────────────────────
// Separate component so hooks are called unconditionally.

const DesktopWebModal = forwardRef<BottomSheet, WebModalProps>(
  ({ children, webTitle, onWebClose, footerComponent }, ref) => {
    const isDark = useColorScheme() === 'dark';
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const open = useCallback(() => setVisible(true), []);
    const close = useCallback(() => {
      setVisible(false);
      onWebClose?.();
    }, [onWebClose]);

    useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => {
        if (index >= 0) open();
        else close();
      },
      present: open,
      dismiss: close,
      close,
      expand: open,
      collapse: close,
      forceClose: close,
    }) as unknown as BottomSheet, [open, close]);

    useEffect(() => {
      if (!visible || Platform.OS !== 'web') return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [visible, close]);

    // Handle drag
    useEffect(() => {
      if (Platform.OS !== 'web') return;

      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          setPosition(prev => ({
            x: prev.x + (e.clientX - dragStart.x),
            y: prev.y + (e.clientY - dragStart.y)
          }));
          setDragStart({ x: e.clientX, y: e.clientY });
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, dragStart]);

    const handleMouseDown = (e: any) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const bg = isDark ? '#18181B' : '#FFFFFF';
    const textColor = isDark ? '#F4F4F5' : '#18181B';
    const borderColor = isDark ? '#27272A' : '#E4E4E7';

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.webBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View
            style={[
              styles.webWindow,
              { backgroundColor: bg, borderColor },
              { transform: [{ translateX: position.x }, { translateY: position.y }] }
            ]}
          >
            {/* Header */}
            <View
              style={[styles.webHeader, { borderBottomColor: borderColor }]}
              // @ts-ignore — web-only mouse event
              onMouseDown={handleMouseDown}
            >
              <Text style={[styles.webTitle, { color: textColor }]}>{webTitle}</Text>
              <TouchableOpacity onPress={close} style={styles.webCloseBtn}>
                <X size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.webContent}>
              {children}
            </View>

            {/* Footer */}
            {footerComponent && (
              <View style={styles.webFooter}>
                {footerComponent({})}
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }
);
DesktopWebModal.displayName = 'DesktopWebModal';

// ─── Native / Mobile Web Implementation ────────────────────────────────────────

const NativeModal = forwardRef<BottomSheet, WebModalProps>(
  ({ children, webTitle: _wt, onWebClose: _owc, footerComponent, ...props }, ref) => {
    return (
      <BottomSheet ref={ref} footerComponent={footerComponent} {...props}>
        {children}
      </BottomSheet>
    );
  }
);
NativeModal.displayName = 'NativeModal';

// ─── Exported WebModal — delegates based on breakpoint ─────────────────────────

export const WebModal = forwardRef<BottomSheet, WebModalProps>((props, ref) => {
  const { isDesktopWeb } = useBreakpoint();
  if (isDesktopWeb) {
    return <DesktopWebModal ref={ref} {...props} />;
  }
  return <NativeModal ref={ref} {...props} />;
});
WebModal.displayName = 'WebModal';

// Polyfills for inner components so we can use them in both Web (regular views) and Native (BottomSheet views)
export const ModalFlatList = isWeb ? FlatList : BottomSheetFlatList;
export const ModalTextInput = isWeb ? TextInput : BottomSheetTextInput;
export const ModalView = isWeb ? View : BottomSheetView;

const WebModalBackdrop = () => null;
WebModalBackdrop.displayName = 'ModalBackdrop';
export const ModalBackdrop = isWeb ? WebModalBackdrop : BottomSheetBackdrop;

const WebModalFooter = ({ children }: any) => <>{children}</>;
WebModalFooter.displayName = 'ModalFooter';
export const ModalFooter = isWeb ? WebModalFooter : BottomSheetFooter;

const styles = StyleSheet.create({
  webBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webWindow: {
    width: '100%',
    minWidth: Math.min(400, Dimensions.get('window').width - 32),
    maxWidth: 600,
    maxHeight: '80%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    cursor: (Platform.OS === 'web' ? 'grab' : 'default') as any,
  },
  webTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  webCloseBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
    cursor: (Platform.OS === 'web' ? 'pointer' : 'default') as any,
  },
  webContent: {
    flexShrink: 1,
  },
  webFooter: {
    // Footer styles
  },
});
