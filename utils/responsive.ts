import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Reference device — iPhone 14 Pro Max
const REFERENCE_WIDTH = 430;
const REFERENCE_HEIGHT = 932;

// Base scale ratios
const scaleWidth = SCREEN_WIDTH / REFERENCE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / REFERENCE_HEIGHT;

// Helper: detect tablet
const isTablet = SCREEN_WIDTH >= 768;

// --- Core scaling functions ---
/**
 * Scales a size based on screen width or height.
 * Keeps proportional layout for all devices.
 */
export function adjust(size: number, basedOn: 'width' | 'height' = 'width') {
  const scale = basedOn === 'height' ? scaleHeight : scaleWidth;
  const newSize = size * scale;

  // For tablets — slightly reduce scaling to avoid oversized UI
  const normalized = isTablet ? newSize * 0.8 : newSize;

  return Math.round(PixelRatio.roundToNearestPixel(normalized));
}

/**
 * Normalizes font size for consistent text appearance.
 * Prevents fonts from being too large or too small.
 */
export function normalizeFont(size: number) {
  let newSize = size * scaleWidth;

  if (isTablet) newSize *= 0.85; // slightly reduce on tablets
  if (Platform.OS === 'android') {
    newSize = newSize - 1; // small tweak for Android scaling
  }

  // Clamp between reasonable limits
  const min = size * 0.8;
  const max = size * 1.3;
  const clamped = Math.max(min, Math.min(newSize, max));

  return Math.round(PixelRatio.roundToNearestPixel(clamped));
}

/**
 * Helper to get responsive spacing values.
 * Example: margin, padding, borderRadius, etc.
 */
export function spacing(size: number) {
  return adjust(size, 'width');
}

// Export screen metrics
export { SCREEN_WIDTH, SCREEN_HEIGHT, isTablet };
