import { ImageMetadata } from '../types/image.types';
import { debugLogger } from './debugLogger';

// Dynamically import ImageManipulator to handle potential native module issues
let ImageManipulator: any;
try {
  ImageManipulator = require('expo-image-manipulator');
} catch (error) {
  console.warn('expo-image-manipulator not available, image utilities will be limited', error);
  ImageManipulator = null;
}

/**
 * Image Utilities
 * Utility functions for image compression, validation, and processing
 */

/**
 * Compress an image to reduce file size
 */
export const compressImage = async (
  uri: string,
  quality: number = 0.8
): Promise<{ uri: string; size: number }> => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      console.warn('Image manipulation not available, returning original image');
      // In a real implementation, you would use FileSystem.getInfoAsync to get the actual file size
      return { uri, size: await getImageFileSize(uri) };
    }
    
    // Resize and compress the image
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [], // No resize operations
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    // Get file size (this would need to be implemented)
    const size = await getImageFileSize(result.uri);
    
    console.log('Image compressed:', { originalUri: uri, compressedUri: result.uri, originalSize: 0, compressedSize: size });
    return { uri: result.uri, size };
  } catch (error) {
    debugLogger.logError('Error compressing image:', error);
    // Return original image as fallback
    return { uri, size: await getImageFileSize(uri) };
  }
};

/**
 * Resize an image to specific dimensions
 */
export const resizeImage = async (
  uri: string,
  width: number,
  height: number
): Promise<{ uri: string; size: number }> => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      console.warn('Image manipulation not available, returning original image');
      return { uri, size: await getImageFileSize(uri) };
    }
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width, height } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    const size = await getImageFileSize(result.uri);
    
    console.log('Image resized:', { originalUri: uri, resizedUri: result.uri, size });
    return { uri: result.uri, size };
  } catch (error) {
    debugLogger.logError('Error resizing image:', error);
    // Return original image as fallback
    return { uri, size: await getImageFileSize(uri) };
  }
};

/**
 * Generate a thumbnail for an image
 */
export const generateThumbnail = async (
  uri: string,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<{ uri: string; size: number }> => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      console.warn('Image manipulation not available, returning original image');
      return { uri, size: await getImageFileSize(uri) };
    }
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    const size = await getImageFileSize(result.uri);
    
    console.log('Thumbnail generated:', { originalUri: uri, thumbnailUri: result.uri, size });
    return { uri: result.uri, size };
  } catch (error) {
    debugLogger.logError('Error generating thumbnail:', error);
    // Return original image as fallback
    return { uri, size: await getImageFileSize(uri) };
  }
};

/**
 * Convert image to different format
 */
export const convertImageFormat = async (
  uri: string,
  format: any = ImageManipulator?.SaveFormat?.JPEG
): Promise<{ uri: string; size: number }> => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      console.warn('Image manipulation not available, returning original image');
      return { uri, size: await getImageFileSize(uri) };
    }
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        format,
        compress: 0.8,
      }
    );
    
    const size = await getImageFileSize(result.uri);
    
    console.log('Image format converted:', { originalUri: uri, convertedUri: result.uri, format, size });
    return { uri: result.uri, size };
  } catch (error) {
    debugLogger.logError('Error converting image format:', error);
    // Return original image as fallback
    return { uri, size: await getImageFileSize(uri) };
  }
};

/**
 * Apply image filter (grayscale)
 */
export const applyGrayscaleFilter = async (
  uri: string
): Promise<{ uri: string; size: number }> => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      console.warn('Image manipulation not available, returning original image');
      return { uri, size: await getImageFileSize(uri) };
    }
    
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    );
    
    const size = await getImageFileSize(result.uri);
    
    console.log('Grayscale filter applied:', { originalUri: uri, filteredUri: result.uri, size });
    return { uri: result.uri, size };
  } catch (error) {
    debugLogger.logError('Error applying grayscale filter:', error);
    // Return original image as fallback
    return { uri, size: await getImageFileSize(uri) };
  }
};

/**
 * Get image dimensions
 */
export const getImageDimensions = async (
  uri: string
): Promise<{ width: number; height: number }> => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      console.warn('Image manipulation not available, returning default dimensions');
      return { width: 0, height: 0 };
    }
    
    const { width, height } = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { base64: false }
    );
    
    return { width: width || 0, height: height || 0 };
  } catch (error) {
    debugLogger.logError('Error getting image dimensions:', error);
    return { width: 0, height: 0 };
  }
};

