/**
 * Route constants for navigation
 * Centralized route management for better maintainability
 */
export const ROUTES = {
  // Auth routes
  AUTH: {
    ROOT: '/(auth)' as const,
    LOGIN: '/(auth)/login' as const,
  },
  
  // Main tab routes
  TABS: {
    ROOT: '/(tabs)' as const,
    HOME: '/(tabs)' as const,
    CATEGORIES: '/(tabs)/categories' as const,
    LOG_DIVE: '/(tabs)/log-dive' as const,
    PROFILE: '/(tabs)/profile' as const,
  },
  
  // Category routes
  CATEGORY: {
    DETAIL: (id: string) => `/categories/${id}` as const,
  },
  
  // Creature routes
  CREATURE: {
    DETAIL: (id: string) => `/creatures/${id}` as const,
  },
  
  // Profile routes
  PROFILE: {
    EDIT: '/profile/edit' as const,
  },
  
  // Stats routes
  STATS: {
    DISCOVERED: '/stats/discovered' as const,
    POINTS: '/stats/points' as const,
    WISHLIST: '/stats/wishlist' as const,
  },
  
  // Modal routes (to be implemented)
  MODAL: {
    LEADERBOARD: '/modal/leaderboard' as const,
    EXPLORE: '/modal/explore' as const,
  },
  
  // Other routes
  NOT_FOUND: '/+not-found' as const,
} as const;

/**
 * Tab configuration
 */
export const TAB_CONFIG = {
  HOME: {
    name: 'index' as const,
    title: 'Home',
    icon: 'Fish',
  },
  CATEGORIES: {
    name: 'categories' as const,
    title: 'Categories',
    icon: 'Grid3x3',
  },
  LOG_DIVE: {
    name: 'log-dive' as const,
    title: 'Log a Dive',
    icon: 'Plus',
  },
  PROFILE: {
    name: 'profile' as const,
    title: 'Profile',
    icon: 'User',
  },
} as const;

/**
 * Navigation stack configuration
 */
export const STACK_CONFIG = {
  // Common screen options
  DEFAULT_SCREEN_OPTIONS: {
    headerShown: false,
    animation: 'slide_from_right' as const,
  },
  
  // Modal screen options
  MODAL_SCREEN_OPTIONS: {
    headerShown: false,
    presentation: 'modal' as const,
    animation: 'slide_from_bottom' as const,
  },
} as const;

/**
 * Route parameter types for type safety
 */
export type RouteParams = {
  '/categories/[id]': { id: string };
  '/creatures/[id]': { id: string };
  '/stats/discovered': undefined;
  '/stats/points': undefined;
  '/stats/wishlist': undefined;
  '/profile/edit': undefined;
  '/modal/leaderboard': undefined;
  '/modal/explore': undefined;
};