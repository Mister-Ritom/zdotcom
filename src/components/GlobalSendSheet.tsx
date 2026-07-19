import React from 'react';
import { SendSheetProvider, useSendSheet } from '@/contexts/SendSheetContext';
import { SendSheet } from '@/components/sheets/SendSheet';

/**
 * Inner component that reads the context and renders the single shared SendSheet modal.
 * Must be a child of SendSheetProvider so it can access the context.
 */
function SendSheetRenderer() {
  const { sheetRef, activeZapId, activeZapText, onCloseCallback } = useSendSheet();

  return (
    <SendSheet
      ref={sheetRef}
      zapId={activeZapId}
      zapText={activeZapText}
      onClose={onCloseCallback}
    />
  );
}

/**
 * Drop this once inside BottomSheetModalProvider right next to GlobalOptionsSheet (i.e. in _layout.tsx).
 * It sets up the provider and renders the single SendSheet modal that all
 * cards share — preventing the modal from rendering inside card containers on mobile.
 */
export function GlobalSendSheet({ children }: { children: React.ReactNode }) {
  return (
    <SendSheetProvider>
      {children}
      <SendSheetRenderer />
    </SendSheetProvider>
  );
}
