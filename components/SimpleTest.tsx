import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export default function SimpleTest() {
  // Test with a known working Wikimedia URL
  const testUrl = 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Pomacanthus_arcuatus_109580400.jpg';
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Image Test</Text>
      <Text style={styles.url}>{testUrl}</Text>
      <Text style={styles.note}>Loading image below...</Text>
      <Image 
        source={{ uri: testUrl }}
        style={styles.image}
        cachePolicy="memory-disk"
        onError={(error) => {
        }}
        onLoad={() => {
        }}
        onLoadEnd={() => {
        }}
      />
      <Text style={styles.note}>Check console logs for loading status</Text>
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
  note: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
    backgroundColor: '#ddd',
  },
});