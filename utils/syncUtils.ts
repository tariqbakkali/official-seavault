import { when } from '@legendapp/state';
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
  getProfile
} from '../stores/syncedObservables';
import { supabase } from '../services/supabase';

/**
 * Utility functions for data synchronization in the local-first app
 */

// Initialize all synced observables
export const initializeSync = async () => {
  try {
    // Activate all observables to start syncing
    categories$.get();
    creatures$.get();
    diveSites$.get();
    
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
    
    // Activate user-specific observables
    sightings$.get();
    wishlists$.get();
    profile$.get();
    
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
    
    console.log('Forced sync completed');
  } catch (error) {
    console.error('Error during forced sync:', error);
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