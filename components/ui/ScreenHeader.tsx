import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { ArrowLeft } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  onActionPress?: () => void;
  actionText?: string;
  showBackButton?: boolean;
  showActionButton?: boolean;
  style?: ViewStyle;
}

/**
 * Reusable screen header component with back button and action button
 */
const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBackPress,
  onActionPress,
  actionText,
  showBackButton = true,
  showActionButton = false,
  style
}) => {
  return (
    <View style={[styles.header, style]}>
      {showBackButton && onBackPress && (
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <ArrowLeft size={DIMENSIONS.ICON_LG} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      )}
      
      <Text style={styles.headerText}>{title}</Text>
      
      {showActionButton && onActionPress && actionText && (
        <TouchableOpacity onPress={onActionPress} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingVertical: DIMENSIONS.SPACE_LG,
    backgroundColor: COLORS.BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
    minHeight: DIMENSIONS.HEADER_HEIGHT,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    marginLeft: DIMENSIONS.SPACE_MD,
  },
  actionButton: {
    paddingVertical: DIMENSIONS.PADDING_XS,
    paddingHorizontal: DIMENSIONS.PADDING_SM,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_XS,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
  placeholder: {
    width: 40,
  },

});

export default ScreenHeader;