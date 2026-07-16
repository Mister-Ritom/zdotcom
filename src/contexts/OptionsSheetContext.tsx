import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

export type OptionsContentType = 'zap' | 'short' | 'story';

export interface ShowOptionsParams {
  zapId: string;
  contentType?: OptionsContentType;
  isOwner?: boolean;
  currentText?: string;
  currentMediaUrls?: string[];
  onClose?: () => void;
}

interface OptionsSheetContextType {
  showOptions: (params: ShowOptionsParams) => void;
  dismiss: () => void;
  activeZapId: string | null;
  contentType: OptionsContentType;
  isOwner: boolean;
  currentText: string;
  currentMediaUrls: string[];
  sheetRef: React.RefObject<BottomSheetModal | null>;
  onCloseCallback?: () => void;
}

const defaultContext: OptionsSheetContextType = {
  showOptions: () => {},
  dismiss: () => {},
  activeZapId: null,
  contentType: 'zap',
  isOwner: false,
  currentText: '',
  currentMediaUrls: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sheetRef: { current: null } as any,
  onCloseCallback: undefined,
};

export const OptionsSheetContext = createContext<OptionsSheetContextType>(defaultContext);

export function OptionsSheetProvider({ children }: { children: React.ReactNode }) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [activeZapId, setActiveZapId] = useState<string | null>(null);
  const [contentType, setContentType] = useState<OptionsContentType>('zap');
  const [isOwner, setIsOwner] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentMediaUrls, setCurrentMediaUrls] = useState<string[]>([]);
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | undefined>(undefined);

  const showOptions = useCallback((params: ShowOptionsParams) => {
    setActiveZapId(params.zapId);
    setContentType(params.contentType ?? 'zap');
    setIsOwner(params.isOwner ?? false);
    setCurrentText(params.currentText ?? '');
    setCurrentMediaUrls(params.currentMediaUrls ?? []);
    setOnCloseCallback(() => params.onClose);
    sheetRef.current?.present();
  }, []);

  const dismiss = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const value = useMemo<OptionsSheetContextType>(
    () => ({ showOptions, dismiss, activeZapId, contentType, isOwner, currentText, currentMediaUrls, sheetRef, onCloseCallback }),
    [showOptions, dismiss, activeZapId, contentType, isOwner, currentText, currentMediaUrls, onCloseCallback]
  );

  return (
    <OptionsSheetContext.Provider value={value}>
      {children}
    </OptionsSheetContext.Provider>
  );
}

export const useOptionsSheet = () => useContext(OptionsSheetContext);
