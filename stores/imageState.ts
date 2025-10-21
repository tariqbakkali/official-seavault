import { observable } from '@legendapp/state';
import { customSynced } from '@/services/legendStateConfig';
import { supabase } from '@/services/supabase';
import { ImageMetadata } from '@/types/image.types';
import { v4 as uuidv4 } from 'uuid';
import { currentUserID$ } from './syncedObservables';

/**
 * Image State Management using Legend State
 * This file defines observables for managing image metadata and sync status
 */

// Image metadata observable - using sightings table to store image references
export const images$ = observable(customSynced({
  supabase,
  collection: 'sightings',
  filter: (select: any) => {
    // Filter by current user if available
    const userId = currentUserID$.get();
    if (!userId) return select.eq('id', '00000000-0000-0000-0000-000000000000');
    return select.eq('user_id', userId).not('image_url', 'is', null);
  },
  actions: ['read', 'create', 'update', 'delete'],
  persist: { name: 'images', retrySync: true },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',
  generateId: () => uuidv4(),
  update: async (input: any) => {
    // Custom Supabase update function for images
    const { data, error } = await supabase
      .from('sightings')
      .insert(input)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update image: ${error.message}`);
    }
    return { data, error: null };
  },
  realtime: true,
}));

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

/**
 * Get all images
 */
export const getImages = () => images$.get();

/**
 * Get images for a specific dive site
 */
export const getImagesForDiveSite = (diveSiteId: string) => {
  const allImages = images$.get() || {};
  return Object.values(allImages).filter(
    (image: any) => image.diveSiteId === diveSiteId
  );
};

/**
 * Add a new image
 */
export const addImage = async (imageData: Omit<ImageMetadata, 'id' | 'created_at' | 'user_id'>) => {
  const userId = currentUserID$.get();
  if (!userId) {
    throw new Error('User must be logged in to add images');
  }
  
  const id = uuidv4();
  
  const newImage = {
    ...imageData,
    id,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as ImageMetadata & { user_id: string; updated_at: string };
  
  // Set the data in the observable
  (images$ as any)[id].set(newImage);
  
  return newImage;
};

/**
 * Update an existing image
 */
export const updateImage = async (imageId: string, updates: Partial<ImageMetadata>) => {
  const currentImages = images$.get() || {};
  const currentImage = (currentImages as Record<string, any>)[imageId];
  
  if (!currentImage) {
    throw new Error(`Image with ID ${imageId} not found`);
  }
  
  const updatedImage = {
    ...currentImage,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  // Update the observable
  (images$ as any)[imageId].set(updatedImage);
  
  return updatedImage;
};

/**
 * Delete an image
 */
export const deleteImage = async (imageId: string) => {
  // Use Legend State's delete method
  (images$ as any)[imageId].delete();
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
export type ImageObservable = typeof images$;
export type UploadQueueObservable = typeof uploadQueue$;
export type ImageCacheObservable = typeof imageCache$;
