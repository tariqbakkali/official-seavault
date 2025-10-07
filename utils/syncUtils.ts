import { when } from '@legendapp/state';
import { configureLegendState } from '../services/legendStateConfig';
import { 
  categories$, 
  creatures$, 
  diveSites$, 
  sightings$, 
  wishlists$, 
  profile$,
  setCurrentUserID,
  getCategories,
  getCreatures,
  getDiveSites,
  getSightings,
  getWishlists,
  getProfile,
  profiles$, // Import profiles$ observable
  achievements$, // Import achievements$ observable
} from '../stores/syncedObservables';

/**
 * Utility functions for data synchronization in the local-first app
 */

// Initialize all synced observables
export const initializeSync = async () => {
  try {
    // Get the configured synced instance
    // const synced = configureLegendState();
    configureLegendState();
    
    // // Sync catalog data
    // await synced.sync(categories$);
    // await synced.sync(creatures$);
    // await synced.sync(diveSites$);
    // await synced.sync(profiles$);
    // await synced.sync(achievements$);
    
    console.log('Sync initialization completed');
  } catch (error) {
    console.error('Error initializing sync:', error);
  }
};

// Set current user and initialize user-specific observables
export const initializeUserSync = async (userId: string) => {
  try {
    // Set the current user ID
    setCurrentUserID(userId);

    configureLegendState();
    
    // // Get the configured synced instance
    // const synced = configureLegendState();
    
    // // Sync user-specific data
    // await synced.sync(sightings$);
    // await synced.sync(wishlists$);
    // await synced.sync(profile$);
    
    console.log(`User sync initialized for user: ${userId}`);
  } catch (error) {
    console.error('Error initializing user sync:', error);
  }
};

// Clear user-specific data when logging out
export const clearUserSync = () => {
  try {
    // Clear the current user ID
    setCurrentUserID(null);
    
    // Clear user-specific observables
    sightings$.set({});
    wishlists$.set({});
    profile$.set({} as any);
    
    console.log('User sync cleared');
  } catch (error) {
    console.error('Error clearing user sync:', error);
  }
};

// Wait for data to be loaded from persistence
export const waitForDataLoad = async () => {
  try {
    // Wait for catalog data to load
    await when(() => getCategories() !== undefined);
    await when(() => getCreatures() !== undefined);
    await when(() => getDiveSites() !== undefined);
    
    console.log('Data loaded from persistence');
  } catch (error) {
    console.error('Error waiting for data load:', error);
  }
};

// Force sync all data - removing the refresh calls as they may not exist
export const forceSyncAll = async () => {
  try {
    // Instead of refresh, we can re-get the data to trigger sync
    categories$.get();
    creatures$.get();
    diveSites$.get();
    sightings$.get();
    wishlists$.get();
    profile$.get();
    profiles$.get(); // Force sync profiles observable
    achievements$.get(); // Force sync achievements observable


    console.log('Forced sync completed');
  } catch (error) {
    console.error('Error during forced sync:', error);
  }
};

const synced = configureLegendState();

export const onSyncPress = async () => {
  try {
    // Call sync on each observable to flush local changes to remote
    await synced.sync(categories$);  
    await synced.sync(creatures$);  
    await synced.sync(diveSites$);
    await synced.sync(sightings$);
    await synced.sync(wishlists$);
    await synced.sync(profile$);
    await synced.sync(profiles$);
    await synced.sync(achievements$);

    console.log('Manual sync completed');
  } catch (error) {
    console.error('Manual sync failed:', error);
  }
};


// Get sync status
export const getSyncStatus = () => {
  return {
    categoriesLoaded: getCategories() !== undefined,
    creaturesLoaded: getCreatures() !== undefined,
    diveSitesLoaded: getDiveSites() !== undefined,
    sightingsLoaded: getSightings() !== undefined,
    wishlistsLoaded: getWishlists() !== undefined,
    profileLoaded: getProfile() !== undefined,
    profilesLoaded: profiles$.get() !== undefined, // Include profiles loading status
    achievementsLoaded: achievements$.get() !== undefined, // Include achievements loading status
  };
};

// Check if there are pending sync operations
export const hasPendingSyncOperations = async () => {
  return false;
};

// Handle network status changes
export const handleNetworkStatusChange = (isConnected: boolean) => {
  if (isConnected) {
    console.log('Network connection restored, retrying pending operations');
    // Legend State should automatically retry pending operations
  } else {
    console.log('Network connection lost, operations will be queued');
  }
};

// Export all utility functions
export default {
  initializeSync,
  initializeUserSync,
  clearUserSync,
  waitForDataLoad,
  forceSyncAll,
  getSyncStatus,
  hasPendingSyncOperations,
  handleNetworkStatusChange,
};