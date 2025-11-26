import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SharkAnimation from './ui/SharkAnimation';
import { COLORS, DIMENSIONS } from '@/constants';

export const LoadingOverlay = () => (
  <View style={styles.container}>
    <SharkAnimation size={100} color={COLORS.PRIMARY} />
    <Text style={styles.text}>Loading...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: DIMENSIONS.MARGIN_XL,
  },
  text: {
    marginTop: DIMENSIONS.MARGIN_MD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
});
