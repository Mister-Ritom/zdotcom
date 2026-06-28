import { Dimensions, Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

export const getWindowWidth = () => Dimensions.get('window').width;

// Initial sync evaluation (can be used for initial state)
export const isDesktopWeb = isWeb && getWindowWidth() >= 768;

export const getIsDesktopWeb = () => isWeb && getWindowWidth() >= 768;
