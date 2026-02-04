import { configureSynced } from '@legendapp/state/sync';
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Module-level variable to hold the configured plugin
  export const customSynced = configureSynced(syncedSupabase, {
    persist: {
      plugin: observablePersistAsyncStorage({ AsyncStorage }),
      retrySync: true,
    },
    retry: {
      infinite: true,
    },
    supabase,
    // changesSince: 'last-sync', // REMOVED default to allow per-observable opt-out
    fieldCreatedAt: 'created_at',
    fieldUpdatedAt: 'updated_at',
    generateId: () => uuidv4(),
    onError: (error) => {
      console.error('[LegendState Sync Error]:', error);
    },
  });
