import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { WebModal, ModalBackdrop, ModalView } from '../WebModal';
import { AlertTriangle, Share2, Bookmark, XCircle } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import BottomSheet from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/stores/useAuthStore';
import { zapService } from '@/services/zapService';

export interface OptionsSheetProps {
  zapId?: string | null;
  onClose?: () => void;
}

export const OptionsSheet = forwardRef<BottomSheet, OptionsSheetProps>(function OptionsSheet({ zapId, onClose }, ref) {
  const isDark = useColorScheme() === 'dark';
  const snapPoints = useMemo(() => ['42%'], []);
  const { user: authUser } = useAuthStore();
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (authUser?.id && zapId) {
      zapService.isBookmarked(authUser.id, zapId).then(setBookmarked);
    }
  }, [authUser?.id, zapId]);

  const handleBookmark = async () => {
    if (!authUser?.id || !zapId) return;
    const next = !bookmarked;
    setBookmarked(next);
    await zapService.toggleBookmark(authUser.id, zapId);
    if (ref && 'current' in ref && ref.current) {
      ref.current.close();
    }
  };

  const handleAnimate = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex === -1) {
      onClose?.();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (bp: any) => <ModalBackdrop {...bp} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const close = () => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.close();
    }
  };

  const textColor = isDark ? '#F4F4F5' : '#18181B';
  const iconColor = isDark ? '#A1A1AA' : '#52525B';
  const iconBg = isDark ? '#27272A' : '#F4F4F5';

  return (
    <WebModal
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      onAnimate={handleAnimate}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: isDark ? '#18181B' : '#FFFFFF' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#52525B' : '#A1A1AA' }}
      enablePanDownToClose
      enableDynamicSizing={false}
      webTitle="Options"
      onWebClose={onClose}
    >
      <ModalView style={styles.container}>
        {Platform.OS !== 'web' && (
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Options</Text>
          </View>
        )}

        <TouchableOpacity style={styles.option} onPress={close} activeOpacity={0.7}>
          <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
            <Share2 size={22} color={iconColor} />
          </View>
          <Text style={[styles.optionText, { color: textColor }]}>Share via...</Text>
        </TouchableOpacity>
        
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
        
        <TouchableOpacity style={styles.option} onPress={close} activeOpacity={0.7}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <AlertTriangle size={22} color="#EF4444" />
          </View>
          <Text style={[styles.optionText, { color: '#EF4444' }]}>Report content</Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity style={styles.option} onPress={close} activeOpacity={0.7}>
          <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
            <XCircle size={22} color={iconColor} />
          </View>
          <Text style={[styles.optionText, { color: textColor }]}>Cancel</Text>
        </TouchableOpacity>
      </ModalView>
    </WebModal>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 6 },
  header: { marginBottom: 12, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 16 },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 16, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#52525B', marginVertical: 8, opacity: 0.3 },
});
