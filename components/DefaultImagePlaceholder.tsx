import * as React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/constants/colors';

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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  iconLine1: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: COLORS.TEXT_SECONDARY,
    top: 8,
  },
  iconLine2: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: COLORS.TEXT_SECONDARY,
    bottom: 8,
  },
});