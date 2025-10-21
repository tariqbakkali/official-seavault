import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY } from '@/constants';
import { Image } from 'expo-image';
import { getImageUrlOptions } from '@/utils/imageProxy';

interface TestImageProps {
  uri: string;
}

export default function TestImage({ uri }: TestImageProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [progress, setProgress] = React.useState<string>('');
  const [currentUrlIndex, setCurrentUrlIndex] = React.useState(0);

  // Get URL options
  const urlOptions = React.useMemo(() => {
    return getImageUrlOptions(uri);
  }, [uri]);

  // Get current URL to try
  const currentUrl = React.useMemo(() => {
    const urls = [urlOptions.original, urlOptions.encoded, urlOptions.proxied].filter(Boolean) as string[];
    return urls[currentUrlIndex] || urlOptions.original;
  }, [urlOptions, currentUrlIndex]);

  // Function to test URL accessibility
  const testUrlAccessibility = async (url: string) => {
    try {
      setProgress('Testing URL accessibility...');
      
      // Test with HEAD request first
      const headResponse = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      
      // Test with GET request
      setProgress('Fetching image data...');
      const getResponse = await fetch(url, { mode: 'no-cors' });
      
      if (getResponse.ok) {
        setProgress(`Accessible - Status: ${getResponse.status}`);
      } else {
        setProgress(`Not accessible - Status: ${getResponse.status}`);
      }
    } catch (error: any) {
      setProgress(`Error: ${error.message || 'Unknown error'}`);
    }
  };

  React.useEffect(() => {
    if (uri) {
      testUrlAccessibility(uri);
    }
  }, [uri]);

  // Try next URL option
  const tryNextUrl = () => {
    const urls = [urlOptions.original, urlOptions.encoded, urlOptions.proxied].filter(Boolean) as string[];
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setLoading(true);
      setError(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Image Component</Text>
      <Text style={styles.urlText}>{uri}</Text>
      <Text style={styles.currentUrlText}>Current URL: {currentUrl}</Text>
      <Text style={styles.progressText}>{progress}</Text>
      {loading && <Text style={styles.statusText}>Loading image...</Text>}
      {error && <Text style={styles.errorText}>Error loading image</Text>}
      <Image
        key={currentUrl} // Force re-render when URL changes
        source={{ uri: currentUrl || '' }}
        style={styles.image}
        cachePolicy="memory-disk"
        onLoad={() => {
          setLoading(false);
          setProgress('Image loaded successfully');
        }}
        onError={(e) => {
          setLoading(false);
          setError(true);
          setProgress(`Load error: ${JSON.stringify(e) || 'Unknown error'}`);
        }}
        onLoadEnd={() => {
        }}
      />
      <Text style={styles.note} onPress={tryNextUrl}>
        Tap to try next URL option ({currentUrlIndex + 1}/{
          [urlOptions.original, urlOptions.encoded, urlOptions.proxied].filter(Boolean).length
        })
      </Text>
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
  urlText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  currentUrlText: {
    fontSize: TYPOGRAPHY.SIZE_XS,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
  progressText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#333',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  statusText: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#007AFF',
    marginBottom: 5,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
    backgroundColor: '#ddd',
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
  },
  note: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#007AFF',
    marginTop: 5,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});