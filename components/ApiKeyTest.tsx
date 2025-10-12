import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    margin: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  apiKey: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ApiKeyTest;