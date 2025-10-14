import { useState, useEffect, useCallback } from 'react';
import { images$, uploadQueue$, getUploadQueueStatus } from '@/stores/imageState';
import { startSyncProcess, ensureImageDownloaded, batchUploadImages } from '@/services/imageSyncService';
import { isDeviceOnline } from '@/services/imageService';
import { ImageMetadata } from '@/types/image.types';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { debugLogger } from '@/utils/debugLogger';

/**
 * Hook for handling image synchronization functionality
 */
export const useImageSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [queueStatus, setQueueStatus] = useState({
    total: 0,
    pending: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
  });
  const [syncError, setSyncError] = useState<string | null>(null);

  /**
   * Check network connectivity
   */
  const checkConnectivity = useCallback(async () => {
    try {
      const online = await isDeviceOnline();
      setIsOnline(online);
      return online;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check connectivity';
      setSyncError(errorMessage);
      debugLogger.logError('Error checking connectivity:', err);
      return false;
    }
  }, []);

  /**
   * Update queue status
   */
  const updateQueueStatus = useCallback(() => {
    const status = getUploadQueueStatus();
    setQueueStatus(status);
  }, []);

  /**
   * Start synchronization process
   */
  const startSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      // Check connectivity first
      const online = await checkConnectivity();
      if (!online) {
        setSyncError('Device is offline');
        return;
      }
      
      // Start sync process
      await startSyncProcess();
      
      // Update queue status
      updateQueueStatus();
      
      console.log('Image synchronization started');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start synchronization';
      setSyncError(errorMessage);
      debugLogger.logError('Error starting sync:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [checkConnectivity, updateQueueStatus]);

  /**
   * Retry failed uploads
   */
  const retryFailedUploads = useCallback(async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      // Check connectivity first
      const online = await checkConnectivity();
      if (!online) {
        setSyncError('Device is offline');
        return;
      }
      
      // Get failed items from queue
      const queue = uploadQueue$.get() || {};
      const failedImageIds = Object.entries(queue)
        .filter(([_, item]) => item.status === 'failed')
        .map(([imageId, _]) => imageId);
      
      if (failedImageIds.length === 0) {
        console.log('No failed uploads to retry');
        return;
      }
      
      console.log('Retrying failed uploads:', failedImageIds.length);
      
      // Retry failed uploads
      await batchUploadImages(failedImageIds);
      
      // Update queue status
      updateQueueStatus();
      
      console.log('Failed uploads retried');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry uploads';
      setSyncError(errorMessage);
      debugLogger.logError('Error retrying failed uploads:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [checkConnectivity, updateQueueStatus]);

  /**
   * Ensure an image is downloaded for offline viewing
   */
  const ensureImageDownloadedForOffline = useCallback(async (
    imageMetadata: ImageMetadata
  ): Promise<string | null> => {
    try {
      // Check if we're online
      const online = await checkConnectivity();
      if (!online) {
        // If offline, return local URI if available
        if (imageMetadata.localUri) {
          return imageMetadata.localUri;
        }
        setSyncError('Device is offline and no local image available');
        return null;
      }
      
      // Ensure image is downloaded
      const localUri = await ensureImageDownloaded(imageMetadata);
      return localUri;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download image';
      setSyncError(errorMessage);
      debugLogger.logError('Error ensuring image download:', err);
      return null;
    }
  }, [checkConnectivity]);

  /**
   * Clear sync error
   */
  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  /**
   * Effect to monitor network connectivity changes
   */
  useEffect(() => {
    // Check initial connectivity
    checkConnectivity();
    
    // Listen for network connectivity changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable === true;
      setIsOnline(online);
      
      // If we just came online, start sync process
      if (online) {
        console.log('Network connectivity restored, starting sync process');
        startSync();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [checkConnectivity, startSync]);

  /**
   * Effect to monitor app state changes
   */
  useEffect(() => {
    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App came to foreground, checking for pending uploads');
        startSync();
      }
    });
    
    return () => {
      subscription?.remove();
    };
  }, [startSync]);

  /**
   * Effect to monitor upload queue changes
   */
  useEffect(() => {
    // Update queue status initially
    updateQueueStatus();
    
    // Set up interval to periodically update queue status
    const interval = setInterval(() => {
      updateQueueStatus();
    }, 5000); // Update every 5 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, [updateQueueStatus]);

  return {
    // State
    isSyncing,
    isOnline,
    queueStatus,
    syncError,
    
    // Functions
    startSync,
    retryFailedUploads,
    ensureImageDownloadedForOffline,
    checkConnectivity,
    clearSyncError,
  };
};