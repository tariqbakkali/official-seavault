/**
 * API and external service configuration
 */
export const API_CONFIG = {
  // Supabase configuration
  SUPABASE: {
    PROJECT_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    
    // Storage buckets
    BUCKETS: {
      AVATARS: 'avatars',
      CREATURE_IMAGES: 'creature-images',
      SIGHTING_IMAGES: 'sighting-images',
    },
    
    // Table names
    TABLES: {
      PROFILES: 'profiles',
      CREATURES: 'creatures',
      CATEGORIES: 'categories',
      SIGHTINGS: 'sightings',
      DIVE_SITES: 'dive_sites',
      WISHLISTS: 'wishlists',
      ACHIEVEMENTS: 'achievements',
    },
  },
  
  // Request timeouts
  TIMEOUTS: {
    DEFAULT: 10000, // 10 seconds
    UPLOAD: 30000, // 30 seconds
    DOWNLOAD: 60000, // 60 seconds
  },
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
    BACKOFF_MULTIPLIER: 2,
  },
} as const;

/**
 * Image processing configuration
 */
export const IMAGE_CONFIG = {
  // Supported formats
  FORMATS: ['jpg', 'jpeg', 'png', 'webp'] as const,
  
  // Quality settings
  QUALITY: {
    THUMBNAIL: 0.6,
    MEDIUM: 0.8,
    HIGH: 0.9,
  },
  
  // Size limits
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DIMENSION: 2048,
  
  // Thumbnail sizes
  THUMBNAIL_SIZES: {
    SMALL: 150,
    MEDIUM: 300,
    LARGE: 600,
  },
} as const;

/**
 * Sync configuration
 */
export const SYNC_CONFIG = {
  // Sync intervals
  BACKGROUND_SYNC_INTERVAL: 15 * 60 * 1000, // 15 minutes
  FOREGROUND_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  
  // Batch sizes
  BATCH_SIZE: {
    SIGHTINGS: 10,
    WISHLISTS: 20,
    IMAGES: 5,
  },
  
  // Conflict resolution
  CONFLICT_RESOLUTION: 'server_wins' as const,
} as const;