import { ensureImageDownloaded } from '../services/imageSyncService';
import { ImageMetadata } from '../types/image.types';
import * as FileSystem from 'expo-file-system';
import { isDeviceOnline } from '../services/imageService';

// Mock the modules
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
  documentDirectory: 'file:///var/mobile/Containers/Data/Application/',
}));

jest.mock('../services/imageService', () => ({
  isDeviceOnline: jest.fn(),
  downloadImageFromSupabase: jest.fn(),
}));

describe('Offline Image Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should prioritize local images when available', async () => {
    const mockImageMetadata: ImageMetadata = {
      id: 'test-image-1',
      diveSiteId: 'dive-site-1',
      createdAt: new Date().toISOString(),
      fileName: 'test.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
      localUri: 'file:///var/mobile/Containers/Data/Application/test.jpg',
      syncStatus: 'synced',
    };

    // Mock that the local file exists
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    const result = await ensureImageDownloaded(mockImageMetadata);

    expect(result).toBe(mockImageMetadata.localUri);
    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(mockImageMetadata.localUri);
  });

  it('should not attempt to download when offline', async () => {
    const mockImageMetadata: ImageMetadata = {
      id: 'test-image-2',
      diveSiteId: 'dive-site-1',
      createdAt: new Date().toISOString(),
      fileName: 'test2.jpg',
      size: 2048,
      mimeType: 'image/jpeg',
      remoteUrl: 'https://example.com/test2.jpg',
      syncStatus: 'pending',
    };

    // Mock that device is offline
    (isDeviceOnline as jest.Mock).mockResolvedValue(false);

    const result = await ensureImageDownloaded(mockImageMetadata);

    expect(result).toBeNull();
    expect(isDeviceOnline).toHaveBeenCalled();
  });

  it('should return local URI even when remote URL is available', async () => {
    const mockImageMetadata: ImageMetadata = {
      id: 'test-image-3',
      diveSiteId: 'dive-site-1',
      createdAt: new Date().toISOString(),
      fileName: 'test3.jpg',
      size: 3072,
      mimeType: 'image/jpeg',
      localUri: 'file:///var/mobile/Containers/Data/Application/test3.jpg',
      remoteUrl: 'https://example.com/test3.jpg',
      syncStatus: 'synced',
    };

    // Mock that the local file exists
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

    const result = await ensureImageDownloaded(mockImageMetadata);

    expect(result).toBe(mockImageMetadata.localUri);
    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(mockImageMetadata.localUri);
  });
});