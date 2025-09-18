/**
 * Storage keys and cache configuration
 */
export const STORAGE_KEYS = {
  // User data
  USER_PROFILE: 'user_profile',
  USER_PREFERENCES: 'user_preferences',
  
  // App data
  CATALOG_DATA: 'catalog_data',
  DIVE_SITES: 'dive_sites',
  USER_DATA: 'user_data',
  
  // Cache metadata
  LAST_SYNC: 'last_sync',
  CACHE_VERSION: 'cache_version',
  
  // Offline data
  PENDING_SIGHTINGS: 'pending_sightings',
  PENDING_WISHLISTS: 'pending_wishlists',
  
  // App state
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FIRST_LAUNCH: 'first_launch',
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  // Cache expiration times (in milliseconds)
  CATALOG_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  USER_DATA_EXPIRY: 30 * 60 * 1000, // 30 minutes
  DIVE_SITES_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Cache versions for migration
  CURRENT_VERSION: '1.0.0',
  
  // File paths
  CACHE_DIR: 'cache',
  IMAGES_DIR: 'cache/images',
  DATA_DIR: 'cache/data',
} as const;

/**
 * Local database configuration
 */
export const DB_CONFIG = {
  // SQLite database settings
  DB_NAME: 'seavault.db',
  DB_VERSION: 1,
  
  // Table names
  TABLES: {
    CREATURES: 'creatures',
    CATEGORIES: 'categories',
    SIGHTINGS: 'sightings',
    DIVE_SITES: 'dive_sites',
    WISHLISTS: 'wishlists',
  },
} as const;