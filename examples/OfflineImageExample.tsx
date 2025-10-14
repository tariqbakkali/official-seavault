import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ImageMetadata } from '@/types/image.types';

// Example image metadata for demonstration
const exampleImageMetadata: ImageMetadata = {
  id: 'example-image-1',
  diveSiteId: 'example-dive-site',
  createdAt: new Date().toISOString(),
  fileName: 'example.jpg',
  size: 1024000,
  mimeType: 'image/jpeg',
  localUri: 'file:///var/mobile/Containers/Data/Application/example.jpg',
  remoteUrl: 'https://example.com/images/example.jpg',
  syncStatus: 'synced',
  thumbnailUri: 'file:///var/mobile/Containers/Data/Application/example-thumb.jpg',
};

export const OfflineImageExample: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Offline Image Handling Example</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Image with Local URI (Prioritized)</Text>
        <View style={styles.imageContainer}>
          <OptimizedImage 
            imageMetadata={exampleImageMetadata}
            style={styles.image}
            showSyncStatus={true}
          />
        </View>
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          This example demonstrates how the OptimizedImage component prioritizes local images 
          when available, ensuring they are displayed even when offline.
        </Text>
        <Text style={styles.infoText}>
          Key improvements:
        </Text>
        <Text style={styles.infoText}>• Local images are verified before display</Text>
        <Text style={styles.infoText}>• Remote images are only downloaded when online</Text>
        <Text style={styles.infoText}>• Fallback mechanisms ensure images are shown when possible</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});