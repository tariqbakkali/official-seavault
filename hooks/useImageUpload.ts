import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { processNewImage, uploadImageToSupabase } from '@/services/imageService';
import { addToUploadQueue, updateUploadQueueItem } from '@/stores/imageState';
import { ImageMetadata } from '@/types/image.types';
import { debugLogger } from '@/utils/debugLogger';

/**
 * Hook for handling image upload functionality
 */
export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<ImageMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Launch camera to capture a new image
   */
  const launchCamera = useCallback(async (): Promise<ImageMetadata | null> => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera permission is required to take photos');
        return null;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const imageUri = result.assets[0].uri;
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      
      // Process the captured image
      const imageMetadata = await processNewImage(imageUri, 'temp-dive-site-id', mimeType);
      
      if (imageMetadata) {
        // Add to upload queue
        addToUploadQueue(imageMetadata.id);
        setUploadedImages(prev => [...prev, imageMetadata]);
        return imageMetadata;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture image';
      setError(errorMessage);
      debugLogger.logError('Error capturing image:', err);
      return null;
    }
  }, []);

  /**
   * Launch image library to select an existing image
   */
  const launchImageLibrary = useCallback(async (): Promise<ImageMetadata | null> => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Media library permission is required to select photos');
        return null;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const imageUri = result.assets[0].uri;
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      
      // Process the selected image
      const imageMetadata = await processNewImage(imageUri, 'temp-dive-site-id', mimeType);
      
      if (imageMetadata) {
        // Add to upload queue
        addToUploadQueue(imageMetadata.id);
        setUploadedImages(prev => [...prev, imageMetadata]);
        return imageMetadata;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select image';
      setError(errorMessage);
      debugLogger.logError('Error selecting image:', err);
      return null;
    }
  }, []);

  /**
   * Upload an image to Supabase Storage
   */
  const uploadImage = useCallback(async (
    imageMetadata: ImageMetadata
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      
      // Update upload queue status
      updateUploadQueueItem(imageMetadata.id, {
        status: 'uploading',
        progress: 0,
      });
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      // Upload the image
      if (imageMetadata.localUri) {
        const remoteUrl = await uploadImageToSupabase(
          imageMetadata.localUri,
          imageMetadata.fileName,
          imageMetadata.mimeType
        );
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (remoteUrl) {
          // Update upload queue status
          updateUploadQueueItem(imageMetadata.id, {
            status: 'completed',
            progress: 100,
          });
          
          // Image uploaded successfully
          return remoteUrl;
        } else {
          // Update upload queue status
          updateUploadQueueItem(imageMetadata.id, {
            status: 'failed',
            progress: 0,
            error: 'Upload failed',
          });
          
          setError('Failed to upload image');
          return null;
        }
      }
      
      clearInterval(progressInterval);
      setError('No local image URI available');
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      debugLogger.logError('Error uploading image:', err);
      
      // Update upload queue status
      updateUploadQueueItem(imageMetadata.id, {
        status: 'failed',
        progress: 0,
        error: errorMessage,
      });
      
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  /**
   * Upload multiple images
   */
  const uploadMultipleImages = useCallback(async (
    images: ImageMetadata[]
  ): Promise<{ success: ImageMetadata[]; failed: ImageMetadata[] }> => {
    try {
      setIsUploading(true);
      setError(null);
      
      const results = {
        success: [] as ImageMetadata[],
        failed: [] as ImageMetadata[],
      };
      
      // Upload images sequentially to avoid overwhelming the network
      for (const image of images) {
        try {
          const remoteUrl = await uploadImage(image);
          if (remoteUrl) {
            results.success.push({ ...image, remoteUrl });
          } else {
            results.failed.push(image);
          }
        } catch (err) {
          results.failed.push(image);
          debugLogger.logError(`Error uploading image ${image.id}:`, err);
        }
      }
      
      setUploadedImages(prev => [
        ...prev.filter(img => !images.some(uploadImg => uploadImg.id === img.id)),
        ...results.success,
      ]);
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload images';
      setError(errorMessage);
      debugLogger.logError('Error uploading multiple images:', err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [uploadImage]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear uploaded images
   */
  const clearUploadedImages = useCallback(() => {
    setUploadedImages([]);
  }, []);

  return {
    // State
    isUploading,
    uploadProgress,
    uploadedImages,
    error,
    
    // Functions
    launchCamera,
    launchImageLibrary,
    uploadImage,
    uploadMultipleImages,
    clearError,
    clearUploadedImages,
  };
};