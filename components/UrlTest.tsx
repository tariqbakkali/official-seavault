import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { TYPOGRAPHY } from '@/constants';

export default function UrlTest() {
  // Test with a known working Wikimedia URL
  const testUrl = 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Pomacanthus_arcuatus_109580400.jpg';
  
  const testUrlAccess = async () => {
    try {
      console.log('UrlTest: Testing URL access', testUrl);
      
      // Test with HEAD request
      console.log('UrlTest: Sending HEAD request...');
      const headResponse = await fetch(testUrl, { method: 'HEAD' });
      console.log('UrlTest: HEAD Response status', headResponse.status);
      console.log('UrlTest: HEAD Response headers', [...headResponse.headers.entries()]);
      
      // Test with GET request
      console.log('UrlTest: Sending GET request...');
      const getResponse = await fetch(testUrl);
      console.log('UrlTest: GET Response status', getResponse.status);
      console.log('UrlTest: GET Response headers', [...getResponse.headers.entries()]);
      
      // Check if we can get the blob
      console.log('UrlTest: Getting blob...');
      const blob = await getResponse.blob();
      console.log('UrlTest: Blob size', blob.size);
      console.log('UrlTest: Blob type', blob.type);
      
      if (headResponse.ok) {
        Alert.alert('Success', `URL is accessible\nStatus: ${headResponse.status}\nContent-Type: ${headResponse.headers.get('content-type')}\nBlob size: ${blob.size}`);
      } else {
        Alert.alert('Error', `URL is not accessible\nStatus: ${headResponse.status}`);
      }
    } catch (error: unknown) {
      console.log('UrlTest: Error accessing URL', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Error accessing URL: ${errorMessage}`);
    }
  };
  
  const testImageDirectly = async () => {
    try {
      console.log('UrlTest: Testing image loading directly with Image component');
      // This would typically be done in a component, but we can simulate the concept here
      Alert.alert('Info', 'Check the TestImage component above to see direct image loading results');
    } catch (error: unknown) {
      console.log('UrlTest: Error in direct image test', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Error in direct image test: ${errorMessage}`);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>URL Access Test</Text>
      <Text style={styles.url}>{testUrl}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={testUrlAccess}>
          <Text style={styles.buttonText}>Test URL Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={testImageDirectly}>
          <Text style={styles.buttonText}>Test Direct Image Load</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.note}>Check console logs for detailed information</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  url: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    flex: 0.48,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  note: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#666',
    fontStyle: 'italic',
  },
});