import { Dimensions, PixelRatio } from 'react-native';

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

// Based on iPhone 14 Pro Max (reference screen size)
const REFERENCE_WIDTH = 430;
const REFERENCE_HEIGHT = 932;

const scaleWidth = SCREEN_WIDTH / REFERENCE_WIDTH;
const scaleHeight = SCREEN_HEIGHT / REFERENCE_HEIGHT;

// Function to adjust values (e.g., font sizes, margins, paddings)
// It scales the given size based on the screen width, ensuring responsiveness.
export function adjust(size: number, basedOn: 'width' | 'height' = 'width') {
  const newSize = basedOn === 'height' ? size * scaleHeight : size * scaleWidth;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}