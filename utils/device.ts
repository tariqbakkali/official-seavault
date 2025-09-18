import { Platform, Dimensions } from 'react-native';

/**
 * Device and platform utilities
 */

export const DEVICE_INFO = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',
  
  get screenDimensions() {
    return Dimensions.get('window');
  },
  
  get isTablet() {
    const { width, height } = this.screenDimensions;
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    return aspectRatio < 1.6 && Math.min(width, height) > 600;
  },
  
  get isLandscape() {
    const { width, height } = this.screenDimensions;
    return width > height;
  },
} as const;

/**
 * Get safe area style for different platforms
 */
export const getSafeAreaStyle = (insets: { top: number; bottom: number }) => ({
  paddingTop: insets.top,
  paddingBottom: insets.bottom,
});

/**
 * Check if device supports biometric authentication
 */
export const supportsBiometrics = async (): Promise<boolean> => {
  // TODO: Implement biometric support check
  return false;
};

/**
 * Get platform-specific styles
 */
export const getPlatformStyle = <T>(styles: {
  ios?: T;
  android?: T;
  web?: T;
  default?: T;
}): T | undefined => {
  if (DEVICE_INFO.isIOS && styles.ios) return styles.ios;
  if (DEVICE_INFO.isAndroid && styles.android) return styles.android;
  if (DEVICE_INFO.isWeb && styles.web) return styles.web;
  return styles.default;
};