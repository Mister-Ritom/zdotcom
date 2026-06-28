import { useWindowDimensions } from 'react-native';
import { isWeb } from '../utils/platform';

export function useBreakpoint() {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1200;
  const isDesktop = width >= 1200;

  // The prompt defines isDesktopWeb as web + viewport >= 768px (which encompasses tablet and desktop).
  // But we expose the granular ones here too.
  const isDesktopWeb = isWeb && !isMobile;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isDesktopWeb,
  };
}
