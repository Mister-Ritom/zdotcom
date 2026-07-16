import React from 'react';
import { OptionsSheetProvider, useOptionsSheet } from '@/contexts/OptionsSheetContext';
import { OptionsSheet } from '@/components/sheets/OptionsSheet';


/**
 * Inner component that reads the context and renders the single shared modal.
 * Must be a child of OptionsSheetProvider so it can access the context.
 */
function OptionsSheetRenderer() {
  const { sheetRef, activeZapId, contentType, isOwner, currentText, currentMediaUrls, onCloseCallback } = useOptionsSheet();

  return (
    <OptionsSheet
      ref={sheetRef}
      zapId={activeZapId}
      contentType={contentType}
      isOwner={isOwner}
      currentText={currentText}
      currentMediaUrls={currentMediaUrls}
      onClose={onCloseCallback}
    />
  );
}

/**
 * Drop this once inside BottomSheetModalProvider (i.e. in _layout.tsx).
 * It sets up the provider and renders the single OptionsSheet modal that all
 * cards share — preventing the "pip inside card" issue.
 */
export function GlobalOptionsSheet({ children }: { children: React.ReactNode }) {
  return (
    <OptionsSheetProvider>
      {children}
      <OptionsSheetRenderer />
    </OptionsSheetProvider>
  );
}
