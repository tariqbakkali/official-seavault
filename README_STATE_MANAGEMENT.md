# State Management Update

This document explains the updated architecture using Zustand for state management.

## Overview

We've moved all service functionality directly into Zustand stores for better state management and eliminated redundant service files:

1. **Achievement Management** → `stores/achievement/`
2. **Authentication** → `stores/auth/`
3. **Data Management** → `stores/data/`

## New Architecture

### Achievement Management
- **Store**: `useAchievementStore` Zustand store
- **Functions**: `checkAchievements`, `getUnlockedAchievements`, `getAchievementProgress`
- **Queries**: Database query functions for achievements

### Authentication
- **Store**: `useAuthStore` Zustand store
- **Functions**: `initializeAuth`, `signUp`, `signIn`, `signOut`, `resetPassword`, `updatePassword`, `updateEmail`, `setupAuthListener`, `checkIsAuthenticated`, `getCurrentUser`, `getCurrentSession`, `fetchCurrentUser`, `getAuthState`

### Data Management
- **Store**: `useDataStore` Zustand store
- **Functions**: `fetchCatalog`, `fetchUserData`, `fetchDiveSites`, `createSighting`, `updateUserProfile`, `toggleWishlistItem`, `ensureUserProfile`, `createProfileForCurrentUser`
- **Utilities**: `calculateUserStats` function for statistics calculation
- **Queries**: All database query functions are now in a separate queries module

### Catalog Store (New)
- **Store**: `useCatalogStore` Zustand store
- **Functions**: `fetchCatalog`, `getCategories`, `getCreatures`, `getAchievements`
- **Queries**: Database query functions for categories, creatures, and achievements

### User Store (New)
- **Store**: `useUserStore` Zustand store
- **Functions**: `fetchUserData`, `updateUserProfile`, `ensureUserProfile`, `createProfileForCurrentUser`
- **Queries**: Database query functions for user profiles, sightings, and wishlists
- **Utilities**: `calculateUserStats` function for statistics calculation

### Dive Sites Store (New)
- **Store**: `useDiveSitesStore` Zustand store
- **Functions**: `fetchDiveSites`, `getDiveSiteById`
- **Queries**: Database query functions for dive sites

### Sightings Store (New)
- **Store**: `useSightingsStore` Zustand store
- **Functions**: `createSighting`, `updateSighting`, `deleteSighting`
- **Queries**: Database query functions for sightings

### Wishlist Store (New)
- **Store**: `useWishlistStore` Zustand store
- **Functions**: `toggleWishlistItem`, `addToWishlist`, `removeFromWishlist`, `isCreatureInWishlist`
- **Queries**: Database query functions for wishlists

## Usage

### Using the Stores Directly (Recommended)
```typescript
import { useAuthStore } from '@/stores/auth';
import { useDataStore } from '@/stores/data';
import { useAchievementStore } from '@/stores/achievement';
import { useCatalogStore } from '@/stores/catalog';
import { useUserStore } from '@/stores/user';
import { useDiveSitesStore } from '@/stores/diveSites';
import { useSightingsStore } from '@/stores/sightings';
import { useWishlistStore } from '@/stores/wishlist';

// In a component
const MyComponent = () => {
  const { user, signIn, signOut } = useAuthStore();
  const { catalog, fetchCatalog } = useDataStore();
  const { unlockedAchievements, checkAchievements } = useAchievementStore();
  const { categories, getCategories } = useCatalogStore();
  const { userData, fetchUserData } = useUserStore();
  const { diveSites, fetchDiveSites } = useDiveSitesStore();
  const { createSighting } = useSightingsStore();
  const { toggleWishlistItem } = useWishlistStore();
  
  // Use the state and functions directly
};

// In a service or utility function
const { signIn: signInFn } = useAuthStore.getState();
const { fetchCatalog: fetchCatalogFn } = useDataStore.getState();
const { checkAchievements: checkAchievementsFn } = useAchievementStore.getState();
const { getCategories: getCategoriesFn } = useCatalogStore.getState();
const { fetchUserData: fetchUserDataFn } = useUserStore.getState();
const { fetchDiveSites: fetchDiveSitesFn } = useDiveSitesStore.getState();
const { createSighting: createSightingFn } = useSightingsStore.getState();
const { toggleWishlistItem: toggleWishlistItemFn } = useWishlistStore.getState();
```

### Using the Functional Services (Backward Compatibility)
```typescript
import { signIn, signOut } from '@/stores/auth';
import { fetchCatalog, fetchUserData } from '@/stores/data';
import { checkAchievements } from '@/stores/achievement';
import { fetchCatalog as fetchCatalogCatalog } from '@/stores/catalog/service/service';
import { fetchUserData as fetchUserDataUser } from '@/stores/user/service/service';
import { fetchDiveSites as fetchDiveSitesDiveSites } from '@/stores/diveSites/service/service';
import { createSighting as createSightingSightings } from '@/stores/sightings/service/service';
import { toggleWishlistItem as toggleWishlistItemWishlist } from '@/stores/wishlist/service/service';

// These functions delegate to the Zustand stores
```

## Benefits

