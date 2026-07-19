import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export interface ShowSendParams {
  zapId: string;
  zapText?: string;
  onClose?: () => void;
}

interface SendSheetContextType {
  showSend: (params: ShowSendParams) => void;
  dismiss: () => void;
  activeZapId: string | null;
  activeZapText: string;
  sheetRef: React.RefObject<any>;
  onCloseCallback?: () => void;
}

const defaultContext: SendSheetContextType = {
  showSend: () => {},
  dismiss: () => {},
  activeZapId: null,
  activeZapText: '',
  sheetRef: { current: null } as any,
  onCloseCallback: undefined,
};

export const SendSheetContext = createContext<SendSheetContextType>(defaultContext);

export function SendSheetProvider({ children }: { children: React.ReactNode }) {
  const sheetRef = useRef<any>(null);
  const [activeZapId, setActiveZapId] = useState<string | null>(null);
  const [activeZapText, setActiveZapText] = useState('');
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | undefined>(undefined);

  const showSend = useCallback((params: ShowSendParams) => {
    setActiveZapId(params.zapId);
    setActiveZapText(params.zapText ?? '');
    setOnCloseCallback(() => params.onClose);
    setTimeout(() => {
      if (sheetRef.current) {
        if (typeof sheetRef.current.present === 'function') {
          sheetRef.current.present();
        } else if (typeof sheetRef.current.snapToIndex === 'function') {
          sheetRef.current.snapToIndex(0);
        }
      }
    }, 0);
  }, []);

  const dismiss = useCallback(() => {
    if (sheetRef.current) {
      if (typeof sheetRef.current.dismiss === 'function') {
        sheetRef.current.dismiss();
      } else if (typeof sheetRef.current.close === 'function') {
        sheetRef.current.close();
      }
    }
  }, []);

  const value = useMemo<SendSheetContextType>(
    () => ({ showSend, dismiss, activeZapId, activeZapText, sheetRef, onCloseCallback }),
    [showSend, dismiss, activeZapId, activeZapText, onCloseCallback]
  );

  return (
    <SendSheetContext.Provider value={value}>
      {children}
    </SendSheetContext.Provider>
  );
}

export const useSendSheet = () => useContext(SendSheetContext);
