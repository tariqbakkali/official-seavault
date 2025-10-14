import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { OptimizedImage } from './OptimizedImage';
import { ImageMetadata } from '@/types/image.types';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useImageSync } from '@/hooks/useImageSync';
import { Trash2, Upload, RefreshCw, AlertCircle } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageGalleryProps {
  images: ImageMetadata[];
  diveSiteId: string;
  onImageDelete?: (imageId: string) => void;
  onImageSelect?: (image: ImageMetadata) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  diveSiteId,
  onImageDelete,
  onImageSelect,
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const { uploadImage, uploadMultipleImages } = useImageUpload();
  const { retryFailedUploads, startSync } = useImageSync();

  // Handle image press
  const handleImagePress = (image: ImageMetadata) => {
    setSelectedImage(image);
    setShowModal(true);
    onImageSelect?.(image);
  };

  // Handle image delete
  const handleImageDelete = (imageId: string) => {
    onImageDelete?.(imageId);
  };

  // Handle retry upload
  const handleRetryUpload = async (image: ImageMetadata) => {
    try {
      await uploadImage(image);
      // Refresh sync status
      startSync();
    } catch (error) {
      console.error('Error retrying upload:', error);
    }
  };

  // Handle retry all failed uploads
  const handleRetryAllFailed = async () => {
    try {
      const failedImages = images.filter(img => img.syncStatus === 'failed');
      await uploadMultipleImages(failedImages);
      // Refresh sync status
      startSync();
    } catch (error) {
      console.error('Error retrying all failed uploads:', error);
    }
  };

  // Render image item
  const renderItem = ({ item }: { item: ImageMetadata }) => {
    return (
      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={() => handleImagePress(item)}>
          <OptimizedImage
            imageMetadata={item}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </TouchableOpacity>
        
        {/* Sync status badge */}
        <View style={[
          styles.statusBadge,
          item.syncStatus === 'synced' ? styles.syncedBadge :
          item.syncStatus === 'failed' ? styles.failedBadge :
          styles.pendingBadge
        ]}>
          <Text style={styles.statusText}>
            {item.syncStatus === 'synced' ? '✓' :
             item.syncStatus === 'failed' ? '✗' : '⋯'}
          </Text>
        </View>
        
        {/* Retry button for failed uploads */}
        {item.syncStatus === 'failed' && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => handleRetryUpload(item)}
          >
            <RefreshCw size={16} color="#fff" />
          </TouchableOpacity>
        )}
        
        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleImageDelete(item.id)}
        >
          <Trash2 size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render failed uploads summary
  const renderFailedUploadsSummary = () => {
    const failedCount = images.filter(img => img.syncStatus === 'failed').length;
    
    if (failedCount === 0) {
      return null;
    }
    
    return (
      <View style={styles.failedSummaryContainer}>
        <AlertCircle size={20} color="#c62828" />
        <Text style={styles.failedSummaryText}>
          {failedCount} failed upload{failedCount > 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          style={styles.retryAllButton}
          onPress={handleRetryAllFailed}
        >
          <RefreshCw size={16} color="#fff" />
          <Text style={styles.retryAllButtonText}>Retry All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderFailedUploadsSummary()}
      
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Image modal */}
      <Modal
        visible={showModal}
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.modalCloseText}>×</Text>
          </TouchableOpacity>
          
          {selectedImage && (
            <View style={styles.modalImageContainer}>
              <OptimizedImage
                imageMetadata={selectedImage}
                style={styles.fullImage}
                resizeMode="contain"
              />
              
              <View style={styles.modalImageInfo}>
                <Text style={styles.imageInfoText}>
                  Added: {new Date(selectedImage.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.imageInfoText}>
                  Size: {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                </Text>
                <Text style={styles.imageInfoText}>
                  Status: {selectedImage.syncStatus}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  listContainer: {
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
    width: (SCREEN_WIDTH - 32) / 3,
    height: (SCREEN_WIDTH - 32) / 3,
    margin: 4,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  statusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncedBadge: {
    backgroundColor: '#4caf50',
  },
  failedBadge: {
    backgroundColor: '#f44336',
  },
  pendingBadge: {
    backgroundColor: '#ff9800',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  retryButton: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    gap: 8,
  },
  failedSummaryText: {
    flex: 1,
    color: '#c62828',
    fontSize: 14,
    fontWeight: '600',
  },
  retryAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  retryAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  modalImageContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
  },
  fullImage: {
    width: '100%',
    height: '85%',
    borderRadius: 8,
  },
  modalImageInfo: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  imageInfoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
});

export default ImageGallery;