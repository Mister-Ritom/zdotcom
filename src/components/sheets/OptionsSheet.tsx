import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { AlertTriangle, Share2, Bookmark, XCircle } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const OptionsSheet = forwardRef<BottomSheet, any>((props, ref) => {
  const isDark = useColorScheme() === 'dark';
  const snapPoints = useMemo(() => ['35%'], []);

  const renderBackdrop = useCallback(
    (bp: any) => <BottomSheetBackdrop {...bp} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const close = () => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.close();
    }
  };

  const textColor = isDark ? '#F4F4F5' : '#18181B';
  const iconColor = isDark ? '#A1A1AA' : '#52525B';

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: isDark ? '#18181B' : '#FFFFFF' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#52525B' : '#A1A1AA' }}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.container}>
        <TouchableOpacity style={styles.option} onPress={close}>
          <Share2 size={22} color={iconColor} />
          <Text style={[styles.optionText, { color: textColor }]}>Share via...</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={close}>
          <Bookmark size={22} color={iconColor} />
          <Text style={[styles.optionText, { color: textColor }]}>Save to Bookmarks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={close}>
          <AlertTriangle size={22} color="#EF4444" />
          <Text style={[styles.optionText, { color: '#EF4444' }]}>Report content</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.option} onPress={close}>
          <XCircle size={22} color={iconColor} />
          <Text style={[styles.optionText, { color: textColor }]}>Cancel</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 16 },
  optionText: { fontSize: 16, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#52525B', marginVertical: 8, opacity: 0.5 },
});
