import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Dynamic dimensions and spacing constants
 */
export const DIMENSIONS = {
  // Screen dimensions
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  
  // Common spacing values
  SPACE_XS: 4,
  SPACE_SM: 8,
  SPACE_MD: 12,
  SPACE_LG: 16,
  SPACE_XL: 20,
  SPACE_XXL: 24,
  SPACE_XXXL: 32,
  
  // Padding values
  PADDING_HORIZONTAL: 20,
  PADDING_VERTICAL: 16,
  
  // Border radius
  RADIUS_SM: 8,
  RADIUS_MD: 12,
  RADIUS_LG: 16,
  RADIUS_XL: 20,
  RADIUS_XXL: 24,
  RADIUS_FULL: 9999,
  
  // Icon sizes
  ICON_XS: 12,
  ICON_SM: 16,
  ICON_MD: 20,
  ICON_LG: 24,
  ICON_XL: 32,
  ICON_XXL: 48,
  
  // Button heights
  BUTTON_HEIGHT_SM: 36,
  BUTTON_HEIGHT_MD: 44,
  BUTTON_HEIGHT_LG: 52,
  
  // Card dimensions
  CARD_MIN_HEIGHT: 120,
  CARD_MAX_WIDTH: SCREEN_WIDTH - 40,
  
  // Tab bar
  TAB_BAR_HEIGHT: 88,
  
  // Header
  HEADER_HEIGHT: 56,
  
  // Thumbnail size
  THUMBNAIL_SIZE: 150,
} as const;

/**
 * Grid system for responsive layouts
 */
export const GRID = {
  // Columns for different layouts
  COLUMNS_2: 2,
  COLUMNS_3: 3,
  COLUMNS_4: 4,
  
  // Calculate card width based on columns and spacing
  getCardWidth: (columns: number, spacing: number = DIMENSIONS.SPACE_LG) => {
    const totalSpacing = spacing * (columns + 1);
    return (SCREEN_WIDTH - totalSpacing) / columns;
  },
  
  // Calculate item spacing for grids
  getItemSpacing: (columns: number) => {
    return (SCREEN_WIDTH - DIMENSIONS.PADDING_HORIZONTAL * 2) / columns;
  },
} as const;

/**
 * Typography scale
 */
export const TYPOGRAPHY = {
  // Font sizes
  SIZE_XS: 10,
  SIZE_SM: 12,
  SIZE_MD: 14,
  SIZE_LG: 16,
  SIZE_XL: 18,
  SIZE_XXL: 20,
  SIZE_XXXL: 24,
  SIZE_TITLE: 28,
  SIZE_HERO: 32,
  SIZE_DISPLAY: 48,
  
  // Line heights
  LINE_HEIGHT_SM: 16,
  LINE_HEIGHT_MD: 20,
  LINE_HEIGHT_LG: 24,
  LINE_HEIGHT_XL: 28,
  LINE_HEIGHT_XXL: 32,
  
  // Font weights
  WEIGHT_REGULAR: '400' as const,
  WEIGHT_MEDIUM: '500' as const,
  WEIGHT_SEMIBOLD: '600' as const,
  WEIGHT_BOLD: '700' as const,
} as const;