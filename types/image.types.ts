export interface ImageMetadata {
  id: string;
  diveSiteId: string;
  createdAt: string;
  fileName: string;
  size: number;
  mimeType: string;
  localUri?: string;
  remoteUrl?: string;
  syncStatus: 'pending' | 'uploading' | 'synced' | 'failed';
  thumbnailUri?: string;
  uploadProgress?: number;
  retryCount?: number;
  lastRetryAt?: string;
  deleted?: boolean;
}

export interface ImageSyncQueueItem {
  imageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attemptCount: number;
  lastAttempt?: string;
  error?: string;
}

export interface ImageCacheEntry {
  imageId: string;
  localUri: string;
  lastAccessed: string;
  size: number;
}

export type ImageSyncStatus = 'pending' | 'uploading' | 'synced' | 'failed';