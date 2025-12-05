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
    
    // Configure RevenueCat with user ID
    const { loginUser } = await import('../services/revenueCat');
    await loginUser(userId);
    console.log('[AppInitializer] RevenueCat configured with user ID');
    
    // Initialize user-specific data sync
    await initializeUserSync(userId);
    
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