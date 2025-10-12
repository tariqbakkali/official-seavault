import * as React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';

interface WikimediaImageTestProps {
  uri: string;
}

export default function WikimediaImageTest({ uri }: WikimediaImageTestProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [testResults, setTestResults] = React.useState<string[]>([]);

  // Function to test different approaches to load the image
  const testImageLoading = async (url: string) => {
    const results: string[] = [];
    
    try {
      // Test 1: Direct fetch
      results.push('Test 1: Direct fetch...');
      const response = await fetch(url, { method: 'HEAD' });
      results.push(`Test 1 result: Status ${response.status}, OK: ${response.ok}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      results.push(`Test 1 error: ${errorMessage}`);
    }
    
    try {
      // Test 2: Fetch with no-cors mode
      results.push('Test 2: Fetch with no-cors mode...');
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      results.push(`Test 2 result: Status ${response.status}, OK: ${response.ok}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      results.push(`Test 2 error: ${errorMessage}`);
    }
    
    setTestResults(results);
  };

  React.useEffect(() => {
    if (uri) {
      testImageLoading(uri);
    }
  }, [uri]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wikimedia Image Test</Text>
      <Text style={styles.url}>{uri}</Text>
      
      <View style={styles.testResults}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </View>
      
      <Text style={styles.loadingText}>Loading image with Expo Image:</Text>
      {loading && <Text style={styles.statusText}>Loading...</Text>}
      {error && <Text style={styles.errorText}>Error loading image</Text>}
      
      <Image
        source={{ uri }}
        style={styles.image}
        cachePolicy="memory-disk"
        onLoad={() => {
          setLoading(false);
        }}
        onError={(e) => {
          setLoading(false);
          setError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#e0e0e0',
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
  testResults: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
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
});