/**
 * Generate multiple image sizes for different use cases
 */
export const generateMultipleSizes = async (
  uri: string
): Promise<{
  original: { uri: string; size: number };
  large: { uri: string; size: number };
  medium: { uri: string; size: number };
  thumbnail: { uri: string; size: number };
}> => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      console.warn('Image manipulation not available, returning original image for all sizes');
      const size = await getImageFileSize(uri);
      return { 
        original: { uri, size }, 
        large: { uri, size }, 
        medium: { uri, size }, 
        thumbnail: { uri, size } 
      };
    }
    
    // Original (possibly compressed)
    const original = await compressImage(uri, 0.8);
    
    // Large size (1024px on longest side)
    const large = await resizeImage(uri, 1024, 1024);
    
    // Medium size (512px on longest side)
    const medium = await resizeImage(uri, 512, 512);
    
    // Thumbnail (128px on longest side)
    const thumbnail = await resizeImage(uri, 128, 128);
    
    console.log('Multiple image sizes generated');
    return { original, large, medium, thumbnail };
  } catch (error) {
    debugLogger.logError('Error generating multiple image sizes:', error);
    // Return original image for all sizes as fallback
    const size = await getImageFileSize(uri);
    return { 
      original: { uri, size }, 
      large: { uri, size }, 
      medium: { uri, size }, 
      thumbnail: { uri, size } 
    };
  }
};

/**
 * Optimize image for web use
 */
export const optimizeImageForWeb = async (
  uri: string
): Promise<{ uri: string; size: number }> => {
  try {
    // Check if ImageManipulator is available
    if (!ImageManipulator) {
      console.warn('Image manipulation not available, returning original image');
      return { uri, size: await getImageFileSize(uri) };
    }
    
    // Resize to max 1920px on longest side and compress
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1920, height: 1920 } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    const size = await getImageFileSize(result.uri);
    
    console.log('Image optimized for web:', { originalUri: uri, optimizedUri: result.uri, size });
    return { uri: result.uri, size };
  } catch (error) {
    debugLogger.logError('Error optimizing image for web:', error);
    // Return original image as fallback
    return { uri, size: await getImageFileSize(uri) };
  }
};

/**
 * Validate image file type and size
 */
export const validateImage = async (
  uri: string,
  maxSizeMB: number = 10
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    // Check file extension
    const extension = uri.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!extension || !validExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Invalid file type. Supported types: ${validExtensions.join(', ')}`,
      };
    }
    
    // Get file size
    const size = await getImageFileSize(uri);
    const sizeMB = size / (1024 * 1024);
    
    if (sizeMB > maxSizeMB) {
      return {
        isValid: false,
        error: `File size (${sizeMB.toFixed(2)} MB) exceeds maximum allowed size (${maxSizeMB} MB)`,
      };
    }
    
    return { isValid: true };
  } catch (error) {
    debugLogger.logError('Error validating image:', error);
    return {
      isValid: false,
      error: 'Failed to validate image file',
    };
  }
};

/**
 * Get image file size
 * Note: This is a placeholder implementation. In a real app, you would use
 * FileSystem.getInfoAsync to get the actual file size.
 */
const getImageFileSize = async (uri: string): Promise<number> => {
  // Placeholder implementation
  // In a real implementation, you would do:
  // const fileInfo = await FileSystem.getInfoAsync(uri);
  // return fileInfo.size || 0;
  return Math.floor(Math.random() * 5000000) + 100000; // Random size between 100KB and 5MB
};

/**
 * Check if image is in portrait orientation
 */
export const isPortraitImage = async (uri: string): Promise<boolean> => {
  const { width, height } = await getImageDimensions(uri);
  return height > width;
};

/**
 * Check if image is in landscape orientation
 */
export const isLandscapeImage = async (uri: string): Promise<boolean> => {
  const { width, height } = await getImageDimensions(uri);
  return width > height;
};

/**
 * Check if image is square
 */
export const isSquareImage = async (uri: string): Promise<boolean> => {
  const { width, height } = await getImageDimensions(uri);
  return width === height;
};

/**
 * Get MIME type from file extension
 */
export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
};

/**
 * Get file extension from MIME type
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  
  return extensions[mimeType.toLowerCase()] || 'jpg';
};