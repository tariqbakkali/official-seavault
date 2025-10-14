import { supabase } from './supabase';
import { ImageMetadata, ImageSyncQueueItem } from '../types/image.types';
import { uploadImageToSupabase, downloadImageFromSupabase, isDeviceOnline } from './imageService';
import { debugLogger } from '../utils/debugLogger';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';
import { v4 as uuidv4 } from 'uuid';

/**
 * Image Sync Service
 * Handles the synchronization of images between local storage and Supabase Storage
 */

// In-memory queue for pending uploads
let uploadQueue: ImageSyncQueueItem[] = [];
let isSyncing = false;

/**
 * Add an image to the upload queue
 */
export const addToUploadQueue = (imageId: string): void => {
  // Check if image is already in queue
  const existingItem = uploadQueue.find(item => item.imageId === imageId);
  if (existingItem) {
    console.log('Image already in upload queue:', imageId);
    return;
  }
  
  // Add to queue
  uploadQueue.push({
    imageId,
    status: 'pending',
    attemptCount: 0,
  });
  
  console.log('Image added to upload queue:', imageId);
  
  // Start syncing if not already syncing
  if (!isSyncing) {
    startSyncProcess();
  }
};

/**
 * Remove an image from the upload queue
 */
export const removeFromUploadQueue = (imageId: string): void => {
  uploadQueue = uploadQueue.filter(item => item.imageId !== imageId);
  console.log('Image removed from upload queue:', imageId);
};

/**
 * Start the sync process
 */
export const startSyncProcess = async (): Promise<void> => {
  if (isSyncing) {
    return;
  }
  
  isSyncing = true;
  console.log('Starting image sync process');
  
  try {
    // Process the queue
    await processUploadQueue();
  } catch (error) {
    debugLogger.logError('Error in sync process:', error);
  } finally {
    isSyncing = false;
    console.log('Image sync process completed');
  }
};

/**
 * Process the upload queue
 */
export const processUploadQueue = async (): Promise<void> => {
  // Filter pending items
  const pendingItems = uploadQueue.filter(item => item.status === 'pending');
  
  if (pendingItems.length === 0) {
    console.log('No pending items in upload queue');
    return;
  }
  
  console.log('Processing upload queue:', pendingItems.length, 'items');
  
  // Check network connectivity
  const isOnline = await isDeviceOnline();
  if (!isOnline) {
    console.log('Device is offline, skipping upload queue processing');
    return;
  }
  
  // Process each item
  for (const queueItem of pendingItems) {
    try {
      // Update status
      queueItem.status = 'processing';
      queueItem.attemptCount += 1;
      queueItem.lastAttempt = new Date().toISOString();
      
      console.log('Processing image upload:', queueItem.imageId);
      
      // Get image metadata from Legend State (this would be implemented later)
      // For now, we'll simulate the process
      const success = await simulateImageUpload(queueItem.imageId);
      
      if (success) {
        queueItem.status = 'completed';
        console.log('Successfully uploaded image:', queueItem.imageId);
      } else {
        queueItem.status = 'failed';
        console.log('Failed to upload image:', queueItem.imageId);
        
        // Retry logic - exponential backoff
        if (queueItem.attemptCount < 3) {
          // Schedule retry with exponential backoff (1s, 2s, 4s, etc.)
          const delay = Math.pow(2, queueItem.attemptCount - 1) * 1000;
          setTimeout(() => {
            queueItem.status = 'pending';
            startSyncProcess();
          }, delay);
        }
      }
    } catch (error) {
      queueItem.status = 'failed';
      queueItem.error = error instanceof Error ? error.message : String(error);
      debugLogger.logError('Error processing upload queue item:', error);
    }
  }
};

/**
 * Simulate image upload (to be replaced with actual implementation)
 */
const simulateImageUpload = async (imageId: string): Promise<boolean> => {
  // This is a placeholder - in real implementation, we would:
  // 1. Get image metadata from Legend State
  // 2. Upload the image to Supabase Storage
  // 3. Update the database record with the remote URL
  // 4. Update the sync status
  
  console.log('Simulating upload for image:', imageId);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate 90% success rate
  return Math.random() > 0.1;
};

/**
 * Download an image if not available locally
 */
