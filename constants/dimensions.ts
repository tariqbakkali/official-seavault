import { adjust, normalizeFont, spacing } from '@/utils/responsive';
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
  SPACE_XS: spacing(4),
  SPACE_SM: spacing(8),
  SPACE_MD: spacing(12),
  SPACE_LG: spacing(16),
  SPACE_XL: spacing(20),
  SPACE_XXL: spacing(24),
  SPACE_XXXL: spacing(32),
  SPACE_40: spacing(40),
  SPACE_48: spacing(48),
  SPACE_50: spacing(50),
  SPACE_60: spacing(60),
  
  // Padding values
  PADDING_HORIZONTAL: spacing(20),
  PADDING_VERTICAL: spacing(16),
  PADDING_XS: spacing(4),
  PADDING_SM: spacing(8),
  PADDING_MD: spacing(12),
  PADDING_LG: spacing(16),
  PADDING_XL: spacing(20),
  PADDING_XXL: spacing(24),
  PADDING_XXXL: spacing(32),
  
  // Margin values
  MARGIN_XS: spacing(4),
  MARGIN_SM: spacing(8),
  MARGIN_MD: spacing(12),
  MARGIN_LG: spacing(16),
  MARGIN_XL: spacing(20),
  MARGIN_XXL: spacing(24),
  MARGIN_XXXL: spacing(32),
  MARGIN_40: spacing(40),
  MARGIN_50: spacing(50),
  MARGIN_60: spacing(60),
  
  // Gap values
  GAP_XS: spacing(4),
  GAP_SM: spacing(8),
  GAP_MD: spacing(12),
  GAP_LG: spacing(16),
  GAP_XL: spacing(20),
  GAP_XXL: spacing(24),
  GAP_XXXL: spacing(32),
  
  // Border radius
  RADIUS_XS: spacing(2),
  RADIUS_SM: spacing(8),
  RADIUS_MD: spacing(12),
  RADIUS_LG: spacing(16),
  RADIUS_XL: spacing(20),
  RADIUS_XXL: spacing(24),
  RADIUS_FULL: spacing(9999),
  
  // Icon sizes
  ICON_XS: spacing(12),
  ICON_SM: spacing(16),
  ICON_MD: spacing(20),
  ICON_LG: spacing(24),
  ICON_XL: spacing(32),
  ICON_XXL: spacing(48),
  
  // Button heights
  BUTTON_HEIGHT_SM: spacing(36),
  BUTTON_HEIGHT_MD: spacing(48),
  BUTTON_HEIGHT_LG: spacing(52),
  
  // Card dimensions
  CARD_MIN_HEIGHT: spacing(120),
  CARD_MAX_WIDTH: spacing(SCREEN_WIDTH - 40),
  
  // Tab bar
  TAB_BAR_HEIGHT: spacing(88),
  
  // Header
  HEADER_HEIGHT: spacing(56),
  
  // Thumbnail size
  THUMBNAIL_SIZE: spacing(150),
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
  SIZE_XS: normalizeFont(10),
  SIZE_SM: normalizeFont(12),
  SIZE_MD: normalizeFont(14),
  SIZE_LG: normalizeFont(16),
  SIZE_XL: normalizeFont(18),
  SIZE_XXL: normalizeFont(20),
  SIZE_XXXL: normalizeFont(24),
  SIZE_TITLE: normalizeFont(28),
  SIZE_HERO: normalizeFont(32),
  SIZE_DISPLAY: normalizeFont(48),
  
  // Line heights
  LINE_HEIGHT_SM: normalizeFont(16),
  LINE_HEIGHT_MD: normalizeFont(20),
  LINE_HEIGHT_LG: normalizeFont(24),
  LINE_HEIGHT_XL: normalizeFont(28),
  LINE_HEIGHT_XXL: normalizeFont(32),
  
  // Font weights
  WEIGHT_REGULAR: '400' as const,
  WEIGHT_MEDIUM: '500' as const,
  WEIGHT_SEMIBOLD: '600' as const,
  WEIGHT_BOLD: '700' as const,
} as const;