import { initializeSync, initializeUserSync, clearUserSync } from './syncUtils';
import { supabase } from '../services/supabase';
import { setCurrentUserID } from '../stores/syncedObservables';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkPendingImageUploads } from '../services/imageSyncService'; // Import checkPendingImageUploads
import { checkAndRunMigrations } from './appMigration'; // Import migration utility

/**
 * Application initializer for local-first functionality
 * This should be called when the app starts
 */

export const initializeApp = async () => {
  try {
    // Check and run migrations first (clears stale catalog data on version change)
    await checkAndRunMigrations();
    
    // Configure Legend-State
    // configureLegendState();
    
    // Initialize catalog data sync
    await initializeSync();

    // Check for any pending image uploads on app start
    checkPendingImageUploads();
    
  } catch (error) {
    console.error('Error initializing local-first app:', error);
    throw error;
  }
};

/**
 * Clear AsyncStorage data on app load
 * This function safely clears all AsyncStorage data for the app
 */
export const clearAsyncStorageOnLoad = async () => {
  try {
    // Clear all AsyncStorage data
    await AsyncStorage.clear();
    // AsyncStorage cleared successfully on app load
  } catch (error) {
    console.error('Error clearing AsyncStorage on app load:', error);
  }
};

/**
 * Initialize user-specific sync when user logs in
 */
export const initializeUserSession = async (userId: string) => {
  try {
    // Set current user ID
    setCurrentUserID(userId);
    
    // 1. Initialize user-specific data sync FIRST to get the profile
    await initializeUserSync(userId);
    
    // 2. Check if user is already premium in our database
    // We need to import the observable store to check
    const { currentUserProfile$ } = await import('../stores/syncedObservables');
    
    // Give the observable a moment to hydrate from local storage if available
    await new Promise(r => setTimeout(r, 100));
    
    const profiles = currentUserProfile$.get();
    let profileData = profiles && profiles[userId] ? profiles[userId] : null;

    // PARANOID CHECK: 
    // If local cache says "Premium", we trust it (fast path).
    // If local cache says "Free" or is missing, we DON'T trust it (stale cache risk).
    // We force a fetch from Supabase to be absolutely sure before showing paywall.
    const localIsPremium = profileData?.is_premium === true;
    
    if (localIsPremium) {
         console.log('[AppInitializer] ✅ Local cache says Premium. Skipping RevenueCat.');
    } else {
         console.log('[AppInitializer] Local cache says Free/Missing. Verifying with Server (Paranoid Check)...');
         const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
         if (data && !error) {
             profileData = data as any;
             console.log('[AppInitializer] Server Verification Result:', profileData?.is_premium);
             
             // Update observable with truth
             currentUserProfile$.assign({
                 [userId]: { ...profileData, id: userId } as any
             });
         } else {
             console.log('[AppInitializer] Server check failed or confirmed Free. Proceeding with RevenueCat.');
         }
    }
    
    const isPremiumConfirmed = profileData?.is_premium === true;
    
    if (isPremiumConfirmed) {
        console.log('[AppInitializer] ✅ User is Premium (Confirmed). Skipping RevenueCat login/sync.');
    } else {
        // 4. Only configure RevenueCat if NOT premium (or status unknown)
        const { loginUser } = await import('../services/revenueCat');
        await loginUser(userId);
        console.log('[AppInitializer] RevenueCat configured with user ID (User is not Premium in DB)');
    }
    
  } catch (error) {
    console.error('Error initializing user session:', error);
    throw error;
  }
};

/**
 * Clean up user session when user logs out
 */
export const cleanupUserSession = async () => {
  try {
    // Logout from RevenueCat
    const { logoutUser } = await import('../services/revenueCat');
    await logoutUser();
    console.log('[AppInitializer] RevenueCat user logged out');
    
    // Clear user ID
    setCurrentUserID(null);
    
    // Clear user-specific observables
    clearUserSync();
    
  } catch (error) {
    console.error('Error cleaning up user session:', error);
    throw error;
  }
};

/**
 * Handle app going to background/foreground
 */
export const handleAppStateChange = (isActive: boolean) => {
  if (isActive) {
    // App is active, sync will continue automatically
  } else {
    // App is in background, sync will pause but resume when active
  }
};

export default {
  initializeApp,
  clearAsyncStorageOnLoad,
  initializeUserSession,
  cleanupUserSession,
  handleAppStateChange,
};