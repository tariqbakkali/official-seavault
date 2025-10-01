import { configureSynced } from '@legendapp/state/sync';
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Configure Legend-State with Supabase integration and persistence
export const configureLegendState = () => {
  configureSynced(syncedSupabase, {
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
};

// Create a configured synced observable factory to use elsewhere
export const createSyncedObservable = configureSynced(syncedSupabase, {
  persist: {
    plugin: observablePersistAsyncStorage({ AsyncStorage }),
    retrySync: true,
  },
  retry: {
    infinite: true,
  },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',
  fieldDeleted: 'deleted',
  generateId: () => uuidv4(),
});
