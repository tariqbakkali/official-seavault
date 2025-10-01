# Local-First Migration Guide

This guide explains how to gradually migrate from the existing Zustand stores to the new Legend-State observables for a local-first implementation.

## Overview

The migration process involves:

1. Integrating the local-first implementation with the existing authentication system
2. Gradually replacing Zustand stores with Legend-State observables
3. Updating UI components to use the new hooks
4. Testing the migration thoroughly

## 1. Auth System Integration

The auth system has already been integrated with the local-first implementation:

- `setCurrentUserID()` is called when users log in/out
- `initializeUserSession()` and `cleanupUserSession()` are integrated with the auth service
- User-specific observables are properly initialized when a user logs in

### Key Integration Points

1. **Login/Signup**: When a user logs in or signs up, the user ID is set and the user session is initialized
2. **Logout**: When a user logs out, the user session is cleaned up and the user ID is cleared
3. **Auth State Changes**: The auth listener handles real-time auth state changes

## 2. Gradually Replacing Zustand Stores

### Step 1: Identify Modules to Migrate

Start with one module to test the transition:

1. **Dive Sites** - Read-only catalog data
2. **Creatures** - Read-only catalog data
3. **Categories** - Read-only catalog data
4. **Sightings** - User-specific data
5. **Wishlists** - User-specific data
6. **Profiles** - User-specific data

### Step 2: Create Synced Observables

Synced observables have already been created for all entities in `stores/syncedObservables.ts`:

- Read-only catalog data (categories, creatures, dive sites)
- User-specific data (sightings, wishlists, profiles)

### Step 3: Create React Hooks

React hooks have been created in `hooks/useSyncedData.ts`:

- Individual hooks for each data entity
- Combined hook that provides all data and mutation functions

### Step 4: Update UI Components

Replace existing components that use Zustand stores with components that use the new hooks.

Example replacement pattern:

**Before (using Zustand):**
```typescript
import { useDiveSitesStore } from '@/stores/diveSites/store/store';

const DiveSitesScreen = () => {
  const { diveSites, fetchDiveSites } = useDiveSitesStore();
  
  useEffect(() => {
    fetchDiveSites();
  }, []);
  
  // Render dive sites
};
```

**After (using Legend-State):**
```typescript
import { useDiveSites } from '@/hooks/useSyncedData';

const DiveSitesScreen = () => {
  const diveSites = useDiveSites();
  
  // Data is automatically loaded and synced
  // No need to manually fetch
  
  // Render dive sites
};
```

## 3. Example Migration: Dive Sites Module

### Current Implementation

The dive sites module currently uses Zustand:

- Store: `stores/diveSites/store/store.ts`
- Queries: `stores/diveSites/queries/queries.ts`
- Types: `stores/diveSites/types/types.ts`

### New Implementation

The dive sites module now uses Legend-State observables:

- Observable: `stores/syncedObservables.ts` (diveSites$)
- Hook: `hooks/useSyncedData.ts` (useDiveSites)
- Component: `screens/dive-sites/DiveSitesWithSync.tsx`

### Migration Steps

1. **Create the synced observable** (already done)
2. **Create the React hook** (already done)
3. **Create a new component using the hook** (example created)
4. **Replace the old component with the new one**

## 4. Profile Updates

Profile update functions were temporarily removed but have now been implemented:

- `updateProfile()` - Updates multiple profile fields
- `updateProfileField()` - Updates a single profile field

These functions properly handle the Legend-State observable pattern.

## 5. Testing Strategy

### Offline Testing

1. Test the app in offline mode to ensure data persists correctly
2. Verify that operations queue properly and sync when connectivity is restored
3. Test edge cases like app restarts while offline

### Conflict Resolution Testing

1. Test scenarios where the same data is modified on multiple devices
2. Verify that the conflict resolution works as expected
3. Check that the UI handles conflicts gracefully

### Performance Testing

1. Test with large datasets to ensure performance
2. Monitor memory usage with large datasets
3. Verify that pagination works correctly for large datasets

## 6. Performance Optimization

### Data Loading

1. Implement pagination for large datasets
2. Add proper filtering to reduce data transfer
3. Consider implementing data compression for large payloads

### Memory Management

1. Monitor memory usage with large datasets
2. Implement data cleanup strategies for old/unneeded data
3. Optimize observable usage to prevent memory leaks

## 7. Additional Features

### Implement Additional Data Entities

1. Add synced observables for any missing data entities
2. Ensure all user data is properly synced
3. Add utility functions for common operations on new entities

### Enhanced Error Handling

1. Implement more sophisticated error handling for sync operations
2. Add user-facing error messages for sync failures
3. Create retry mechanisms for specific error types

## 8. Documentation and Examples

### More Detailed Examples

1. Create more detailed examples of using the synced observables
2. Document common patterns and best practices
3. Add troubleshooting guides for common issues

## 9. Next Steps

1. **Replace one module completely** - Start with dive sites or creatures
2. **Test the migration thoroughly** - Ensure all functionality works as expected
3. **Monitor performance** - Check for any performance regressions
4. **Gradually migrate other modules** - One at a time to minimize risk
5. **Update documentation** - Keep documentation up to date with changes
6. **Remove old Zustand stores** - Once all modules are migrated

## 10. Troubleshooting

### Common Issues

1. **TypeScript errors** - Ensure proper typing of observables and their values
2. **Sync conflicts** - Handle conflicts gracefully in the UI
3. **Performance issues** - Implement pagination and filtering for large datasets
4. **Memory leaks** - Properly clean up observables when components unmount

### Debugging Tips

1. Use the Legend-State devtools if available
2. Log sync operations to understand when data is being fetched/synced
3. Monitor network requests to ensure efficient data transfer
4. Check AsyncStorage to verify data is being persisted correctly

## Conclusion

The local-first implementation provides a robust foundation for offline-first functionality with automatic synchronization when online. By following this migration guide, you can gradually replace the existing Zustand stores with Legend-State observables while maintaining functionality and improving the user experience.