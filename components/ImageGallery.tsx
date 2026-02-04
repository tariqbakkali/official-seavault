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
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { Trash2, Upload, RefreshCw, AlertCircle } from 'lucide-react-native';

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
            contentFit="cover"
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
                contentFit="contain"
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
    padding: DIMENSIONS.PADDING_XS,
  },
  imageContainer: {
    position: 'relative',
    width: (DIMENSIONS.SCREEN_WIDTH - 32) / 3,
    height: (DIMENSIONS.SCREEN_WIDTH - 32) / 3,
    margin: DIMENSIONS.SPACE_XS,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: DIMENSIONS.RADIUS_SM,
  },
  statusBadge: {
    position: 'absolute',
    top: DIMENSIONS.SPACE_XS,
    right: DIMENSIONS.SPACE_XS,
    width: DIMENSIONS.ICON_LG,
    height: DIMENSIONS.ICON_LG,
    borderRadius: DIMENSIONS.RADIUS_FULL,
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
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: 'bold',
  },
  retryButton: {
    position: 'absolute',
    top: DIMENSIONS.SPACE_XS,
    left: DIMENSIONS.SPACE_XS,
    width: DIMENSIONS.ICON_LG,
    height: DIMENSIONS.ICON_LG,
    borderRadius: DIMENSIONS.RADIUS_FULL,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    bottom: DIMENSIONS.SPACE_XS,
    right: DIMENSIONS.SPACE_XS,
    width: DIMENSIONS.ICON_LG,
    height: DIMENSIONS.ICON_LG,
    borderRadius: DIMENSIONS.RADIUS_FULL,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.PADDING_SM,
    margin: DIMENSIONS.SPACE_XS,
    gap: DIMENSIONS.SPACE_XS,
  },
  failedSummaryText: {
    flex: 1,
    color: '#c62828',
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: '600',
  },
  retryAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: DIMENSIONS.RADIUS_XS,
    paddingHorizontal: DIMENSIONS.PADDING_SM,
    paddingVertical: DIMENSIONS.PADDING_XS,
    gap: DIMENSIONS.SPACE_XS,
  },
  retryAllButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_MD,
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
    top: DIMENSIONS.HEADER_HEIGHT,
    right: DIMENSIONS.PADDING_MD,
    zIndex: 1,
  },
  modalCloseText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_HERO,
    fontWeight: 'bold',
  },
  modalImageContainer: {
    width: DIMENSIONS.SCREEN_WIDTH * 0.9,
    height: DIMENSIONS.SCREEN_HEIGHT * 0.7,
  },
  fullImage: {
    width: '100%',
    height: '85%',
    borderRadius: DIMENSIONS.RADIUS_SM,
  },
  modalImageInfo: {
    marginTop: DIMENSIONS.SPACE_LG,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.PADDING_SM,
  },
  imageInfoText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_MD,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
});

export default ImageGallery;