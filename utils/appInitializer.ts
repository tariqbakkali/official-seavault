import { initializeSync, initializeUserSync } from './syncUtils';
import { supabase } from '../services/supabase';
import { setCurrentUserID } from '../stores/syncedObservables';

/**
 * Application initializer for local-first functionality
 * This should be called when the app starts
 */

export const initializeApp = async () => {
  try {
    // Configure Legend-State
    // configureLegendState();
    
    // Initialize catalog data sync
    await initializeSync();
    
    console.log('Local-first app initialized successfully');
  } catch (error) {
    console.error('Error initializing local-first app:', error);
    throw error;
  }
};

/**
 * Initialize user-specific sync when user logs in
 */
export const initializeUserSession = async (userId: string) => {
  try {
    // Set current user ID
    setCurrentUserID(userId);
    
    // Initialize user-specific data sync
    await initializeUserSync(userId);
    
    console.log(`User session initialized for user: ${userId}`);
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
    // Clear user ID
    setCurrentUserID(null);
    
    // Clear user-specific observables
    // This is handled in the clearUserSync function
    
    console.log('User session cleaned up');
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
    console.log('App became active, ensuring sync is up to date');
    // App is active, sync will continue automatically
  } else {
    console.log('App went to background, sync will pause');
    // App is in background, sync will pause but resume when active
  }
};

export default {
  initializeApp,
  initializeUserSession,
  cleanupUserSession,
  handleAppStateChange,
};