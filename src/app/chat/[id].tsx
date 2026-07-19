import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatView } from '@/components/chat/ChatView';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ChatScreen() {
  const { id, recipientId } = useLocalSearchParams<{ id: string; recipientId: string }>();
  const isDark = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#09090B' : '#FFF' }} edges={['top', 'bottom']}>
      <ChatView convId={id ?? ''} recipientId={recipientId ?? ''} hideBack={false} />
    </SafeAreaView>
  );
}
