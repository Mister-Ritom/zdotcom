import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {
  AlertTriangle,
  Share2,
  Bookmark,
  XCircle,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { zapService } from '@/services/zapService';
import { storyService } from '@/services/storyService';
import { useFeedStore } from '@/stores/useFeedStore';
import { router } from 'expo-router';
import { type OptionsContentType } from '@/contexts/OptionsSheetContext';
import { WebModal } from '@/components/WebModal';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export interface OptionsSheetProps {
  zapId?: string | null;
  contentType?: OptionsContentType;
  isOwner?: boolean;
  currentText?: string;
  currentMediaUrls?: string[];
  onClose?: () => void;
}

export const OptionsSheet = forwardRef<BottomSheetModal, OptionsSheetProps>(
  function OptionsSheet({ zapId, contentType = 'zap', isOwner = false, currentText = '', currentMediaUrls = [], onClose }, ref) {
    const isDark = useColorScheme() === 'dark';
    const snapPoints = useMemo(() => [isOwner ? '56%' : '42%'], [isOwner]);
    const { user: authUser } = useAuthStore();
    const [bookmarked, setBookmarked] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { removeZap } = useFeedStore();

    useEffect(() => {
      if (authUser?.id && zapId && contentType !== 'story') {
        zapService.isBookmarked(authUser.id, zapId).then(setBookmarked);
      }
    }, [authUser?.id, zapId, contentType]);

    const handleBookmark = async () => {
      if (!authUser?.id || !zapId) return;
      const next = !bookmarked;
      setBookmarked(next);
      await zapService.toggleBookmark(authUser.id, zapId);
      close();
    };

    const handleEdit = () => {
      close();
      if (!zapId) return;
      // Navigate to the editing screen with the content details
      router.push({
        pathname: '/editing',
        params: {
          id: zapId,
          type: contentType,
          text: currentText,
          mediaUrls: JSON.stringify(currentMediaUrls),
        },
      });
    };

    const handleDelete = () => {
      if (!zapId) return;
      const contentLabel =
        contentType === 'story' ? 'story' : contentType === 'short' ? 'short' : 'post';

      Alert.alert(
        `Delete ${contentLabel}`,
        `Are you sure you want to delete this ${contentLabel}? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setIsDeleting(true);
              try {
                if (contentType === 'story') {
                  await storyService.deleteStory(zapId);
                } else {
                  await zapService.deleteZap(zapId);
                  removeZap(zapId);
                }
                close();
              } catch {
                Alert.alert('Error', 'Failed to delete. Please try again.');
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ]
      );
    };

    const handleDismiss = useCallback(() => {
      onClose?.();
    }, [onClose]);

    const renderBackdrop = useCallback(
      (bp: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...bp} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      []
    );

    const close = () => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    };

    const textColor = isDark ? '#F4F4F5' : '#18181B';
    const iconColor = isDark ? '#A1A1AA' : '#52525B';
    const iconBg = isDark ? '#27272A' : '#F4F4F5';
    const subText = isDark ? '#71717A' : '#A1A1AA';

    const contentLabel =
      contentType === 'story' ? 'Story' : contentType === 'short' ? 'Short' : 'Post';

    const { isDesktopWeb } = useBreakpoint();

    const sheetContent = (
      <>
        {Platform.OS !== 'web' && (
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Options</Text>
            <Text style={[styles.headerSub, { color: subText }]}>{contentLabel}</Text>
          </View>
        )}

        {/* Owner-only actions */}
        {isOwner && (
          <>
            <TouchableOpacity style={styles.option} onPress={handleEdit} activeOpacity={0.7}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(32,138,239,0.12)' }]}>
                <Pencil size={20} color="#208AEF" />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionText, { color: textColor }]}>Edit {contentLabel}</Text>
                <Text style={[styles.optionHint, { color: subText }]}>
                  {contentType === 'zap' ? 'Change text or media' : 'Change caption'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={handleDelete}
              activeOpacity={0.7}
              disabled={isDeleting}
            >
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Trash2 size={20} color="#EF4444" />
                )}
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionText, { color: '#EF4444' }]}>
                  Delete {contentLabel}
                </Text>
                <Text style={[styles.optionHint, { color: subText }]}>
                  Permanently remove this {contentLabel.toLowerCase()}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />
          </>
        )}

        {/* Bookmark — only for zaps/shorts */}
        {contentType !== 'story' && (
          <TouchableOpacity style={styles.option} onPress={handleBookmark} activeOpacity={0.7}>
            <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
              <Bookmark
                size={22}
                color={bookmarked ? '#208AEF' : iconColor}
                fill={bookmarked ? '#208AEF' : 'none'}
              />
            </View>
            <Text style={[styles.optionText, { color: textColor }]}>
              {bookmarked ? 'Remove from Bookmarks' : 'Save to Bookmarks'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.option} onPress={close} activeOpacity={0.7}>
          <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
            <Share2 size={22} color={iconColor} />
          </View>
          <Text style={[styles.optionText, { color: textColor }]}>Share via…</Text>
        </TouchableOpacity>

        {!isOwner && (
          <TouchableOpacity style={styles.option} onPress={close} activeOpacity={0.7}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <AlertTriangle size={22} color="#EF4444" />
            </View>
            <Text style={[styles.optionText, { color: '#EF4444' }]}>Report content</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.option} onPress={close} activeOpacity={0.7}>
          <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
            <XCircle size={22} color={iconColor} />
          </View>
          <Text style={[styles.optionText, { color: textColor }]}>Cancel</Text>
        </TouchableOpacity>
      </>
    );

    if (isDesktopWeb) {
      return (
        <WebModal
          ref={ref as any}
          webTitle={`Options — ${contentLabel}`}
          onWebClose={onClose}
        >
          <View style={[styles.container, { paddingBottom: 20 }]}>
            {sheetContent}
          </View>
        </WebModal>
      );
    }

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: isDark ? '#18181B' : '#FFFFFF' }}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#52525B' : '#A1A1AA' }}
        enablePanDownToClose
        enableDynamicSizing={false}
      >
        <BottomSheetView style={styles.container}>
          {sheetContent}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 6 },
  header: { marginBottom: 14, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 16 },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: { flex: 1 },
  optionText: { fontSize: 16, fontWeight: '600' },
  optionHint: { fontSize: 12, fontWeight: '400', marginTop: 1 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#52525B',
    marginVertical: 8,
    opacity: 0.3,
  },
});
