import { when } from '@legendapp/state';
import { fetchAllCreatures } from '../services/creatureSyncService';
import { fetchAllDiveSites } from '../services/diveSiteSyncService';
import { 
  categories$, 
  creatures$, 
  diveSites$, 
  currentUserSightings$, 
  allUsersSightings$,
  wishlists$, 
  currentUserProfile$,
  allUsersProfiles$,
  setCurrentUserID,
  getCategories,
  getCreatures,
  getDiveSites,
  getCurrentUserSightings,
  getAllUsersSightings,
  getWishlists,
  getCurrentUserProfile,
  getAllUsersProfiles,
  achievements$, // Import achievements$ observable
  userAchievements$, // Import userAchievements$ observable
} from '../stores/syncedObservables';
import { images$ } from '../stores/imageState'; // Add this import

/**
 * Utility functions for data synchronization in the local-first app
 */

// Initialize all synced observables
export const initializeSync = async () => {
  try {
    // Get the configured synced instance
    const isOnline = require('@/stores/networkStore').getIsOnline();
    if (isOnline) {
      onSyncPress();
    } else {
      console.log('[initializeSync] Offline, skipping initial sync');
    }
    
  } catch (error) {
    console.error('Error initializing sync:', error);
  }
};

// Set current user and initialize user-specific observables
export const initializeUserSync = async (userId: string) => {
  try {
    // Set the current user ID
    setCurrentUserID(userId);

    onSyncPress();
    
  } catch (error) {
    console.error('Error initializing user sync:', error);
  }
};

// Clear user-specific data when logging out
export const clearUserSync = () => {
  try {
    // Starting user sync cleanup
    
    // Clear the current user ID
    // Clearing current user ID
    setCurrentUserID(null);
    
    // Clear user-specific observables
    // Clearing user-specific observables
    // Clearing current user sightings
    currentUserSightings$.set({});
    // Clearing wishlists
    wishlists$.set({});
    // Clearing profile
    currentUserProfile$.set({} as any);
    // Clearing user achievements
    userAchievements$.set({}); // Clear user achievements
    
    // Clear user-specific image data
    // Clearing images
    images$.set({});
    
    // User sync cleanup completed
  } catch (error) {
    console.error('[clearUserSync] Error clearing user sync:', error);
  }
};

// Wait for data to be loaded from persistence
export const waitForDataLoad = async () => {
  try {
    // Wait for catalog data to load
    await when(() => getCategories() !== undefined);
    await when(() => getCreatures() !== undefined);
    await when(() => getDiveSites() !== undefined);
    
  } catch (error) {
    console.error('Error waiting for data load:', error);
  }
};

// Force sync all data - removing the refresh calls as they may not exist
export const forceSyncAll = async () => {
  try {
    // Starting force sync of all observables
    
    // Instead of refresh, we can re-get the data to trigger sync
    const isOnline = require('@/stores/networkStore').getIsOnline();
    if (!isOnline) {
      console.log('[forceSyncAll] Offline, skipping force sync to prevent errors');
      return;
    }

    // Syncing categories
    // Syncing categories
    categories$.get();
    
    // Syncing creatures
    fetchAllCreatures();
    
    // Syncing dive sites
    fetchAllDiveSites();
    
    // Syncing current user sightings
    currentUserSightings$.get();
    
    // Syncing all users sightings
    allUsersSightings$.get();
    
    // Syncing wishlists
    wishlists$.get();
    
    // Syncing profile
    currentUserProfile$.get();
    
    // Syncing profiles
    allUsersProfiles$.get(); // Force sync profiles observable
    
    // Syncing achievements
    achievements$.get(); // Force sync achievements observable
    
    // Syncing user achievements
    userAchievements$.get(); // Force sync user achievements observable

    // Completed force sync of all observables
  } catch (error) {
    console.error('[forceSyncAll] Error during forced sync:', error);
  }
};


export const onSyncPress = async () => {
  try {
    // Call sync on each observable to flush local changes to remote
    const isOnline = require('@/stores/networkStore').getIsOnline();
    if (!isOnline) {
      console.log('[onSyncPress] Offline, skipping manual sync');
      return;
    }
    
    // customSynced(categories$);  
    // customSynced(creatures$);  
    // customSynced(diveSites$);
    // customSynced(currentUserSightings$);
    // customSynced(allUsersSightings$);
    // customSynced(wishlists$);
    // customSynced(currentUserProfile$);
    // customSynced(allUsersProfiles$);
    // customSynced(achievements$);

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
    currentUserSightingsLoaded: getCurrentUserSightings() !== undefined,
    allUsersSightingsLoaded: getAllUsersSightings() !== undefined,
    wishlistsLoaded: getWishlists() !== undefined,
    profileLoaded: getCurrentUserProfile() !== undefined,
    profilesLoaded: getAllUsersProfiles() !== undefined, // Include profiles loading status
    achievementsLoaded: achievements$.get() !== undefined, // Include achievements loading status
    userAchievementsLoaded: userAchievements$.get() !== undefined, // Include user achievements loading status
  };
};

// Check if there are pending sync operations
export const hasPendingSyncOperations = async () => {
  return false;
};

// Handle network status changes
export const handleNetworkStatusChange = (isConnected: boolean) => {
  if (isConnected) {
    // Legend State should automatically retry pending operations
  } else {
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