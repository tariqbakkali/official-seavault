import * as FileSystem from 'expo-file-system';
import { readAsStringAsync, EncodingType, documentDirectory } from 'expo-file-system/legacy';
import { ImageMetadata } from '../types/image.types';
import { v4 as uuidv4 } from 'uuid';
import { debugLogger } from '../utils/debugLogger';

// Dynamically import ImageManipulator to handle potential native module issues
let ImageManipulator: any;
try {
  ImageManipulator = require('expo-image-manipulator');
} catch (error) {
  // expo-image-manipulator not available, image compression will be disabled
  ImageManipulator = null;
}

const IMAGE_BASE_DIR = `${documentDirectory}images/`;
const THUMBNAIL_SIZE = { width: 200, height: 200 };

/**
 * Ensure the image storage directory exists
 */
export const ensureImageDirectory = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_BASE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_BASE_DIR, { intermediates: true });
      // Image directory created
    }
  } catch (error) {
    debugLogger.logError('Error ensuring image directory:', error);
    throw error;
  }
};

/**
 * Create a directory for a specific dive site
 */
export const createDiveSiteDirectory = async (diveSiteId: string): Promise<string> => {
  try {
    const diveSiteDir = `${IMAGE_BASE_DIR}${diveSiteId}/`;
    const dirInfo = await FileSystem.getInfoAsync(diveSiteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(diveSiteDir, { intermediates: true });
      // Dive site directory created
    }
    return diveSiteDir;
  } catch (error) {
    debugLogger.logError('Error creating dive site directory:', error);
    throw error;
  }
};

/**
 * Generate a unique file name for an image
 */
export const generateImageFileName = (mimeType: string): string => {
  const extension = mimeType.split('/')[1] || 'jpg';
  return `${uuidv4()}.${extension}`;
};

/**
 * Save an image locally
 */
export const saveImageLocally = async (
  uri: string,
  diveSiteId: string,
  mimeType: string = 'image/jpeg'
): Promise<{ localUri: string; fileName: string; size: number }> => {
  try {
    await ensureImageDirectory();
    const diveSiteDir = await createDiveSiteDirectory(diveSiteId);
    const fileName = generateImageFileName(mimeType);
    const localUri = `${diveSiteDir}${fileName}`;
    
    // Copy the image to local storage
    await FileSystem.copyAsync({
      from: uri,
      to: localUri,
    });
    
    // Get file info for size
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
    
    // Image saved locally
    return { localUri, fileName, size: size || 0 };
  } catch (error) {
    debugLogger.logError('Error saving image locally:', error);
    throw error;
  }
};

/**
 * Generate a thumbnail for an image
 */
export const generateThumbnail = async (uri: string): Promise<string> => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      // Image manipulation not available, returning original URI
      return uri;
    }
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: THUMBNAIL_SIZE }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    // Thumbnail generated
    return result.uri;
  } catch (error) {
    debugLogger.logError('Error generating thumbnail:', error);
    // Return original URI as fallback
    return uri;
  }
};

export const compressImage = async (
  uri: string,
  quality: number = 0.8
): Promise<{ uri: string; size: number }> => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      // Image manipulation not available, returning original image
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
      return { uri, size: size || 0 };
    }
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    // Get file info for size
    const fileInfo = await FileSystem.getInfoAsync(result.uri);
    const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
    
    // Image compressed
    return { uri: result.uri, size };
  } catch (error) {
    debugLogger.logError('Error compressing image:', error);
    // Return original image as fallback
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
    return { uri, size: size || 0 };
  }
};

/**
 * Delete a local image
 */
export const deleteLocalImage = async (localUri: string): Promise<void> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(localUri);
      // Local image deleted
    }
  } catch (error) {
    debugLogger.logError('Error deleting local image:', error);
    throw error;
  }
};

/**
 * Get all local images for a dive site
 */
export const getLocalImagesForDiveSite = async (diveSiteId: string): Promise<string[]> => {
  try {
    const diveSiteDir = `${IMAGE_BASE_DIR}${diveSiteId}/`;
    const dirInfo = await FileSystem.getInfoAsync(diveSiteDir);
    
    if (!dirInfo.exists) {
      return [];
    }
    
    const files = await FileSystem.readDirectoryAsync(diveSiteDir);
    const imageFiles = files.filter(file => 
      file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
    );
    
    const imageUris = imageFiles.map(file => `${diveSiteDir}${file}`);
    // Local images for dive site
    return imageUris;
  } catch (error) {
    debugLogger.logError('Error getting local images for dive site:', error);
    return [];
  }
};

/**
 * Clear old cached images to free up space
 */
export const clearOldImages = async (maxAgeDays: number = 30): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_BASE_DIR);
    if (!dirInfo.exists) {
      return;
    }
    
    const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    
    const diveSiteDirs = await FileSystem.readDirectoryAsync(IMAGE_BASE_DIR);
    for (const dir of diveSiteDirs) {
      const diveSiteDir = `${IMAGE_BASE_DIR}${dir}/`;
      const diveSiteDirInfo = await FileSystem.getInfoAsync(diveSiteDir);
      
      if (diveSiteDirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(diveSiteDir);
        for (const file of files) {
          const filePath = `${diveSiteDir}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (fileInfo.exists && 'modificationTime' in fileInfo) {
            const modificationTime = fileInfo.modificationTime * 1000; // Convert to milliseconds
            if (modificationTime < cutoffTime) {
              await FileSystem.deleteAsync(filePath);
              // Old image cleared
            }
          }
        }
      }
    }
  } catch (error) {
    debugLogger.logError('Error clearing old images:', error);
  }
};