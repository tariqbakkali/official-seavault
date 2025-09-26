import { StyleSheet } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY, GRID } from '@/constants';

/**
 * Component-specific styles
 */
export const componentStyles = StyleSheet.create({
  // Tab Bar
  tabBar: {
    backgroundColor: COLORS.SURFACE,
    borderTopColor: COLORS.BORDER_PRIMARY,
    borderTopWidth: 1,
    height: DIMENSIONS.TAB_BAR_HEIGHT,
    paddingBottom: DIMENSIONS.SPACE_XXL,
    paddingTop: DIMENSIONS.SPACE_SM,
  },
  
  tabLabel: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
  },
  
  // Cards
  categoryCard: {
    width: GRID.getCardWidth(2),
    height: 200,
    borderRadius: DIMENSIONS.RADIUS_LG,
    marginBottom: DIMENSIONS.SPACE_XL,
    overflow: 'hidden',
    position: 'relative',
  },
  
  creatureCard: {
    width: GRID.getCardWidth(3),
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    marginBottom: DIMENSIONS.SPACE_XL,
    overflow: 'hidden',
  },
  
  statCard: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_LG,
    padding: DIMENSIONS.SPACE_XL,
    alignItems: 'center',
    gap: DIMENSIONS.SPACE_SM,
  },
  
  // Image containers
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  
  heroImageContainer: {
    height: 200, // DIMENSIONS.HERO_IMAGE_HEIGHT is not defined, using a fixed value
    position: 'relative',
  },
  
  thumbnailContainer: {
    width: DIMENSIONS.THUMBNAIL_SIZE,
    height: DIMENSIONS.THUMBNAIL_SIZE,
    borderRadius: DIMENSIONS.RADIUS_SM,
    overflow: 'hidden',
  },
  
  // Buttons
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  floatingButton: {
    position: 'absolute',
    bottom: DIMENSIONS.SPACE_XL,
    right: DIMENSIONS.SPACE_XL,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.BACKGROUND,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  
  // Form components
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_SM,
    paddingHorizontal: DIMENSIONS.SPACE_MD,
    gap: DIMENSIONS.SPACE_MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: COLORS.TEXT_PRIMARY,
    paddingVertical: DIMENSIONS.SPACE_MD,
  },
  
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  
  dropdownMenu: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_SM,
    marginTop: DIMENSIONS.SPACE_XS,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  
  dropdownItem: {
    padding: DIMENSIONS.SPACE_MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  
  // Progress indicators
  progressBar: {
    height: 4,
    backgroundColor: COLORS.BORDER_PRIMARY,
    borderRadius: 2,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 2,
  },
  
  // Badges and labels
  completionBadge: {
    position: 'absolute',
    top: DIMENSIONS.SPACE_LG,
    right: DIMENSIONS.SPACE_LG,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: DIMENSIONS.SPACE_SM,
    paddingVertical: DIMENSIONS.SPACE_XS,
    borderRadius: DIMENSIONS.RADIUS_MD,
  },
  
  pointsBadge: {
    backgroundColor: COLORS.SECONDARY,
    paddingHorizontal: DIMENSIONS.SPACE_MD,
    paddingVertical: DIMENSIONS.SPACE_SM,
    borderRadius: DIMENSIONS.RADIUS_MD,
    alignItems: 'center',
    minWidth: 64,
  },
  
  statusBadge: {
    position: 'absolute',
    top: DIMENSIONS.SPACE_SM,
    right: DIMENSIONS.SPACE_SM,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // List items
  listItem: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    marginBottom: DIMENSIONS.SPACE_MD,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  listItemContent: {
    flex: 1,
    marginLeft: DIMENSIONS.SPACE_MD,
  },
  
  // Gradients
  overlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DIMENSIONS.SPACE_XL,
  },
});

/**
 * Grid layout helpers
 */
export const gridStyles = StyleSheet.create({
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  gridItem2: {
    width: GRID.getCardWidth(2),
  },
  
  gridItem3: {
    width: GRID.getCardWidth(3),
  },
  
  columnWrapper: {
    justifyContent: 'space-between',
  },
});