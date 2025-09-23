/**
 * App-level constants and configuration
 */
export const APP_CONFIG = {
  NAME: 'SeaVault',
  TAGLINE: 'Discover them all',
  VERSION: '1.0.0',
  BUILD: process.env.NODE_ENV || 'development',
} as const;

export const APP_FEATURES = {
  OFFLINE_SUPPORT: false,
  BACKGROUND_SYNC: false,
  PUSH_NOTIFICATIONS: false, // TODO: Implement later
  BIOMETRIC_AUTH: false, // TODO: Implement later
} as const;

export const PERFORMANCE = {
  // Image optimization
  IMAGE_QUALITY: 0.8,
  THUMBNAIL_SIZE: 150,
  HERO_IMAGE_HEIGHT: 300,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  
  // Cache settings
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours in ms
  MAX_CACHE_SIZE: 100 * 1024 * 1024, // 100MB
} as const;

export const VALIDATION = {
  // Password requirements
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  
  // Text field limits
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_NOTES_LENGTH: 500,
  
  // Numeric limits
  MAX_DEPTH: 1000, // meters
  MIN_DEPTH: 0,
} as const;