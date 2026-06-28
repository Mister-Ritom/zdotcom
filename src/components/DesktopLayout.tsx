import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  const { isDesktopWeb } = useBreakpoint();

  if (!isDesktopWeb) {
    return <>{children}</>;
  }

  return (
    <View style={styles.webContainer}>
      <View style={styles.content}>
        {children}
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
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    paddingHorizontal: 32,
  },
});
