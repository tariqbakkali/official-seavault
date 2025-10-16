import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getProxyImageUrl, getImageUrlOptions } from '@/utils/imageProxy';

export default function ProxyTest() {
  // Test with a known working Wikimedia URL
  const testUrl = 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Pomacanthus_arcuatus_109580400.jpg';
  
  const testProxyUtility = () => {
    try {
      // Test getProxyImageUrl
      const proxiedUrl = getProxyImageUrl(testUrl);
      
      // Test getImageUrlOptions
      const urlOptions = getImageUrlOptions(testUrl);
      
      Alert.alert(
        'Proxy Test Results',
        `Original: ${urlOptions.original}

Encoded: ${urlOptions.encoded}

Proxied: ${urlOptions.proxied}`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Error testing proxy utility: ${errorMessage}`);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proxy Utility Test</Text>
      <Text style={styles.url}>{testUrl}</Text>
      <TouchableOpacity style={styles.button} onPress={testProxyUtility}>
        <Text style={styles.buttonText}>Test Proxy Utility</Text>
      </TouchableOpacity>
      <Text style={styles.note}>Test results will appear in an alert</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#d0e0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  url: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});