1. **Reactive State**: Components automatically re-render when state changes
2. **Centralized State**: All state is managed in predictable stores
3. **Better Performance**: Only components that use specific state will re-render
4. **Easier Testing**: Stores can be easily mocked or tested in isolation
5. **Type Safety**: Full TypeScript support with proper typing
6. **Simplified Architecture**: No redundant service files - everything is in stores
7. **Better Organization**: Database queries are separated from store logic
8. **Modular Structure**: Each store is organized in its own directory with separate files for different purposes
9. **Scalability**: Data is broken down into focused stores for better maintainability

## Migration Status

✅ **Complete** - All service functionality has been moved to Zustand stores:
- Removed `authService.ts` (functionality moved to `stores/auth/`)
- Removed `dataService.ts` (functionality moved to `stores/data/`)
- Removed `statsService.ts` (functionality moved to `stores/data/utils/`)
- Removed `services/queries/` directory (query functions moved to `stores/*/queries/`)
- Removed `services/cache.ts` (not needed in online-only mode)

The only remaining service file is `services/supabase.ts` which contains:
- Supabase client initialization
- `uploadImage` utility function

This is the correct architecture as the Supabase client needs to be initialized once and shared across the application.

## Directory Structure

```
stores/
  ├── auth/
  │   ├── index.ts            # Re-exports all auth modules
  │   ├── types/
  │   │   └── types.ts        # Type definitions for auth store
  │   ├── store/
  │   │   └── store.ts        # Zustand store implementation
  │   ├── service/
  │   │   └── service.ts      # Functional service functions for backward compatibility
  │   └── utils/
  │       └── utils.ts        # Utility functions (if any)
  ├── data/
  │   ├── index.ts            # Re-exports all data modules
  │   ├── types/
  │   │   └── types.ts        # Type definitions for data store
  │   ├── store/
  │   │   └── store.ts        # Zustand store implementation
  │   ├── service/
  │   │   └── service.ts      # Functional service functions for backward compatibility
  │   ├── queries/
  │   │   └── queries.ts      # Database query functions
  │   └── utils/
  │       └── utils.ts        # Utility functions (calculateUserStats)
  ├── achievement/
  │   ├── index.ts            # Re-exports all achievement modules
  │   ├── types/
  │   │   └── types.ts        # Type definitions for achievement store
  │   ├── store/
  │   │   └── store.ts        # Zustand store implementation
  │   ├── service/
  │   │   └── service.ts      # Functional service functions for backward compatibility
  │   ├── queries/
  │   │   └── queries.ts      # Database query functions
  │   └── utils/
  │       └── utils.ts        # Utility functions (if any)
  ├── catalog/
  │   ├── index.ts            # Re-exports all catalog modules
  │   ├── types/
  │   │   └── types.ts        # Type definitions for catalog store
  │   ├── store/
  │   │   └── store.ts        # Zustand store implementation
  │   ├── service/
  │   │   └── service.ts      # Functional service functions for backward compatibility
  │   ├── queries/
  │   │   └── queries.ts      # Database query functions
  │   └── utils/
  │       └── utils.ts        # Utility functions (if any)
  ├── user/
  │   ├── index.ts            # Re-exports all user modules
  │   ├── types/
  │   │   └── types.ts        # Type definitions for user store
  │   ├── store/
  │   │   └── store.ts        # Zustand store implementation
  │   ├── service/
  │   │   └── service.ts      # Functional service functions for backward compatibility
  │   ├── queries/
  │   │   └── queries.ts      # Database query functions
  │   └── utils/
  │       └── utils.ts        # Utility functions (calculateUserStats)
  ├── diveSites/
  │   ├── index.ts            # Re-exports all dive sites modules
  │   ├── types/
  │   │   └── types.ts        # Type definitions for dive sites store
  │   ├── store/
  │   │   └── store.ts        # Zustand store implementation
  │   ├── service/
  │   │   └── service.ts      # Functional service functions for backward compatibility
  │   ├── queries/
  │   │   └── queries.ts      # Database query functions
  │   └── utils/
  │       └── utils.ts        # Utility functions (if any)
  ├── sightings/
  │   ├── index.ts            # Re-exports all sightings modules
  │   ├── types/
  │   │   └── types.ts        # Type definitions for sightings store
  │   ├── store/
  │   │   └── store.ts        # Zustand store implementation
  │   ├── service/
  │   │   └── service.ts      # Functional service functions for backward compatibility
  │   ├── queries/
  │   │   └── queries.ts      # Database query functions
  │   └── utils/
  │       └── utils.ts        # Utility functions (if any)
  └── wishlist/
      ├── index.ts            # Re-exports all wishlist modules
      ├── types/
      │   └── types.ts        # Type definitions for wishlist store
      ├── store/
      │   └── store.ts        # Zustand store implementation
      ├── service/
      │   └── service.ts      # Functional service functions for backward compatibility
      ├── queries/
      │   └── queries.ts      # Database query functions
      └── utils/
          └── utils.ts        # Utility functions (if any)

services/
  └── supabase.ts             # Supabase client initialization and utility functions (uploadImage)
```

Note: We've eliminated all redundant service files and organized all functionality into a modular store structure with separate directories for different purposes. The data store has been further broken down into specialized stores for catalog, user, dive sites, sightings, and wishlist data.