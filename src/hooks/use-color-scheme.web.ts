import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemColorScheme = useRNColorScheme() ?? 'light';

  if (hasHydrated) {
    if (theme === 'system') {
      return systemColorScheme;
    }
    return theme;
  }

  return 'light';
}
