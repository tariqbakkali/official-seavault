import { when } from '@legendapp/state';
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
  currentUserID$,
  allUsersAchievements$,
} from '../stores/syncedObservables';
import { images$ } from '../stores/imageState'; // Add this import
import { supabase } from '../services/supabase';

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

// Force sync all data - actually fetch from Supabase
export const forceSyncAll = async () => {
  try {
    console.log('[forceSyncAll] Starting fresh sync from Supabase...');
    
    const userId = currentUserID$.get();
    
    // Fetch catalog data (public, no user filter needed)
    const [categoriesRes, creaturesRes, achievementsRes, diveSitesRes] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('creatures').select('*'),
      supabase.from('achievements').select('*'),
      supabase.from('dive_sites').select('*'),
    ]);
    
    // Update catalog observables
    if (categoriesRes.data) {
      const categoriesObj = Object.fromEntries(categoriesRes.data.map((c: any) => [c.id, c]));
      categories$.set(categoriesObj);
    }
    if (creaturesRes.data) {
      const creaturesObj = Object.fromEntries(creaturesRes.data.map((c: any) => [c.id, c]));
      creatures$.set(creaturesObj);
    }
    if (achievementsRes.data) {
      const achievementsObj = Object.fromEntries(achievementsRes.data.map((a: any) => [a.id, a]));
      achievements$.set(achievementsObj);
    }
    if (diveSitesRes.data) {
      const diveSitesObj = Object.fromEntries(diveSitesRes.data.map((d: any) => [d.id, d]));
      diveSites$.set(diveSitesObj);
    }
    
    // Fetch user-specific data if logged in
    if (userId) {
      const [sightingsRes, wishlistsRes, profileRes, userAchievementsRes, allSightingsRes, allProfilesRes, allUserAchievementsRes] = await Promise.all([
        supabase.from('sightings').select('*').eq('user_id', userId),
        supabase.from('wishlists').select('*').eq('user_id', userId),
        supabase.from('profiles').select('*').eq('id', userId),
        supabase.from('user_achievements').select('*').eq('user_id', userId),
        supabase.from('sightings').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('user_achievements').select('*'),
      ]);
      
      // Update user-specific observables
      if (sightingsRes.data) {
        const sightingsObj = Object.fromEntries(sightingsRes.data.map((s: any) => [s.id, s]));
        currentUserSightings$.set(sightingsObj);
        console.log(`[forceSyncAll] Fetched ${sightingsRes.data.length} sightings for user`);
      }
      if (wishlistsRes.data) {
        const wishlistsObj = Object.fromEntries(wishlistsRes.data.map((w: any) => [w.id, w]));
        wishlists$.set(wishlistsObj);
      }
      if (profileRes.data && profileRes.data.length > 0) {
        const profileData: any = profileRes.data[0];
        const profileObj = { [profileData.id]: profileData };
        currentUserProfile$.set(profileObj);
      }
      if (userAchievementsRes.data) {
        const userAchievementsObj = Object.fromEntries(userAchievementsRes.data.map((ua: any) => [ua.id, ua]));
        userAchievements$.set(userAchievementsObj);
      }
      
      // Update all users data
      if (allSightingsRes.data) {
        const allSightingsObj = Object.fromEntries(allSightingsRes.data.map((s: any) => [s.id, s]));
        allUsersSightings$.set(allSightingsObj);
      }
      if (allProfilesRes.data) {
        const allProfilesObj = Object.fromEntries(allProfilesRes.data.map((p: any) => [p.id, p]));
        allUsersProfiles$.set(allProfilesObj);
      }
      if (allUserAchievementsRes.data) {
        const allUserAchievementsObj = Object.fromEntries(allUserAchievementsRes.data.map((ua: any) => [ua.id, ua]));
        allUsersAchievements$.set(allUserAchievementsObj);
      }
    }
    
    console.log('[forceSyncAll] Sync completed successfully');
  } catch (error) {
    console.error('[forceSyncAll] Error during forced sync:', error);
    throw error;
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