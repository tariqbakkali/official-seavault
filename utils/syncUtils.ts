import { when } from '@legendapp/state';
import { 
  categories$, 
  creatures$, 
  diveSites$, 
  currentUserSightings$, 
  allUsersSightings$,
  wishlists$, 
  profile$,
  setCurrentUserID,
  getCategories,
  getCreatures,
  getDiveSites,
  getCurrentUserSightings,
  getAllUsersSightings,
  getWishlists,
  getProfile,
  profiles$, // Import profiles$ observable
  achievements$, // Import achievements$ observable
  userAchievements$, // Import userAchievements$ observable
} from '../stores/syncedObservables';
// import { customSynced } from '@/services/legendStateConfig';

/**
 * Utility functions for data synchronization in the local-first app
 */

// Initialize all synced observables
export const initializeSync = async () => {
  try {
    // Get the configured synced instance
    onSyncPress();
    
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
    // Clear the current user ID
    setCurrentUserID(null);
    
    // Clear user-specific observables
    currentUserSightings$.set({});
    wishlists$.set({});
    profile$.set({} as any);
    
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
    currentUserSightings$.get();
    allUsersSightings$.get();
    wishlists$.get();
    profile$.get();
    profiles$.get(); // Force sync profiles observable
    achievements$.get(); // Force sync achievements observable
    userAchievements$.get(); // Force sync user achievements observable

  } catch (error) {
    console.error('Error during forced sync:', error);
  }
};


export const onSyncPress = async () => {
  try {
    // Call sync on each observable to flush local changes to remote
    // customSynced(categories$);  
    // customSynced(creatures$);  
    // customSynced(diveSites$);
    // customSynced(currentUserSightings$);
    // customSynced(allUsersSightings$);
    // customSynced(wishlists$);
    // customSynced(profile$);
    // customSynced(profiles$);
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
    profileLoaded: getProfile() !== undefined,
    profilesLoaded: profiles$.get() !== undefined, // Include profiles loading status
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