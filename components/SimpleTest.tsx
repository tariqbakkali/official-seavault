import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';
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
    padding: DIMENSIONS.PADDING_MD,
    backgroundColor: '#f0f0f0',
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
  note: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#666',
    marginBottom: DIMENSIONS.SPACE_XS,
    fontStyle: 'italic',
  },
  image: {
    width: DIMENSIONS.THUMBNAIL_SIZE,
    height: DIMENSIONS.THUMBNAIL_SIZE,
    resizeMode: 'cover',
    backgroundColor: '#ddd',
  },
});