export const ensureImageDownloaded = async (
  imageMetadata: ImageMetadata
): Promise<string | null> => {
  try {
    // If we already have a local URI, return it immediately
    if (imageMetadata.localUri) {
      // Verify the local file actually exists
      if (imageMetadata.localUri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(imageMetadata.localUri);
        if (fileInfo.exists) {
          console.log('Using existing local image:', imageMetadata.id);
          return imageMetadata.localUri;
        }
      } else {
        // If it's already a local URI, just return it
        return imageMetadata.localUri;
      }
    }
    
    // Check if we're online before trying to download
    const isOnline = await isDeviceOnline();
    if (!isOnline) {
      console.log('Device is offline, cannot download image:', imageMetadata.id);
      return null;
    }
    
    // If we have a remote URL, check if we already have it locally
    if (imageMetadata.remoteUrl) {
      // Try to construct the local path where it would be stored
      try {
        const url = new URL(imageMetadata.remoteUrl);
        const fileName = url.pathname.split('/').pop() || `${uuidv4()}.jpg`;
        const localPath = `${documentDirectory}images/${imageMetadata.diveSiteId}/${fileName}`;
        
        // Check if the local file already exists
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          console.log('Using cached local image:', imageMetadata.id);
          return localPath;
        }
        
        // If not, try to download it
        const localUri = await downloadImageFromSupabase(
          imageMetadata.remoteUrl,
          imageMetadata.diveSiteId
        );
        
        if (localUri) {
          console.log('Image downloaded successfully:', imageMetadata.id);
          return localUri;
        }
      } catch (error) {
        console.log('Could not download image:', imageMetadata.id, error);
        // Return null to indicate download failed
        return null;
      }
    }
    
    console.log('No local or remote image available:', imageMetadata.id);
    return null;
  } catch (error) {
    debugLogger.logError('Error ensuring image download:', error);
    // Even if there's an error, if we have a local URI, try to return it
    if (imageMetadata.localUri) {
      return imageMetadata.localUri;
    }
    return null;
  }
};

/**
 * Batch upload multiple images
 */
export const batchUploadImages = async (
  imageIds: string[]
): Promise<{ success: string[]; failed: string[] }> => {
  const results = {
    success: [] as string[],
    failed: [] as string[],
  };
  
  console.log('Starting batch upload for', imageIds.length, 'images');
  
  // Process images in parallel (with concurrency limit)
  const CONCURRENCY_LIMIT = 3;
  const chunks = [];
  
  for (let i = 0; i < imageIds.length; i += CONCURRENCY_LIMIT) {
    chunks.push(imageIds.slice(i, i + CONCURRENCY_LIMIT));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(imageId => 
      uploadSingleImage(imageId)
        .then(success => ({ imageId, success }))
        .catch(error => {
          debugLogger.logError(`Error uploading image ${imageId}:`, error);
          return { imageId, success: false };
        })
    );
    
    const chunkResults = await Promise.all(promises);
    
    chunkResults.forEach(({ imageId, success }) => {
      if (success) {
        results.success.push(imageId);
      } else {
        results.failed.push(imageId);
      }
    });
  }
  
  console.log('Batch upload completed:', results);
  return results;
};

/**
 * Upload a single image
 */
const uploadSingleImage = async (imageId: string): Promise<boolean> => {
  try {
    console.log('Uploading image:', imageId);
    
    // Check network connectivity
    const isOnline = await isDeviceOnline();
    if (!isOnline) {
      console.log('Device is offline, cannot upload image:', imageId);
      return false;
    }
    
    // Get image metadata from Legend State (this would be implemented later)
    // For now, we'll simulate the process
    const success = await simulateImageUpload(imageId);
    
    console.log('Image upload result:', imageId, success);
    return success;
  } catch (error) {
    debugLogger.logError(`Error uploading image ${imageId}:`, error);
    return false;
  }
};

/**
 * Initialize the sync service
 */
export const initializeImageSyncService = (): void => {
  console.log('Initializing image sync service');
  
  // Listen for network connectivity changes
  NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      console.log('Network connectivity restored, starting sync process');
      startSyncProcess();
    }
  });
  
  // Listen for app state changes (foreground/background)
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      console.log('App came to foreground, checking for pending uploads');
      startSyncProcess();
    }
  });
  
  // Start initial sync
  setTimeout(() => {
    startSyncProcess();
  }, 5000); // Wait 5 seconds after initialization
};

/**
 * Get the current upload queue status
 */
export const getUploadQueueStatus = (): {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
} => {
  return {
    total: uploadQueue.length,
    pending: uploadQueue.filter(item => item.status === 'pending').length,
    processing: uploadQueue.filter(item => item.status === 'processing').length,
    completed: uploadQueue.filter(item => item.status === 'completed').length,
    failed: uploadQueue.filter(item => item.status === 'failed').length,
  };
};

/**
 * Clear the upload queue
 */
export const clearUploadQueue = (): void => {
  uploadQueue = [];
  console.log('Upload queue cleared');
};

/**
 * Retry failed uploads
 */
export const retryFailedUploads = async (): Promise<void> => {
  const failedItems = uploadQueue.filter(item => item.status === 'failed');
  
  if (failedItems.length === 0) {
    console.log('No failed items to retry');
    return;
  }
  
  console.log('Retrying', failedItems.length, 'failed uploads');
  
  // Reset status for failed items
  failedItems.forEach(item => {
    item.status = 'pending';
    item.error = undefined;
  });
  
  // Start sync process
  await startSyncProcess();
};