# Execution Plan: Offline-First Sync Layer Implementation

## 1. Current State Analysis

### 1.1 Data Storage & Management
The current implementation uses a hybrid approach:
- **Remote Storage**: Supabase PostgreSQL database for all data
- **Local Caching**: AsyncStorage and FileSystem for offline data persistence
- **Data Models**: Creatures, Categories, Profiles, Sightings, Wishlists, Achievements, Dive Sites

### 1.2 Current Sync Implementation
The [SyncService](file:///D:/Work/official-seavault/services/syncService.ts#L39-L628) class handles all synchronization logic:
- **Pull Operations**: Fetches data from Supabase and caches it locally
- **Push Operations**: Processes queued operations when online
- **Connectivity Management**: Uses expo-network to check connectivity status
- **Queue System**: FileSystem-based operation queue for offline writes

### 1.3 Identified Pain Points
1. **Duplicated Sync Logic**: Manual push/pull loops in multiple components
2. **Limited Conflict Resolution**: No explicit conflict resolution strategy
3. **Complexity**: Sync logic scattered across multiple services
4. **Offline Writes**: Basic queuing system without robust conflict handling
5. **Performance**: No batch operations or intelligent sync scheduling

## 2. Target Architecture

### 2.1 High-Level Structure
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Local DB      │    │   SyncManager    │    │   Remote DB      │
│ (WatermelonDB)  │◄──►│  (Abstraction)   │◄──►│   (Supabase)     │
└─────────────────┘    └──────────────────┘    └──────────────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  mapToLocal()   │    │   Sync Engine    │    │  mapToRemote()   │
│  mapToRemote()  │    │  Conflict Res.   │    │  Conflict Res.   │
└─────────────────┘    └──────────────────┘    └──────────────────┘
```

### 2.2 Component Responsibilities
- **Local DB (WatermelonDB)**: 
  - Primary data source for all UI components
  - Offline data persistence with full querying capabilities
  - Automatic change tracking

- **SyncManager**:
  - Centralized sync coordination
  - Declarative sync configuration per model
  - Conflict resolution orchestration
  - Connectivity monitoring

- **Remote DB (Supabase)**:
  - Server-side data source
  - API endpoints for data operations
  - Server-side conflict resolution

### 2.3 Declarative Mapping Functions
Each model will have:
- `mapToRemote(localRecord)`: Converts local record to Supabase format
- `mapToLocal(remoteRecord)`: Converts Supabase record to local format
- `resolveConflicts(localRecord, remoteRecord)`: Conflict resolution strategy

## 3. Step-by-Step Migration Plan

### 3.1 Phase 1: Foundation Setup
**Tasks:**
1. Install WatermelonDB dependencies:
   - `@nozbe/watermelondb`
   - `@nozbe/with-observables`

2. Create WatermelonDB schema:
   - Define tables matching current Supabase schema
   - Add sync-specific fields ( `_status`, `_changed`)

3. Initialize database:
   - Create [database.ts](file:///D:/Work/official-seavault/types/database.ts) with WatermelonDB adapter
   - Set up platform-specific adapters (SQLite for native, LokiJS for web)

### 3.2 Phase 2: Data Migration Layer
**Tasks:**
1. Create migration utilities:
   - Transfer existing cached data to WatermelonDB
   - Handle schema versioning

2. Implement data access layer:
   - Replace direct cache access with WatermelonDB queries
   - Create repository pattern for each model

### 3.3 Phase 3: Sync Manager Implementation
**Files to Create:**
1. `services/syncManager.ts`: Core sync orchestration
2. `services/syncStrategies/*.ts`: Per-model sync strategies
3. `services/conflictResolution.ts`: Conflict resolution utilities

**Files to Refactor:**
1. `services/syncService.ts`: Simplify to use SyncManager
2. All screen components: Replace direct sync calls with database queries

### 3.4 Phase 4: Advanced Features
**Tasks:**
1. Implement background sync with expo-background-fetch
2. Add selective sync capabilities
3. Enhance conflict resolution strategies
4. Implement sync progress tracking

## 4. Conflict Resolution Strategy

### 4.1 Default Approach
- **Last-Write-Wins**: Using `updated_at` timestamps
- **Server Wins**: Remote changes take precedence in case of conflicts
- **Automatic Resolution**: No user intervention required for standard cases

### 4.2 Extensible Framework
- **Field-Level Merging**: Custom resolvers for specific fields
- **User-Driven Resolution**: UI for manual conflict resolution when needed
- **Custom Strategies**: Model-specific conflict resolution logic

### 4.3 Implementation Details
```javascript
// Default conflict resolution
const resolveConflicts = (localRecord, remoteRecord) => {
  // Last-write-wins based on updated_at
  if (new Date(localRecord.updated_at) > new Date(remoteRecord.updated_at)) {
    return localRecord;
  }
  return remoteRecord;
};
```

## 5. Lifecycle & Triggers

### 5.1 Sync Triggers
1. **App Launch**: Initial sync to ensure data freshness
2. **Connectivity Changes**: Automatic sync when device comes online
3. **Background Fetch**: Periodic sync using expo-background-fetch
4. **Manual Refresh**: User-initiated sync via pull-to-refresh
5. **Data Changes**: Immediate sync for critical user actions

### 5.2 Expo Integration
- **expo-network**: Monitor connectivity status
- **expo-background-fetch**: Schedule periodic background sync
- **expo-task-manager**: Handle long-running sync operations

## 6. Testing & Verification Plan

### 6.1 Offline/Online Transition Testing
1. **Offline Data Entry**: Verify local persistence of new records
2. **Online Sync**: Confirm successful push of offline changes
3. **Data Consistency**: Ensure UI reflects synced data accurately

### 6.2 Conflict Scenario Testing
1. **Simultaneous Edits**: Test last-write-wins behavior
2. **Offline Duration**: Verify sync after extended offline periods
3. **Network Interruptions**: Test partial sync recovery

### 6.3 Reliability Verification
1. **Performance Testing**: Measure sync speed and resource usage
2. **Error Handling**: Validate graceful handling of network errors
3. **Data Integrity**: Confirm no data loss during sync operations

## 7. Deliverables

### Priority 1 (Effort: 3) - Foundation Implementation
- **Task**: Install WatermelonDB and create basic schema
- **Developer**: Mobile Engineer with React Native experience
- **Dependencies**: None

### Priority 2 (Effort: 4) - Data Migration Layer
- **Task**: Implement data access layer and migrate existing cache logic
- **Developer**: Backend-focused Mobile Engineer
- **Dependencies**: Foundation Implementation

### Priority 3 (Effort: 5) - Sync Manager Core
- **Task**: Create SyncManager and refactor existing sync logic
- **Developer**: Senior Mobile Engineer with sync experience
- **Dependencies**: Data Migration Layer

### Priority 4 (Effort: 3) - Background Sync Integration
- **Task**: Implement expo-background-fetch integration
- **Developer**: Mobile Engineer with Expo experience
- **Dependencies**: Sync Manager Core

### Priority 5 (Effort: 4) - Advanced Conflict Resolution
- **Task**: Implement extensible conflict resolution framework
- **Developer**: Senior Backend Engineer
- **Dependencies**: Sync Manager Core

### Priority 6 (Effort: 2) - Testing & Verification
- **Task**: Create comprehensive test suite for sync functionality
- **Developer**: QA Engineer with mobile testing experience
- **Dependencies**: All previous tasks

This execution plan provides a clear roadmap for evolving the current sync implementation into a robust, offline-first architecture using WatermelonDB while maintaining compatibility with the existing Supabase backend.