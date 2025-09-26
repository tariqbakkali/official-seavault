import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { ArrowLeft } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  onActionPress?: () => void;
  actionText?: string;
  showBackButton?: boolean;
  showActionButton?: boolean;
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
  showActionButton = false
}) => {
  return (
    <View style={styles.header}>
      {showBackButton && onBackPress ? (
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <ArrowLeft size={DIMENSIONS.ICON_LG} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      
      <Text style={styles.headerText}>{title}</Text>
      
      {showActionButton && onActionPress && actionText ? (
        <TouchableOpacity onPress={onActionPress} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    textAlign: 'center',
    flex: 1,
    marginHorizontal: DIMENSIONS.SPACE_MD,
  },
  actionButton: {
    padding: DIMENSIONS.SPACE_SM,
  },
  actionButtonText: {
    color: COLORS.PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
  placeholder: {
    width: 40,
  },
});

export default ScreenHeader;