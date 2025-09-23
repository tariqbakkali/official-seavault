# Data Store Breakdown Summary

This document summarizes the breakdown of the monolithic data store into specialized stores for better organization and maintainability.

## Overview

The original monolithic `data` store has been broken down into five specialized stores:

1. **Catalog Store** - Handles categories, creatures, and achievements data
2. **User Store** - Manages user profiles, sightings, and wishlists
3. **Dive Sites Store** - Manages dive site information
4. **Sightings Store** - Handles creature sighting operations
5. **Wishlist Store** - Manages user wishlist functionality

## Directory Structure

Each store now follows a consistent directory structure:

```
stores/
├── catalog/
│   ├── index.ts            # Re-exports store modules
│   ├── types/
│   │   └── types.ts        # Type definitions for catalog data
│   ├── store/
│   │   └── store.ts        # Zustand store implementation
│   ├── service/
│   │   └── service.ts      # Service functions for backward compatibility
│   ├── queries/
│   │   └── queries.ts      # Database query functions
│   └── utils/
│       └── utils.ts        # Utility functions (if any)
├── user/
│   ├── index.ts            # Re-exports store modules
│   ├── types/
│   │   └── types.ts        # Type definitions for user data
│   ├── store/
│   │   └── store.ts        # Zustand store implementation
│   ├── service/
│   │   └── service.ts      # Service functions for backward compatibility
│   ├── queries/
│   │   └── queries.ts      # Database query functions
│   └── utils/
│       └── utils.ts        # Utility functions (calculateUserStats)
├── diveSites/
│   ├── index.ts            # Re-exports store modules
│   ├── types/
│   │   └── types.ts        # Type definitions for dive sites data
│   ├── store/
│   │   └── store.ts        # Zustand store implementation
│   ├── service/
│   │   └── service.ts      # Service functions for backward compatibility
│   ├── queries/
│   │   └── queries.ts      # Database query functions
│   └── utils/
│       └── utils.ts        # Utility functions (if any)
├── sightings/
│   ├── index.ts            # Re-exports store modules
│   ├── types/
│   │   └── types.ts        # Type definitions for sightings data
│   ├── store/
│   │   └── store.ts        # Zustand store implementation
│   ├── service/
│   │   └── service.ts      # Service functions for backward compatibility
│   ├── queries/
│   │   └── queries.ts      # Database query functions
│   └── utils/
│       └── utils.ts        # Utility functions (if any)
└── wishlist/
    ├── index.ts            # Re-exports store modules
    ├── types/
    │   └── types.ts        # Type definitions for wishlist data
    ├── store/
    │   └── store.ts        # Zustand store implementation
    ├── service/
    │   └── service.ts      # Service functions for backward compatibility
    ├── queries/
    │   └── queries.ts      # Database query functions
    └── utils/
        └── utils.ts        # Utility functions (if any)
```

## Benefits of This Approach

1. **Better Organization**: Each store is focused on a specific domain of data
2. **Improved Maintainability**: Changes to one data type don't affect others
3. **Easier Testing**: Each store can be tested independently
4. **Clear Separation of Concerns**: Types, store logic, services, and queries are separated
5. **Scalability**: New data types can be added following the same pattern
6. **Type Safety**: Each store has its own specific type definitions
7. **Backward Compatibility**: Service functions maintain the same interface

## Migration Status

✅ **Complete** - All data functionality has been moved to specialized stores:
- Catalog data (categories, creatures, achievements) → `stores/catalog/`
- User data (profiles, sightings, wishlists) → `stores/user/`
- Dive sites data → `stores/diveSites/`
- Sightings operations → `stores/sightings/`
- Wishlist operations → `stores/wishlist/`

## Usage

### Using the Stores Directly (Recommended)
```typescript
import { useCatalogStore } from '@/stores/catalog';
import { useUserStore } from '@/stores/user';
import { useDiveSitesStore } from '@/stores/diveSites';
import { useSightingsStore } from '@/stores/sightings';
import { useWishlistStore } from '@/stores/wishlist';

// In a component
const MyComponent = () => {
  const { catalog, fetchCatalog } = useCatalogStore();
  const { userData, fetchUserData } = useUserStore();
  const { diveSites, fetchDiveSites } = useDiveSitesStore();
  const { createSighting } = useSightingsStore();
  const { toggleWishlistItem } = useWishlistStore();
  
  // Use the state and functions directly
};
```

### Using the Functional Services (Backward Compatibility)
```typescript
import { fetchCatalog } from '@/stores/catalog/service/service';
import { fetchUserData } from '@/stores/user/service/service';
import { fetchDiveSites } from '@/stores/diveSites/service/service';
import { createSighting } from '@/stores/sightings/service/service';
import { toggleWishlistItem } from '@/stores/wishlist/service/service';

// These functions delegate to the Zustand stores
```

## Next Steps

1. Update all remaining components to use the new specialized stores
2. Fix remaining TypeScript errors in components
3. Remove the old monolithic data store once all components are migrated
4. Update documentation to reflect the new architecture