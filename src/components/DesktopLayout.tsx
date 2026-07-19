import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useColorScheme } from '../hooks/use-color-scheme';

interface DesktopLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  hideRightPanel?: boolean;
}

export function DesktopLayout({ children, rightPanel, hideRightPanel = false }: DesktopLayoutProps) {
  const { isDesktopWeb } = useBreakpoint();
  const isDark = useColorScheme() === 'dark';

  if (!isDesktopWeb) {
    return <>{children}</>;
  }

  const border = isDark ? '#18181B' : '#E4E4E7';

  return (
    <View style={styles.webContainer}>
      <View style={styles.inner}>
        {/* Center Feed Column */}
        <View style={[styles.feedColumn, { borderRightColor: border, borderLeftColor: border }]}>
          {children}
        </View>

        {/* Right Sidebar Column */}
        {!hideRightPanel && (
          <View style={styles.rightColumn}>
            {rightPanel ? rightPanel : (
               <ScrollView style={styles.defaultRightPanel} showsVerticalScrollIndicator={false}>
                 {/* Empty state for right panel if none provided but not hidden */}
               </ScrollView>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 1040, // 640px for feed + 360px for right panel + 40px gap
    flexDirection: 'row',
    justifyContent: 'center',
  },
  feedColumn: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    height: '100%',
  },
  rightColumn: {
    width: 360,
    marginLeft: 32, // gap between feed and right panel
    height: '100%',
    paddingTop: 16,
  },
  defaultRightPanel: {
    flex: 1,
  }
});
