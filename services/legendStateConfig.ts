import { configureSynced } from '@legendapp/state/sync';
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Module-level variable to hold the configured plugin
let configuredSynced: any = null;

// Configure Legend-State with Supabase integration and persistence
export const configureLegendState = () => {
  if (configuredSynced) {
    // Already configured, return early
    return configuredSynced;
  }

  configuredSynced = configureSynced(syncedSupabase, {
    persist: {
      plugin: observablePersistAsyncStorage({ AsyncStorage }),
      retrySync: true,
    },
    retry: {
      infinite: true,
    },
    changesSince: 'last-sync',
    fieldCreatedAt: 'created_at',
    fieldUpdatedAt: 'updated_at', // Use updated_at if possible, else revert to created_at
    fieldDeleted: 'deleted',      // Required for soft deletes in last-sync mode
    generateId: () => uuidv4(),
  });

  return configuredSynced;
};

// Create a factory function for observables that uses the globally configured plugin
export const createSyncedObservable = (options: any) => {
  // Ensure Legend-State is configured
  if (!configuredSynced) {
    configureLegendState();
  }
  
  // Return the configured synced observable with the provided options
  return configuredSynced(options);
};
