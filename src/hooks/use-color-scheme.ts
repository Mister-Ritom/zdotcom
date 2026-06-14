import { useColorScheme as useRNColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function useColorScheme(): 'light' | 'dark' {
  const systemColorScheme = useRNColorScheme() ?? 'light';
  const theme = useSettingsStore((state) => state.theme);

  if (theme === 'system') {
    return systemColorScheme;
  }
  return theme;
}
