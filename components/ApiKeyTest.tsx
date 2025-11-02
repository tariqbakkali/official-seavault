import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';

const ApiKeyTest = () => {
  // Get the API key from the environment
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'Not found';
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Key Test</Text>
      <Text style={styles.apiKey} numberOfLines={3}>
        API Key: {apiKey}
      </Text>
      <Text style={styles.status}>
        Status: {apiKey !== 'Not found' ? 'API Key Loaded' : 'API Key Not Found'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: DIMENSIONS.PADDING_LG,
    backgroundColor: '#f0f0f0',
    borderRadius: DIMENSIONS.RADIUS_SM,
    margin: DIMENSIONS.PADDING_LG,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.SPACE_SM,
    textAlign: 'center',
  },
  apiKey: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontFamily: 'monospace',
    backgroundColor: '#e0e0e0',
    padding: DIMENSIONS.PADDING_XS,
    borderRadius: DIMENSIONS.RADIUS_XS,
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  status: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ApiKeyTest;