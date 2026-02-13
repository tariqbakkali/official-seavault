import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy'; // Use legacy API for FileSystem as suggested by error

/**
 * Cloudinary Service for handling video and image uploads
 */

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'placeholder'}/video/upload`;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'seavault_presets';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  duration?: number;
  width?: number;
  height?: number;
  format?: string;
  thumbnail_url?: string;
}

/**
 * Upload a video to Cloudinary
 * @param fileUri Local URI of the video file
 * @param onProgress Callback for upload progress
 * @returns Upload result from Cloudinary
 */
export const uploadVideo = async (
  fileUri: string,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> => {
  try {
    const filename = fileUri.split('/').pop() || 'video.mp4';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'mp4';
    const type = ext === 'mov' ? 'video/quicktime' : `video/${ext}`;
    
    console.log('[Cloudinary] Starting upload to:', CLOUDINARY_URL);
    console.log('[Cloudinary] Using Preset:', UPLOAD_PRESET);
    console.log('[Cloudinary] File URI:', fileUri);
    console.log('[Cloudinary] MIME Type:', type);

    // Verify file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error(`File does not exist at path: ${fileUri}`);
    }

    const response = await FileSystem.uploadAsync(CLOUDINARY_URL, fileUri, {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      parameters: {
        upload_preset: UPLOAD_PRESET,
        'resource_type': 'video', 
      },
      mimeType: type,
    });

    if (response.status >= 200 && response.status < 300) {
      const data = JSON.parse(response.body);
      console.log('[Cloudinary] Upload successful:', data.secure_url);
      
      const thumbnailUrl = data.secure_url.replace(/\.\w+$/, '.jpg');
      
      return {
        ...data,
        thumbnail_url: thumbnailUrl,
      };
    } else {
      console.error('[Cloudinary] Upload failed:', response.body);
      let errorMsg = 'Upload failed';
      try {
        const errorData = JSON.parse(response.body);
        errorMsg = errorData.error?.message || errorMsg;
      } catch (e) {
        // ignore json parse error
      }
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    if (!error.message?.includes('File does not exist')) {
      console.error('[Cloudinary] Unexpected error:', error);
    }
    throw error;
  }
};

/**
 * Extract public ID from a Cloudinary URL
 */
export const getPublicIdFromUrl = (url: string): string | null => {
  try {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.split('.')[0];
  } catch (e) {
    return null;
  }
};

/**
 * Generate an optimized Cloudinary URL
 * @param publicId The public ID of the asset
 * @param resourceType 'image' or 'video'
 * @param transformations Array of transformation strings (e.g., 'f_auto', 'q_auto', 'w_500')
 */
export const getOptimizedUrl = (
  publicId: string, 
  resourceType: 'image' | 'video' = 'video',
  transformations: string[] = ['f_auto', 'q_auto']
): string => {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'placeholder';
  const transformString = transformations.join(',');
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transformString}/${publicId}`;
};

export default {
  uploadVideo,
  getPublicIdFromUrl,
  getOptimizedUrl,
};
