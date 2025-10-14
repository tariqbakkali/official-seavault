import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { ImagePicker } from '@/components/ImagePicker';
import { ImageGallery } from '@/components/ImageGallery';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useImageSync } from '@/hooks/useImageSync';
import { images$, addImage, deleteImage } from '@/stores/imageState';
import { ImageMetadata } from '@/types/image.types';
import { Upload, RefreshCw, AlertCircle } from 'lucide-react-native';

interface DiveSiteDetailExampleProps {
  diveSiteId: string;
  diveSiteName: string;
}

export const DiveSiteDetailExample: React.FC<DiveSiteDetailExampleProps> = ({
  diveSiteId,
  diveSiteName,
}) => {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const { isUploading, uploadedImages, error: uploadError, clearError } = useImageUpload();
  const { isSyncing, isOnline, queueStatus, syncError, startSync, clearSyncError } = useImageSync();

  // Load images for this dive site
  useEffect(() => {
    const loadImages = () => {
      try {
        // In a real implementation, you would filter images by diveSiteId
        const allImages = images$.get() || {};
        const diveSiteImages = Object.values(allImages).filter(
          (image: any) => image.diveSiteId === diveSiteId
        ) as ImageMetadata[];
        
        setImages(diveSiteImages);
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };
    
    loadImages();
    
    // Set up a listener for image changes
    // In a real implementation, you would set up a listener for image changes
    // For now, we'll just load images once
    // const unsubscribe = images$.subscribe(() => {
    //   loadImages();
    // });
    
    return () => {
      // unsubscribe();
    };
  }, [diveSiteId]);

  // Handle image selection
  const handleImageSelect = async (imageMetadata: ImageMetadata) => {
    try {
      // Add the image to our state with the correct dive site ID
      const imageWithDiveSite = {
        ...imageMetadata,
        diveSiteId,
      };
      
      await addImage(imageWithDiveSite);
      
      // Start sync process
      startSync();
    } catch (error) {
      Alert.alert('Error', 'Failed to add image');
      console.error('Error adding image:', error);
    }
  };

  // Handle image delete
  const handleImageDelete = async (imageId: string) => {
    try {
      Alert.alert(
        'Delete Image',
        'Are you sure you want to delete this image?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteImage(imageId);
              // Refresh the image list
              startSync();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to delete image');
      console.error('Error deleting image:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await startSync();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
      clearSyncError();
    };
  }, [clearError, clearSyncError]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{diveSiteName}</Text>
        
        {/* Status bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          
          {queueStatus.pending > 0 && (
            <View style={styles.statusItem}>
              <Upload size={16} color="#ff9800" />
              <Text style={[styles.statusText, styles.pendingText]}>
                {queueStatus.pending} pending
              </Text>
            </View>
          )}
          
          {queueStatus.failed > 0 && (
            <View style={styles.statusItem}>
              <AlertCircle size={16} color="#f44336" />
              <Text style={[styles.statusText, styles.failedText]}>
                {queueStatus.failed} failed
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Image picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Photos</Text>
        <ImagePicker
          onImageSelect={handleImageSelect}
          diveSiteId={diveSiteId}
          disabled={isUploading}
        />
        
        {isUploading && (
          <Text style={styles.uploadStatus}>Uploading images...</Text>
        )}
        
        {(uploadError || syncError) && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {uploadError || syncError}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                clearError();
                clearSyncError();
              }}
            >
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.retryButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Image gallery */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Photos ({images.length})
        </Text>
        
        {images.length > 0 ? (
          <ImageGallery
            images={images}
            diveSiteId={diveSiteId}
            onImageDelete={handleImageDelete}
            onImageSelect={(image) => console.log('Selected image:', image)}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No photos yet. Add your first photo!
            </Text>
          </View>
        )}
      </View>
      
      {/* Sync status */}
      {isSyncing && (
        <View style={styles.syncStatusContainer}>
          <Text style={styles.syncStatusText}>Syncing images...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  pendingText: {
    color: '#ff9800',
  },
  failedText: {
    color: '#f44336',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  uploadStatus: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    flex: 1,
    color: '#c62828',
    fontSize: 14,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  syncStatusContainer: {
    padding: 16,
    backgroundColor: '#e3f2fd',
  },
  syncStatusText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },
});

export default DiveSiteDetailExample;