# Local-First Implementation with Legend-State and Supabase

This document explains how to use the local-first implementation in this project, which uses Legend-State for state management and Supabase for backend synchronization.

## Overview

The local-first implementation provides:

1. **Offline Persistence**: Data is stored locally using AsyncStorage
2. **Real-time Synchronization**: Changes sync with Supabase when online
3. **Automatic Retry**: Failed operations retry when connectivity is restored
4. **Optimistic Updates**: UI updates immediately with rollback on failure

## Core Components

### 1. Legend-State Configuration (`services/legendStateConfig.ts`)

This file configures Legend-State with Supabase integration:

- Sets up AsyncStorage for persistence
- Configures retry mechanisms for failed operations
- Enables changesSince optimization for efficient sync
- Sets up ID generation using the uuid library for offline operations

### 2. Synced Observables (`stores/syncedObservables.ts`)

This file contains observables for all data entities:

- **Catalog Data**: Categories, creatures, dive sites (read-only)
- **User Data**: Sightings, wishlists, profile (user-specific)
- **Utility Functions**: Functions to create/update data
- **UUID Generation**: Uses the uuid library for generating unique IDs

### 3. Sync Utilities (`utils/syncUtils.ts`)

Provides helper functions for managing synchronization:

- Initialize sync for catalog and user data
- Handle user login/logout
- Force data refresh
- Check sync status

### 4. React Hooks (`hooks/useSyncedData.ts`)

React hooks for using synced data in components:

- `useCategories`, `useCreatures`, etc. for individual data
- `useSyncedData` for all data and mutation functions

### 5. Application Initializer (`utils/appInitializer.ts`)

Handles application-level initialization:

- App startup configuration
- User session management
- App state change handling

## Usage Examples

### Initializing the Application

```typescript
import { initializeApp } from '@/utils/appInitializer';

// Initialize the local-first app when the app starts
useEffect(() => {
  initializeApp();
}, []);
```

### Handling User Authentication

```typescript
import { initializeUserSession, cleanupUserSession } from '@/utils/appInitializer';
import { setCurrentUserID } from '@/stores/syncedObservables';

// When user logs in
const handleLogin = async (userId: string) => {
  await initializeUserSession(userId);
};

// When user logs out
const handleLogout = async () => {
  await cleanupUserSession();
};
```

### Using Data in Components

```typescript
import { useSyncedData } from '@/hooks/useSyncedData';

export default function MyComponent() {
  const { creatures, sightings, createSighting } = useSyncedData();
  
  const handleAddSighting = () => {
    createSighting({
      creature_id: 'some-creature-id',
      date: new Date().toISOString(),
      dive_notes: 'Saw a beautiful fish!',
      image_url: null,
      dive_site_id: null,
      dive_type: null,
      time_of_day: null,
      depth: null,
      creature_notes: null,
    });
  };
  
  return (
    <View>
      {creatures && Object.values(creatures).map(creature => (
        <Text key={creature.id}>{creature.name}</Text>
      ))}
    </View>
  );
}
```

## Key Features

### Offline Support

All data is persisted locally using AsyncStorage. When offline:

- Users can view existing data
- Users can create new records (stored locally)
- Changes queue automatically and sync when online

### Real-time Updates

When online, data syncs automatically with Supabase:

- Changes from other devices appear in real-time
- Conflicts are handled automatically
- UI updates immediately with server confirmation

### Retry Mechanism

Failed operations automatically retry:

- Network failures queue operations
- Server errors retry with exponential backoff
- Operations persist between app restarts

### UUID Generation

For offline operations, unique IDs are generated using the uuid library:

- Uses uuidv4() for generating RFC4122 version 4 UUIDs
- Ensures uniqueness across all devices and sessions
- Compatible with Supabase's UUID requirements

## Data Structure

### Catalog Data (Read-only)

- **Categories**: Marine life categories
- **Creatures**: Individual marine species
- **Dive Sites**: Locations for diving

### User Data (User-specific)

- **Sightings**: Records of marine life observed
- **Wishlists**: Desired marine life to observe
- **Profile**: User profile information

## Testing Offline Functionality

To test offline functionality:

1. Enable Airplane Mode on device/simulator
2. Use the app normally (data should persist)
3. Disable Airplane Mode
4. Observe automatic sync of queued operations

## Error Handling

The implementation includes graceful error handling:

- Network errors queue operations for retry
- Server errors trigger automatic retries
- UI shows appropriate loading/error states

## Performance Considerations

- Data is loaded from local storage first for instant startup
- Only changes sync, not entire datasets
- Pagination supported for large datasets
- Memory efficient observable patterns

## Extending the Implementation

To add new data entities:

1. Add the entity to `stores/syncedObservables.ts`
2. Create a synced observable with appropriate configuration
3. Add utility functions for common operations
4. Export hooks in `hooks/useSyncedData.ts`

## Troubleshooting

### Data Not Syncing

1. Check network connectivity
2. Verify Supabase credentials
3. Check console for sync errors
4. Force refresh with `forceSyncAll()`

### Offline Data Persistence

1. Verify AsyncStorage is working
2. Check for storage quota issues
3. Confirm retry mechanism is enabled

### Performance Issues

1. Enable `changesSince` optimization
2. Use pagination for large datasets
3. Implement proper filtering