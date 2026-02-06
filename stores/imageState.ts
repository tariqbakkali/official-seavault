import { observable } from '@legendapp/state';
import { customSynced } from '@/services/legendStateConfig';
import { supabase } from '../services/supabase';
import { uploadImageToSupabase } from '../services/imageService';
import { Database } from '../types/database';
import { ImageMetadata } from '@/types/image.types';
import { v4 as uuidv4 } from 'uuid';
import { currentUserID$, currentUserSightings$ } from './syncedObservables';

/**
 * Image State Management using Legend State
 * This file defines observables for managing image metadata and sync status
 */

// Upload queue observable - tracks images that need to be uploaded

// Upload queue observable - tracks images that need to be uploaded
export const uploadQueue$ = observable<{
  [imageId: string]: {
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    progress: number;
    error?: string;
    retryCount: number;
    lastAttempt?: string;
  };
}>({});

// Image cache observable - tracks downloaded images for offline viewing
export const imageCache$ = observable<{
  [imageId: string]: {
    localUri: string;
    lastAccessed: string;
    size: number;
  };
}>({});

// Utility functions for working with image observables



export const getImagesForDiveSite = (diveSiteId: string): ImageMetadata[] => {
  const allSightings = currentUserSightings$.get() || {};
  const sightings = Object.values(allSightings).filter(
    (s: any) => s.dive_site_id === diveSiteId && s.images && Array.isArray(s.images)
  );

  const images: ImageMetadata[] = [];
  sightings.forEach((s: any) => {
    s.images.forEach((img: any) => {
      images.push({
        ...img,
        diveSiteId: s.dive_site_id, // Ensure consistency
      });
    });
  });

  return images;
};

/**
 * Add a new image
 */
export const addImage = async (imageData: Omit<ImageMetadata, 'id' | 'createdAt' | 'syncStatus'>) => {
  const userId = currentUserID$.get();
  if (!userId) throw new Error('User must be logged in to add images');
  
  // Find the primary sighting for this dive site to store the image
  const allSightings = currentUserSightings$.get() || {};
  const sighting = Object.values(allSightings).find((s: any) => s.dive_site_id === imageData.diveSiteId);

  if (!sighting) {
    throw new Error('No sighting found for this dive site to attach images to.');
  }

  const id = uuidv4();
  let remoteUrl = imageData.remoteUrl;

  // If we have a local URI but no remote URL, attempt upload now
  if (imageData.localUri && !remoteUrl) {
    try {
      const uploadedUrl = await uploadImageToSupabase(
        imageData.localUri,
        imageData.fileName,
        imageData.mimeType
      );
      if (uploadedUrl) {
        remoteUrl = uploadedUrl;
      }
    } catch (error) {
      console.error('Error uploading image in addImage:', error);
    }
  }

  const newImageMetadata: ImageMetadata = {
    id,
    diveSiteId: imageData.diveSiteId,
    createdAt: new Date().toISOString(),
    fileName: imageData.fileName,
    size: imageData.size,
    mimeType: imageData.mimeType,
    remoteUrl: remoteUrl || undefined,
    localUri: imageData.localUri,
    syncStatus: remoteUrl ? 'synced' : 'pending',
  };

  // Update original sighting
  const currentImages = (sighting as any).images || [];
  (currentUserSightings$ as any)[(sighting as any).id].images.set([...currentImages, newImageMetadata]);
  
  return newImageMetadata;
};

/**
 * Delete an image from a sighting
 */
export const deleteImage = async (imageId: string) => {
  try {
    const allSightings = currentUserSightings$.get() || {};
    const sighting = Object.values(allSightings).find((s: any) => 
      s.images && Array.isArray(s.images) && s.images.some((img: any) => img.id === imageId)
    );

    if (sighting) {
      const newImages = (sighting as any).images.filter((img: any) => img.id !== imageId);
      (currentUserSightings$ as any)[(sighting as any).id].images.set(newImages);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Add image to upload queue
 */
export const addToUploadQueue = (imageId: string) => {
  uploadQueue$.assign!({
    [imageId]: {
      status: 'pending',
      progress: 0,
      retryCount: 0,
    }
  });
};

/**
 * Update upload queue item status
 */
export const updateUploadQueueItem = (
  imageId: string,
  updates: Partial<{
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    progress: number;
    error: string;
    retryCount: number;
    lastAttempt: string;
  }>
) => {
  const currentQueue = uploadQueue$.get() || {};
  const currentItem = currentQueue[imageId] || {
    status: 'pending',
    progress: 0,
    retryCount: 0,
  };
  
  uploadQueue$.assign!({
    [imageId]: {
      ...currentItem,
      ...updates,
    }
  });
};

/**
 * Remove image from upload queue
 */
export const removeFromUploadQueue = (imageId: string) => {
  (uploadQueue$ as any)[imageId].delete();
};

/**
 * Get upload queue status
 */
export const getUploadQueueStatus = () => {
  const queue = uploadQueue$.get() || {};
  const items = Object.values(queue);
  
  return {
    total: items.length,
    pending: items.filter((item: any) => item.status === 'pending').length,
    uploading: items.filter((item: any) => item.status === 'uploading').length,
    completed: items.filter((item: any) => item.status === 'completed').length,
    failed: items.filter((item: any) => item.status === 'failed').length,
  };
};

/**
 * Add image to cache
 */
export const addImageToCache = (imageId: string, localUri: string, size: number) => {
  imageCache$.assign!({
    [imageId]: {
      localUri,
      lastAccessed: new Date().toISOString(),
      size,
    }
  });
};

/**
 * Get cached image
 */
export const getCachedImage = (imageId: string) => {
  const cache = imageCache$.get() || {};
  return cache[imageId];
};

/**
 * Remove image from cache
 */
export const removeImageFromCache = (imageId: string) => {
  (imageCache$ as any)[imageId].delete();
};

/**
 * Update image access time in cache
 */
export const updateImageCacheAccessTime = (imageId: string) => {
  const cachedImage = getCachedImage(imageId);
  if (cachedImage) {
    imageCache$.assign!({
      [imageId]: {
        ...cachedImage,
        lastAccessed: new Date().toISOString(),
      }
    });
  }
};

// Export types for convenience
export type UploadQueueObservable = typeof uploadQueue$;
export type ImageCacheObservable = typeof imageCache$;
