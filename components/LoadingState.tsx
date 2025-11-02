import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

/**
 * Reusable component for displaying loading states
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  color = '#007AFF'
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.PADDING_LG,
  },
  message: {
    marginTop: DIMENSIONS.SPACE_SM,
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#666',
  },
});

export default LoadingState;