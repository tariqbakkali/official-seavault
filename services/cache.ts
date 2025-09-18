import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { CachedCatalog, CachedUserData, PendingOperation } from '@/types/database';

// Check if documentDirectory exists on the FileSystem object
const documentDirectory = (FileSystem as any).documentDirectory;
const CACHE_DIR = Platform.OS !== 'web' && documentDirectory ? documentDirectory + 'cache/' : null;
const QUEUE_DIR = CACHE_DIR ? CACHE_DIR + 'queue/' : null;

// Platform-specific cache implementation
const isWeb = Platform.OS === 'web';

// Ensure cache directories exist (no-op on web)
export const ensureCacheDirectories = async () => {
  if (isWeb) {
    // No directory creation needed on web
    return;
  }

  try {
    if (!FileSystem || !CACHE_DIR || !QUEUE_DIR) return;

    const cacheExists = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!cacheExists.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
    
    const queueExists = await FileSystem.getInfoAsync(QUEUE_DIR);
    if (!queueExists.exists) {
      await FileSystem.makeDirectoryAsync(QUEUE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error creating cache directories:', error);
  }
};

// AsyncStorage helpers (for small data)
export const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting storage item ${key}:`, error);
  }
};

export const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting storage item ${key}:`, error);
    return null;
  }
};

// Platform-specific JSON storage
export const saveJson = async <T>(filename: string, data: T): Promise<void> => {
  try {
    if (isWeb) {
      // Use AsyncStorage on web
      await AsyncStorage.setItem(`cache_${filename}`, JSON.stringify(data));
    } else {
      // Use FileSystem on native
      if (!FileSystem || !CACHE_DIR) return;
      await ensureCacheDirectories();
      const filepath = CACHE_DIR + filename;
      await FileSystem.writeAsStringAsync(filepath, JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Error saving JSON file ${filename}:`, error);
  }
};

export const loadJson = async <T>(filename: string): Promise<T | null> => {
  try {
    if (isWeb) {
      // Use AsyncStorage on web
      const content = await AsyncStorage.getItem(`cache_${filename}`);
      return content ? JSON.parse(content) as T : null;
    } else {
      // Use FileSystem on native
      if (!FileSystem || !CACHE_DIR) return null;
      const filepath = CACHE_DIR + filename;
      const fileInfo = await FileSystem.getInfoAsync(filepath);
      
      if (!fileInfo.exists) {
        return null;
      }
      
      const content = await FileSystem.readAsStringAsync(filepath);
      return JSON.parse(content) as T;
    }
  } catch (error) {
    console.error(`Error loading JSON file ${filename}:`, error);
    return null;
  }
};

// Platform-specific queue management
export const queueOperation = async (operation: PendingOperation): Promise<void> => {
  try {
    if (isWeb) {
      // Use AsyncStorage on web
      await AsyncStorage.setItem(`queue_${operation.clientId}`, JSON.stringify(operation));
    } else {
      // Use FileSystem on native
      if (!FileSystem || !QUEUE_DIR) return;
      await ensureCacheDirectories();
      const filepath = QUEUE_DIR + `${operation.clientId}.json`;
      await FileSystem.writeAsStringAsync(filepath, JSON.stringify(operation));
    }
  } catch (error) {
    console.error('Error queuing operation:', error);
  }
};

export const getQueuedOperations = async (): Promise<PendingOperation[]> => {
  try {
    const operations: PendingOperation[] = [];

    if (isWeb) {
      // Use AsyncStorage on web
      const keys = await AsyncStorage.getAllKeys();
      const queueKeys = keys.filter(key => key.startsWith('queue_'));
      
      for (const key of queueKeys) {
        const content = await AsyncStorage.getItem(key);
        if (content) {
          const operation = JSON.parse(content) as PendingOperation;
          operations.push(operation);
        }
      }
    } else {
      // Use FileSystem on native
      if (!FileSystem || !QUEUE_DIR) return operations;
      await ensureCacheDirectories();
      const files = await FileSystem.readDirectoryAsync(QUEUE_DIR);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await FileSystem.readAsStringAsync(QUEUE_DIR + file);
          const operation = JSON.parse(content) as PendingOperation;
          operations.push(operation);
        }
      }
    }
    
    return operations.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  } catch (error) {
    console.error('Error getting queued operations:', error);
    return [];
  }
};

export const removeQueuedOperation = async (clientId: string): Promise<void> => {
  try {
    if (isWeb) {
      // Use AsyncStorage on web
      await AsyncStorage.removeItem(`queue_${clientId}`);
    } else {
      // Use FileSystem on native
      if (FileSystem && QUEUE_DIR) {
        const path = `${QUEUE_DIR}${clientId}.json`;
        await FileSystem.deleteAsync(path, { idempotent: true });
      }
    }
  } catch (err) {
    console.error("Error removing queued operation", err);
  }
};

// Cache management helpers
export const saveCatalogCache = async (catalog: CachedCatalog): Promise<void> => {
  await saveJson('catalog.json', catalog);
  await setStorageItem('lastCatalogSyncAt', catalog.lastSyncAt);
};

export const loadCatalogCache = async (): Promise<CachedCatalog | null> => {
  return await loadJson<CachedCatalog>('catalog.json');
};

export const saveUserDataCache = async (userData: CachedUserData): Promise<void> => {
  await saveJson('user-data.json', userData);
  await setStorageItem('lastUserSyncAt', userData.lastSyncAt);
};

export const loadUserDataCache = async (): Promise<CachedUserData | null> => {
  return await loadJson<CachedUserData>('user-data.json');
};

export const saveDiveSitesCache = async (diveSites: any[]): Promise<void> => {
  await saveJson('dive_sites.json', { diveSites, lastSyncAt: new Date().toISOString() });
};

export const loadDiveSitesCache = async (): Promise<any[] | null> => {
  const data = await loadJson<{ diveSites: any[]; lastSyncAt: string }>('dive_sites.json');
  return data?.diveSites || null;
};