import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { readAsStringAsync, EncodingType, documentDirectory, downloadAsync } from 'expo-file-system/legacy';
import { ImageMetadata, ImageSyncStatus } from '../types/image.types';
import { saveImageLocally, generateThumbnail, compressImage, deleteLocalImage, getLocalImagesForDiveSite } from './imageStorageService';
import { v4 as uuidv4 } from 'uuid';
import NetInfo from '@react-native-community/netinfo';
import { debugLogger } from '../utils/debugLogger';

/**
 * Create image metadata object
 */
export const createImageMetadata = (
  diveSiteId: string,
  localUri: string,
  fileName: string,
  size: number,
  mimeType: string
): ImageMetadata => {
  return {
    id: uuidv4(),
    diveSiteId,
    createdAt: new Date().toISOString(),
    fileName,
    size,
    mimeType,
    localUri,
    syncStatus: 'pending',
    retryCount: 0,
  };
};

/**
 * Upload an image to Supabase Storage
 */
export const uploadImageToSupabase = async (
  localUri: string,
  fileName: string,
  mimeType: string
): Promise<string | null> => {
  try {
    // Compress the image before upload to save bandwidth
    const compressedImage = await compressImage(localUri, 0.8);
    
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(compressedImage.uri, {
      encoding: EncodingType.Base64,
    });

    // Convert base64 to Uint8Array
    const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // Determine file extension from URI
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `dive-site-images/${fileName}`;

    // Determine content type
    const contentType = mimeType || `image/${fileExt === 'jpg' || fileExt === 'jpeg' ? 'jpeg' : fileExt}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, arrayBuffer, {
        contentType: contentType,
        upsert: false,
      });

    if (error) throw error;

    // Return public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('images').getPublicUrl(filePath);
    
    console.log('Image uploaded to Supabase:', publicUrl);
    return publicUrl;
  } catch (error) {
    debugLogger.logError('Error uploading image to Supabase:', error);
    return null;
  }
};

/**
 * Download an image from Supabase Storage
 */
export const downloadImageFromSupabase = async (
  remoteUrl: string,
  diveSiteId: string
): Promise<string | null> => {
  try {
    // Extract file name from URL
    const url = new URL(remoteUrl);
    const fileName = url.pathname.split('/').pop() || `${uuidv4()}.jpg`;
    
    // Create local path
    const localPath = `${documentDirectory}images/${diveSiteId}/${fileName}`;
    
    // Download the file
    const { uri, status } = await FileSystem.downloadAsync(remoteUrl, localPath);
    
    if (status === 200) {
      console.log('Image downloaded from Supabase:', uri);
      return uri;
    } else {
      throw new Error(`Download failed with status ${status}`);
    }
  } catch (error) {
    debugLogger.logError('Error downloading image from Supabase:', error);
    return null;
  }
};

/**
 * Process a newly captured or selected image
 */
export const processNewImage = async (
  imageUri: string,
  diveSiteId: string,
  mimeType: string = 'image/jpeg'
): Promise<ImageMetadata | null> => {
  try {
    // Save image locally
    const { localUri, fileName, size } = await saveImageLocally(imageUri, diveSiteId, mimeType);
    
    // Generate thumbnail
    const thumbnailUri = await generateThumbnail(localUri);
    
    // Create metadata
    const imageMetadata = createImageMetadata(diveSiteId, localUri, fileName, size, mimeType);
    imageMetadata.thumbnailUri = thumbnailUri;
    
    console.log('New image processed:', imageMetadata);
    return imageMetadata;
  } catch (error) {
    debugLogger.logError('Error processing new image:', error);
    return null;
  }
};

/**
 * Get all images for a dive site (local and remote)
 */
export const getImagesForDiveSite = async (diveSiteId: string): Promise<ImageMetadata[]> => {
  try {
    // Get local images
    const localImageUris = await getLocalImagesForDiveSite(diveSiteId);
    
    // For now, we'll return a simplified version
    // In a real implementation, this would query the database for remote images
    // and merge with local images
    const images: ImageMetadata[] = localImageUris.map((uri, index) => ({
      id: uuidv4(),
      diveSiteId,
      createdAt: new Date(Date.now() - index * 1000).toISOString(),
      fileName: uri.split('/').pop() || `image-${index}.jpg`,
      size: 0, // Would need to get actual size
      mimeType: 'image/jpeg',
      localUri: uri,
      syncStatus: 'synced',
    }));
    
    console.log('Images for dive site:', { diveSiteId, count: images.length });
    return images;
  } catch (error) {
    debugLogger.logError('Error getting images for dive site:', error);
    return [];
  }
};

/**
 * Delete an image (both local and remote)
 */
export const deleteImage = async (imageMetadata: ImageMetadata): Promise<boolean> => {
  try {
    // Delete local image
    if (imageMetadata.localUri) {
      await deleteLocalImage(imageMetadata.localUri);
    }
    
    // Delete remote image if it exists
    if (imageMetadata.remoteUrl) {
      // Extract file path from URL
      const url = new URL(imageMetadata.remoteUrl);
      const filePath = url.pathname.substring(1); // Remove leading slash
      
      const { error } = await supabase.storage
        .from('images')
        .remove([filePath]);
      
      if (error) {
        throw error;
      }
    }
    
    // Delete thumbnail if it exists
    if (imageMetadata.thumbnailUri) {
      await deleteLocalImage(imageMetadata.thumbnailUri);
    }
    
    console.log('Image deleted:', imageMetadata.id);
    return true;
  } catch (error) {
    debugLogger.logError('Error deleting image:', error);
    return false;
  }
};

/**
 * Check if device is online
 */
export const isDeviceOnline = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    debugLogger.logError('Error checking network status:', error);
    return false;
  }
};

/**
 * Retry failed image uploads
 */
export const retryFailedUploads = async (images: ImageMetadata[]): Promise<void> => {
  try {
    const failedImages = images.filter(img => img.syncStatus === 'failed');
    
    if (failedImages.length === 0) {
      return;
    }
    
    console.log('Retrying failed image uploads:', failedImages.length);
    
    for (const image of failedImages) {
      // Check if we should retry (max 3 attempts)
      if ((image.retryCount || 0) >= 3) {
        console.log('Skipping retry for image (max attempts reached):', image.id);
        continue;
      }
      
      // Update retry count
      image.retryCount = (image.retryCount || 0) + 1;
      image.lastRetryAt = new Date().toISOString();
      
      // Try to upload
      if (image.localUri) {
        const remoteUrl = await uploadImageToSupabase(
          image.localUri,
          image.fileName,
          image.mimeType
        );
        
        if (remoteUrl) {
          image.remoteUrl = remoteUrl;
          image.syncStatus = 'synced';
          console.log('Successfully retried upload for image:', image.id);
        } else {
          image.syncStatus = 'failed';
          console.log('Failed to retry upload for image:', image.id);
        }
      }
    }
  } catch (error) {
    debugLogger.logError('Error retrying failed uploads:', error);
  }
};