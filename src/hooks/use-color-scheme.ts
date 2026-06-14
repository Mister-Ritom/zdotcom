import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useColorScheme(): 'light' | 'dark' {
  const raw = useRNColorScheme();
  const systemColorScheme: 'light' | 'dark' = raw === 'dark' ? 'dark' : 'light';
  const theme = useSettingsStore((state) => state.theme);

  if (theme === 'system') {
    return systemColorScheme;
  }
  return theme;
}
