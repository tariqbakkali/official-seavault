import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY } from '@/constants';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Reusable component for displaying error messages
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>⚠️ {message}</Text>
      {onRetry && (
        <Text style={styles.retryText} onPress={onRetry}>
          Tap to retry
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default ErrorDisplay;