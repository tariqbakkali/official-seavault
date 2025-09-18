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
})
  // Image containers\n  imageContainer: {\n    width: '100%',\n    height: '100%',\n  },\n  \n  heroImageContainer: {\n    height: DIMENSIONS.HERO_IMAGE_HEIGHT,\n    position: 'relative',\n  },\n  \n  thumbnailContainer: {\n    width: DIMENSIONS.THUMBNAIL_SIZE,\n    height: DIMENSIONS.THUMBNAIL_SIZE,\n    borderRadius: DIMENSIONS.RADIUS_SM,\n    overflow: 'hidden',\n  },\n  \n  // Buttons\n  backButton: {\n    width: 40,\n    height: 40,\n    borderRadius: 20,\n    backgroundColor: COLORS.SURFACE,\n    justifyContent: 'center',\n    alignItems: 'center',\n  },\n  \n  floatingButton: {\n    position: 'absolute',\n    bottom: DIMENSIONS.SPACE_XL,\n    right: DIMENSIONS.SPACE_XL,\n    width: 56,\n    height: 56,\n    borderRadius: 28,\n    backgroundColor: COLORS.PRIMARY,\n    justifyContent: 'center',\n    alignItems: 'center',\n    elevation: 8,\n    shadowColor: COLORS.BACKGROUND,\n    shadowOffset: {\n      width: 0,\n      height: 4,\n    },\n    shadowOpacity: 0.3,\n    shadowRadius: 5,\n  },\n  \n  // Form components\n  inputContainer: {\n    flexDirection: 'row',\n    alignItems: 'center',\n    backgroundColor: COLORS.SURFACE,\n    borderRadius: DIMENSIONS.RADIUS_SM,\n    paddingHorizontal: DIMENSIONS.SPACE_MD,\n    gap: DIMENSIONS.SPACE_MD,\n    borderWidth: 1,\n    borderColor: COLORS.BORDER_PRIMARY,\n  },\n  \n  searchInput: {\n    flex: 1,\n    fontSize: TYPOGRAPHY.SIZE_LG,\n    color: COLORS.TEXT_PRIMARY,\n    paddingVertical: DIMENSIONS.SPACE_MD,\n  },\n  \n  dropdown: {\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    backgroundColor: COLORS.SURFACE,\n    borderRadius: DIMENSIONS.RADIUS_SM,\n    padding: DIMENSIONS.SPACE_MD,\n    borderWidth: 1,\n    borderColor: COLORS.BORDER_PRIMARY,\n  },\n  \n  dropdownMenu: {\n    backgroundColor: COLORS.SURFACE,\n    borderRadius: DIMENSIONS.RADIUS_SM,\n    marginTop: DIMENSIONS.SPACE_XS,\n    maxHeight: 200,\n    borderWidth: 1,\n    borderColor: COLORS.BORDER_PRIMARY,\n  },\n  \n  dropdownItem: {\n    padding: DIMENSIONS.SPACE_MD,\n    borderBottomWidth: 1,\n    borderBottomColor: COLORS.BORDER_PRIMARY,\n  },\n  \n  // Progress indicators\n  progressBar: {\n    height: 4,\n    backgroundColor: COLORS.BORDER_PRIMARY,\n    borderRadius: 2,\n  },\n  \n  progressFill: {\n    height: '100%',\n    backgroundColor: COLORS.PRIMARY,\n    borderRadius: 2,\n  },\n  \n  // Badges and labels\n  completionBadge: {\n    position: 'absolute',\n    top: DIMENSIONS.SPACE_LG,\n    right: DIMENSIONS.SPACE_LG,\n    backgroundColor: 'rgba(0, 0, 0, 0.7)',\n    paddingHorizontal: DIMENSIONS.SPACE_SM,\n    paddingVertical: DIMENSIONS.SPACE_XS,\n    borderRadius: DIMENSIONS.RADIUS_MD,\n  },\n  \n  pointsBadge: {\n    backgroundColor: COLORS.SECONDARY,\n    paddingHorizontal: DIMENSIONS.SPACE_MD,\n    paddingVertical: DIMENSIONS.SPACE_SM,\n    borderRadius: DIMENSIONS.RADIUS_MD,\n    alignItems: 'center',\n    minWidth: 64,\n  },\n  \n  statusBadge: {\n    position: 'absolute',\n    top: DIMENSIONS.SPACE_SM,\n    right: DIMENSIONS.SPACE_SM,\n    width: 24,\n    height: 24,\n    borderRadius: 12,\n    backgroundColor: COLORS.SUCCESS,\n    justifyContent: 'center',\n    alignItems: 'center',\n  },\n  \n  // List items\n  listItem: {\n    backgroundColor: COLORS.SURFACE,\n    borderRadius: DIMENSIONS.RADIUS_MD,\n    padding: DIMENSIONS.SPACE_LG,\n    marginBottom: DIMENSIONS.SPACE_MD,\n    flexDirection: 'row',\n    alignItems: 'center',\n  },\n  \n  listItemContent: {\n    flex: 1,\n    marginLeft: DIMENSIONS.SPACE_MD,\n  },\n  \n  // Gradients\n  overlayGradient: {\n    position: 'absolute',\n    bottom: 0,\n    left: 0,\n    right: 0,\n    padding: DIMENSIONS.SPACE_XL,\n  },\n});\n\n/**\n * Grid layout helpers\n */\nexport const gridStyles = StyleSheet.create({\n  grid2: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',\n    justifyContent: 'space-between',\n  },\n  \n  grid3: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',\n    justifyContent: 'space-between',\n  },\n  \n  gridItem2: {\n    width: GRID.getCardWidth(2),\n  },\n  \n  gridItem3: {\n    width: GRID.getCardWidth(3),\n  },\n  \n  columnWrapper: {\n    justifyContent: 'space-between',\n  },\n});