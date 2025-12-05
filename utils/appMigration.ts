import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories$, creatures$, achievements$, diveSites$ } from '@/stores/syncedObservables';
import Constants from 'expo-constants';

const MIGRATION_VERSION_KEY = 'app_migration_version';

/**
 * Check if app version has changed and run migrations if needed
 * This clears stale catalog data when users update the app
 */
export const checkAndRunMigrations = async () => {
  try {
    const currentVersion = Constants.expoConfig?.version || '1.0.0';
    const storedVersion = await AsyncStorage.getItem(MIGRATION_VERSION_KEY);
    
    console.log(`[Migration] Current version: ${currentVersion}, Stored version: ${storedVersion}`);
    
    if (storedVersion !== currentVersion) {
      console.log(`[Migration] Version changed: ${storedVersion} → ${currentVersion}`);
      await clearCatalogData();
      await AsyncStorage.setItem(MIGRATION_VERSION_KEY, currentVersion);
      console.log('[Migration] Migration completed successfully');
      return true;
    }
    
    console.log('[Migration] No migration needed');
    return false;
  } catch (error) {
    console.error('[Migration] Error during migration:', error);
    return false;
  }
};

/**
 * Clear catalog data (creatures, categories, achievements, dive sites)
 * This removes stale data including deleted creatures/categories
 * User data (sightings, wishlists, profile) is preserved
 */
const clearCatalogData = async () => {
  console.log('[Migration] Clearing stale catalog data...');
  
  try {
    // Clear catalog observables (public data that can be re-fetched)
    categories$.set({});
    creatures$.set({});
    achievements$.set({});
    diveSites$.set({});
    
    // Clear AsyncStorage keys for catalog
    await AsyncStorage.multiRemove([
      'categories',
      'creatures',
      'achievements',
      'dive_sites',
    ]);
    
    console.log('[Migration] Catalog data cleared - will re-fetch from server');
  } catch (error) {
    console.error('[Migration] Error clearing catalog data:', error);
    throw error;
  }
};

/**
 * Manually clear all catalog data
 * Useful for troubleshooting or forcing a refresh
 */
export const forceClearCatalog = async () => {
  console.log('[Migration] Manually clearing catalog...');
  await clearCatalogData();
};
