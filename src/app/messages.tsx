import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { InboxList } from '@/components/chat/InboxList';
import { ChatView } from '@/components/chat/ChatView';

export default function MessagesScreen() {
  const { isDesktopWeb } = useBreakpoint();
  const isDark = useColorScheme() === 'dark';

  // Desktop split-view state
  const [selectedConvId, setSelectedConvId] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');

  // ── Desktop: True split-view ────────────────────────────────────────────────
  if (isDesktopWeb) {
    return (
      <View style={[styles.splitContainer, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
        {/* Left: Inbox list — fixed width */}
        <View style={styles.inboxColumn}>
          <InboxList
            selectedId={selectedConvId}
            onSelect={(convId, recipientId) => {
              setSelectedConvId(convId);
              setSelectedRecipientId(recipientId);
            }}
          />
        </View>

        {/* Right: Active chat or empty state */}
        <View style={styles.chatColumn}>
          <ChatView
            convId={selectedConvId}
            recipientId={selectedRecipientId}
            hideBack
          />
        </View>
      </View>
    );
  }

  // ── Mobile / Tablet: classic list screen ────────────────────────────────────
  return (
    <SafeAreaView style={[styles.mobileContainer, { backgroundColor: isDark ? '#09090B' : '#FFF' }]} edges={['top']}>
      <InboxList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Desktop
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  inboxColumn: {
    width: 340,
  },
  chatColumn: {
    flex: 1,
  },
  // Mobile
  mobileContainer: { flex: 1 },
});
