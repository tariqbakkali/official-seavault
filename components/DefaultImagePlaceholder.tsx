import * as React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface DefaultImagePlaceholderProps {
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

export default function DefaultImagePlaceholder({ 
  style, 
  containerStyle 
}: DefaultImagePlaceholderProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.placeholder, style]}>
        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <View style={styles.iconLine1} />
            <View style={styles.iconLine2} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    backgroundColor: COLORS.SURFACE_SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: DIMENSIONS.ICON_XL,
    height: DIMENSIONS.ICON_XL,
    borderRadius: DIMENSIONS.RADIUS_LG,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: DIMENSIONS.ICON_MD,
    height: DIMENSIONS.ICON_MD,
    position: 'relative',
  },
  iconLine1: {
    position: 'absolute',
    width: DIMENSIONS.ICON_MD,
    height: DIMENSIONS.SPACE_XS,
    backgroundColor: COLORS.TEXT_SECONDARY,
    top: DIMENSIONS.SPACE_SM,
  },
  iconLine2: {
    position: 'absolute',
    width: DIMENSIONS.ICON_MD,
    height: DIMENSIONS.SPACE_XS,
    backgroundColor: COLORS.TEXT_SECONDARY,
    bottom: DIMENSIONS.SPACE_SM,
  },
});