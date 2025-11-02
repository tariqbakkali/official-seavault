import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';
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
    padding: DIMENSIONS.PADDING_MD,
    backgroundColor: '#d0e0f0',
    margin: DIMENSIONS.SPACE_XS,
    borderRadius: DIMENSIONS.RADIUS_SM,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  url: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#666',
    marginBottom: DIMENSIONS.SPACE_XS,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: DIMENSIONS.SPACE_XS,
    borderRadius: DIMENSIONS.RADIUS_XS,
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_XS,
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