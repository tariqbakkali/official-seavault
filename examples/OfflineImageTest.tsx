import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ImageMetadata } from '@/types/image.types';

// Example image metadata with local URI only (simulating offline scenario)
const offlineImageMetadata: ImageMetadata = {
  id: 'offline-test-image',
  diveSiteId: 'test-dive-site',
  createdAt: new Date().toISOString(),
  fileName: 'offline-test.jpg',
  size: 1024000,
  mimeType: 'image/jpeg',
  localUri: 'file:///var/mobile/Containers/Data/Application/offline-test.jpg',
  syncStatus: 'synced',
};

// Example image metadata with both local and remote URIs
const onlineImageMetadata: ImageMetadata = {
  id: 'online-test-image',
  diveSiteId: 'test-dive-site',
  createdAt: new Date().toISOString(),
  fileName: 'online-test.jpg',
  size: 2048000,
  mimeType: 'image/jpeg',
  localUri: 'file:///var/mobile/Containers/Data/Application/online-test.jpg',
  remoteUrl: 'https://example.com/images/online-test.jpg',
  syncStatus: 'synced',
};

// Example image metadata with remote URI only (no local image)
const remoteOnlyImageMetadata: ImageMetadata = {
  id: 'remote-only-image',
  diveSiteId: 'test-dive-site',
  createdAt: new Date().toISOString(),
  fileName: 'remote-only.jpg',
  size: 3072000,
  mimeType: 'image/jpeg',
  remoteUrl: 'https://example.com/images/remote-only.jpg',
  syncStatus: 'pending',
};

export const OfflineImageTest: React.FC = () => {
  const testLocalImageOnly = () => {
    Alert.alert(
      'Offline Test',
      'This simulates an offline scenario with only a local image available.\n\nExpected behavior: Should show the local image without any fallback.',
      [{ text: 'OK' }]
    );
  };

  const testLocalAndRemote = () => {
    Alert.alert(
      'Online Test',
      'This simulates an online scenario with both local and remote images available.\n\nExpected behavior: Should prioritize the local image.',
      [{ text: 'OK' }]
    );
  };

  const testRemoteOnly = () => {
    Alert.alert(
      'Remote Only Test',
      'This simulates a scenario with only a remote image available.\n\nExpected behavior when offline: Should show "Image not available" message instead of a fallback image.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Image Handling Test</Text>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Local Image Only (Offline Scenario)</Text>
        <View style={styles.imageContainer}>
          <OptimizedImage 
            imageMetadata={offlineImageMetadata}
            style={styles.image}
            showSyncStatus={true}
          />
        </View>
        <Button title="Test Info" onPress={testLocalImageOnly} />
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Local + Remote Images (Online Scenario)</Text>
        <View style={styles.imageContainer}>
          <OptimizedImage 
            imageMetadata={onlineImageMetadata}
            style={styles.image}
            showSyncStatus={true}
          />
        </View>
        <Button title="Test Info" onPress={testLocalAndRemote} />
      </View>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Remote Image Only (No Local Copy)</Text>
        <View style={styles.imageContainer}>
          <OptimizedImage 
            imageMetadata={remoteOnlyImageMetadata}
            style={styles.image}
            showSyncStatus={true}
          />
        </View>
        <Button title="Test Info" onPress={testRemoteOnly} />
      </View>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          This test demonstrates the improved offline image handling:
        </Text>
        <Text style={styles.infoText}>
          1. Local images are always prioritized and displayed
        </Text>
        <Text style={styles.infoText}>
          2. When offline, no fallback images are shown
        </Text>
        <Text style={styles.infoText}>
          3. Proper error messages are displayed when no image is available
        </Text>
      </View>
    </View>
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
  testSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});