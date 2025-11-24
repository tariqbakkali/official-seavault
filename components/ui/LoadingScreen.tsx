import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Waves } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

interface LoadingScreenProps {
  message?: string;
  showIcon?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  showIcon = true 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Waves size={48} color={COLORS.PRIMARY} />
          </View>
        )}
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: DIMENSIONS.MARGIN_LG,
    opacity: 0.8,
  },
  message: {
    marginTop: DIMENSIONS.MARGIN_MD,
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    textAlign: 'center',
  },
});

export default LoadingScreen;
