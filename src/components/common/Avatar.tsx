import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  uri?: string;
  name: string;
  size?: number;
  showBorder?: boolean;
}

export function Avatar({ uri, name, size = 40, showBorder = false }: Props) {
  const isDark = useColorScheme() === 'dark';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: showBorder ? 2 : 0,
    borderColor: '#208AEF',
    overflow: 'hidden' as const,
    backgroundColor: isDark ? '#27272A' : '#E4E4E7',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <View style={containerStyle}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            { fontSize: size * 0.35, color: isDark ? '#A1A1AA' : '#71717A' },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  initials: { fontWeight: '700' },
});
