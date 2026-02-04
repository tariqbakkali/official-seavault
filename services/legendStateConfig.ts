import { configureSynced } from '@legendapp/state/sync';
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import { observablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
import { supabase } from './supabase'; // Ensure this points to your Supabase client
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/types/database';

/**
 * 1. Initialize MMKV. 
 * You can add a 'path' or 'encryptionKey' here later for security.
 */
/**
 * 1. Initialize MMKV. 
 * You can add a 'path' or 'encryptionKey' here later for security.
 */
let storage: MMKV | undefined;
let persistPlugin: any;

try {
  storage = new MMKV({
    id: 'app-storage',
  });
  persistPlugin = observablePersistMMKV({ mmkv: storage } as any);
} catch (e) {
  console.warn('MMKV failed to initialize. Falling back to AsyncStorage. This is expected if using a remote debugger.');
  persistPlugin = observablePersistAsyncStorage({
    AsyncStorage,
  });
}

/**
 * 2. Configure the Synced Plugin
 * This creates a reusable sync wrapper for your observables.
 */
export const customSynced = configureSynced(syncedSupabase, {
  // Persistence configuration
  // Persistence configuration
  // Persistence configuration
  persist: {
    plugin: persistPlugin,
    retrySync: true,
  },
  
  // Retry strategy for Supabase requests
  retry: {
    infinite: true,
    backoff: 'exponential',
  },
  
  // Supabase specific config
  supabase,
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',
  
  // Default Update Handler
  // This provides a sensible default for all synced observables
  update: async ({ collection, value }: any) => {
    const { data, error } = await supabase
      .from(collection)
      .upsert(value)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update ${collection}: ${error.message}`);
    }
    return { data, error: null };
  },

  // ID Generation
  // Supabase UUID columns require valid UUIDs (v4)
  generateId: () => uuidv4(),
  
  // Error Handling
  onError: (error) => {
    console.error('[LegendState Sync Error]:', error);
  },
});

