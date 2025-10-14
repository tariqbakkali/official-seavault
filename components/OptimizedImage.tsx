import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import { useImageSync } from '@/hooks/useImageSync';
import { ImageMetadata } from '@/types/image.types';
import { ensureImageDownloaded } from '@/services/imageSyncService';

interface OptimizedImageProps {
  imageMetadata: ImageMetadata;
  style?: object;
  showSyncStatus?: boolean;
  resizeMode?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  imageMetadata,
  style,
  showSyncStatus = false,
  resizeMode = 'cover',
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const { isOnline, syncError, clearSyncError } = useImageSync();

  // Load the appropriate image URI
  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // PRIORITY 1: Always try to use local URI first (works offline and online)
        if (imageMetadata.localUri) {
          // Verify local file exists before using it
          try {
            const fileInfo = await FileSystem.getInfoAsync(imageMetadata.localUri);
            if (fileInfo.exists) {
              setImageUri(imageMetadata.localUri);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.log('Local file check failed:', error);
          }
        }
        
        // PRIORITY 2: If we're offline, don't try to download remote images
        if (!isOnline) {
          // If we're offline and don't have a local image, we can't show anything
          console.log('Device is offline and no local image available');
          setHasError(true);
          setIsLoading(false);
          return;
        }
        
        // PRIORITY 3: If we have a remote URL and are online, try to get cached version or download
        if (isOnline && imageMetadata.remoteUrl) {
          // Try to ensure the image is downloaded (this should use cache if available)
          const localUri = await ensureImageDownloaded(imageMetadata);
          if (localUri) {
            setImageUri(localUri);
          } else {
            // Fallback to remote URL if download fails
            setImageUri(imageMetadata.remoteUrl);
          }
          setIsLoading(false);
          return;
        }
        
        // If we get here, we don't have any image to show
        setHasError(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading image:', error);
        // Even if we have an error, try to show what we can
        if (imageMetadata.localUri) {
          setImageUri(imageMetadata.localUri);
          setIsLoading(false);
          return;
        }
        if (imageMetadata.remoteUrl && isOnline) {
          setImageUri(imageMetadata.remoteUrl);
          setIsLoading(false);
          return;
        }
        setHasError(true);
        setIsLoading(false);
      }
    };
    
    loadImage();
  }, [imageMetadata, isOnline]);

  // Clear sync error when component unmounts
  useEffect(() => {
    return () => {
      clearSyncError();
    };
  }, [clearSyncError]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#1a1a1a" />
        {showSyncStatus && (
          <Text style={styles.statusText}>Loading...</Text>
        )}
      </View>
    );
  }

  // Render error state - but still try to show image if we have a URI
  if (hasError || !imageUri) {
    // Even in error state, if we have a local URI, try to show it
    if (imageMetadata.localUri) {
      return (
        <View style={[styles.container, style]}>
          <Image
            source={{ uri: imageMetadata.localUri }}
            style={styles.image}
            contentFit={resizeMode}
            onLoad={() => {
              console.log('Local image loaded successfully in error state');
              setHasError(false); // If it loads, clear error
            }}
            onError={(error) => {
              console.error('Local image load error:', error);
            }}
          />
          {showSyncStatus && (
            <View style={styles.statusOverlay}>
              <Text style={styles.statusText}>
                {imageMetadata.syncStatus}
              </Text>
            </View>
          )}
        </View>
      );
    }
    
    // If we have a remote URL and are online, try to show it
    if (isOnline && imageMetadata.remoteUrl) {
      return (
        <View style={[styles.container, style]}>
          <Image
            source={{ uri: imageMetadata.remoteUrl }}
            style={styles.image}
            contentFit={resizeMode}
            onLoad={() => {
              console.log('Remote image loaded successfully in error state');
              setHasError(false); // If it loads, clear error
            }}
            onError={(error) => {
              console.error('Remote image load error:', error);
            }}
          />
          {showSyncStatus && (
            <View style={styles.statusOverlay}>
              <Text style={styles.statusText}>
                {imageMetadata.syncStatus}
              </Text>
            </View>
          )}
        </View>
      );
    }
    
    // True error state with no fallback - show a proper error message
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>Image not available</Text>
        {showSyncStatus && syncError && (
          <Text style={styles.errorText}>{syncError}</Text>
        )}
      </View>
    );
  }

  // Render image
  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        contentFit={resizeMode}
        onLoad={() => {
          console.log('Image loaded successfully');
          setIsLoading(false);
          setHasError(false);
        }}
        onError={(error) => {
          console.error('Image load error:', error);
          // Even if there's an error, don't immediately set hasError
          // The image might still be loading or might recover
        }}
      />
      {showSyncStatus && (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusText}>
            {imageMetadata.syncStatus}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  statusOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default OptimizedImage;