import { StyleSheet } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

/**
 * Global styles that can be reused across components
 */
export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Layout styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  // Spacing styles
  paddingHorizontal: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
  },
  
  paddingVertical: {
    paddingVertical: DIMENSIONS.PADDING_VERTICAL,
  },
  
  marginBottom: {
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  
  marginTop: {
    marginTop: DIMENSIONS.SPACE_LG,
  },
  
  // Typography styles
  title: {
    fontSize: TYPOGRAPHY.SIZE_HERO,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: COLORS.TEXT_SECONDARY,
  },
  
  bodyText: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: TYPOGRAPHY.LINE_HEIGHT_MD,
  },
  
  caption: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
  },
  
  // Button styles
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingHorizontal: DIMENSIONS.SPACE_LG,
    paddingVertical: DIMENSIONS.SPACE_MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  buttonSecondary: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  
  buttonDisabled: {
    opacity: 0.6,
  },
  
  // Card styles
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  
  cardShadow: {
    shadowColor: COLORS.BACKGROUND,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Input styles
  input: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_MD,
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  
  inputFocused: {
    borderColor: COLORS.PRIMARY,
  },
  
  inputError: {
    borderColor: COLORS.ERROR,
  },
  
  // List styles
  listContainer: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: 100,
  },
  
  listSeparator: {
    height: 1,
    backgroundColor: COLORS.BORDER_PRIMARY,
    marginVertical: DIMENSIONS.SPACE_SM,
  },
  
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.SPACE_XL,
  },
  
  emptyContainer: {
    paddingVertical: DIMENSIONS.SPACE_XXXL,
    alignItems: 'center',
  },
  
  // Header styles
  header: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingTop: DIMENSIONS.SPACE_LG,
    paddingBottom: DIMENSIONS.SPACE_LG,
  },
  
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingTop: DIMENSIONS.SPACE_LG,
    paddingBottom: DIMENSIONS.SPACE_LG,
  },
  
  // Badge styles
  badge: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_FULL,
    paddingHorizontal: DIMENSIONS.SPACE_MD,
    paddingVertical: DIMENSIONS.SPACE_XS,
  },
  
  badgeText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  // Overlay styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Image styles
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  
  thumbnailImage: {
    width: DIMENSIONS.THUMBNAIL_SIZE,
    height: DIMENSIONS.THUMBNAIL_SIZE,
    borderRadius: DIMENSIONS.RADIUS_SM,
  },
});

/**
 * Utility functions for dynamic styles
 */
export const createSpacing = (size: number) => ({
  margin: size,
});

export const createPadding = (size: number) => ({
  padding: size,
});

export const createBorderRadius = (size: number) => ({
  borderRadius: size,
});

export const createShadow = (elevation: number) => ({
  shadowColor: COLORS.BACKGROUND,
  shadowOffset: {
    width: 0,
    height: elevation / 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: elevation,
  elevation,
});