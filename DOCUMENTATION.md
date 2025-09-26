# SeaVault Application Documentation

This document provides a comprehensive overview of the SeaVault application structure, file purposes, and navigation hierarchy.

## Project Structure Overview

```
official-seavault/
├── app/                 # Expo Router file-based routing
├── screens/             # Screen components implementations
├── components/          # Reusable UI components
├── constants/           # Application constants
├── stores/              # State management (Zustand stores)
├── services/            # Business logic and API services
├── styles/              # Global styles
├── supabase/            # Supabase configuration and migrations
├── types/               # TypeScript types
├── utils/               # Utility functions
└── assets/              # Static assets (images, etc.)
```

## Routing Architecture

The application uses Expo Router with a file-based routing system. The [app](file:///d:/Work/official-seavault/app) directory defines the navigation structure, while the actual screen implementations are in the [screens](file:///d:/Work/official-seavault/screens) directory.

### Main Layout Files

- [`app/_layout.tsx`](file:///d:/Work/official-seavault/app/_layout.tsx) - Root layout with authentication guard
- [`app/(tabs)/_layout.tsx`](file:///d:/Work/official-seavault/app/(tabs)/_layout.tsx) - Tab navigation layout

### Authentication Flow

```
app/(auth)/
├── _layout.tsx          # Authentication layout
└── login.tsx            # Login screen route
```

Files:
- [`app/(auth)/_layout.tsx`](file:///d:/Work/official-seavault/app/(auth)/_layout.tsx) - Authentication layout component
- [`app/(auth)/login.tsx`](file:///d:/Work/official-seavault/app/(auth)/login.tsx) - Login screen route (imports from [`screens/auth/login/index.tsx`](file:///d:/Work/official-seavault/screens/auth/login/index.tsx))

### Main Tab Navigation

```
app/(tabs)/
├── _layout.tsx          # Tab navigation layout
├── index.tsx            # Home screen route
├── categories.tsx       # Categories screen route
├── log-dive.tsx         # Log Dive screen route
└── profile.tsx          # Profile screen route
```

Files:
- [`app/(tabs)/_layout.tsx`](file:///d:/Work/official-seavault/app/(tabs)/_layout.tsx) - Tab navigation layout with bottom tab bar
- [`app/(tabs)/index.tsx`](file:///d:/Work/official-seavault/app/(tabs)/index.tsx) - Home screen route (imports from [`screens/tabs/HomeScreen.tsx`](file:///d:/Work/official-seavault/screens/tabs/HomeScreen.tsx))
- [`app/(tabs)/categories.tsx`](file:///d:/Work/official-seavault/app/(tabs)/categories.tsx) - Categories screen route (imports from [`screens/tabs/CategoriesScreen.tsx`](file:///d:/Work/official-seavault/screens/tabs/categories/index.tsx))
- [`app/(tabs)/log-dive.tsx`](file:///d:/Work/official-seavault/app/(tabs)/log-dive.tsx) - Log Dive screen route (imports from [`screens/tabs/LogDiveScreen.tsx`](file:///d:/Work/official-seavault/screens/tabs/LogDiveScreen.tsx))
- [`app/(tabs)/profile.tsx`](file:///d:/Work/official-seavault/app/(tabs)/profile.tsx) - Profile screen route (imports from [`screens/tabs/ProfileScreen.tsx`](file:///d:/Work/official-seavault/screens/tabs/ProfileScreen.tsx))

### Profile Management

```
app/profile/
├── edit.tsx             # Edit profile screen route
└── change-password.tsx  # Change password screen route
```

Files:
- [`app/profile/edit.tsx`](file:///d:/Work/official-seavault/app/profile/edit.tsx) - Edit profile screen route (imports from [`screens/profile/edit/index.tsx`](file:///d:/Work/official-seavault/screens/profile/edit/index.tsx))
- [`app/profile/change-password.tsx`](file:///d:/Work/official-seavault/app/profile/change-password.tsx) - Change password screen route (imports from [`screens/profile/change-password/index.tsx`](file:///d:/Work/official-seavault/screens/profile/change-password/index.tsx))

### Statistics Screens

```
app/stats/
├── discovered.tsx       # Discovered creatures screen route
├── points.tsx           # Points screen route
└── wishlist.tsx         # Wishlist screen route
```

Files:
- [`app/stats/discovered.tsx`](file:///d:/Work/official-seavault/app/stats/discovered.tsx) - Discovered creatures screen route (imports from [`screens/stats/discovered/index.tsx`](file:///d:/Work/official-seavault/screens/stats/discovered/index.tsx))
- [`app/stats/points.tsx`](file:///d:/Work/official-seavault/app/stats/points.tsx) - Points screen route (imports from [`screens/stats/points/index.tsx`](file:///d:/Work/official-seavault/screens/stats/points/index.tsx))
- [`app/stats/wishlist.tsx`](file:///d:/Work/official-seavault/app/stats/wishlist.tsx) - Wishlist screen route (imports from [`screens/stats/wishlist/index.tsx`](file:///d:/Work/official-seavault/screens/stats/wishlist/index.tsx))

### Category Details

```
app/categories/[id]/
└── index.tsx            # Category detail screen route
```

Files:
- [`app/categories/[id]/index.tsx`](file:///d:/Work/official-seavault/app/categories/[id]/index.tsx) - Category detail screen route (imports from [`screens/categories/[id]/index.tsx`](file:///d:/Work/official-seavault/screens/categories/[id]/index.tsx))

### Creature Details

```
app/creatures/[id].tsx   # Creature detail screen route
```

Files:
- [`app/creatures/[id].tsx`](file:///d:/Work/official-seavault/app/creatures/[id].tsx) - Creature detail screen route (imports from [`screens/creatures/[id]/index.tsx`](file:///d:/Work/official-seavault/screens/creatures/[id]/index.tsx))

### Modals

```
app/modal/
├── explore.tsx          # Explore modal route
├── leaderboard.tsx      # Leaderboard modal route
└── creature-picker.tsx  # Creature picker modal route
```

Files:
- [`app/modal/explore.tsx`](file:///d:/Work/official-seavault/app/modal/explore.tsx) - Explore modal route (imports from [`screens/modal/explore/index.tsx`](file:///d:/Work/official-seavault/screens/modal/explore/index.tsx))
- [`app/modal/leaderboard.tsx`](file:///d:/Work/official-seavault/app/modal/leaderboard.tsx) - Leaderboard modal route (imports from [`screens/modal/leaderboard/index.tsx`](file:///d:/Work/official-seavault/screens/modal/leaderboard/index.tsx))
- [`app/modal/creature-picker.tsx`](file:///d:/Work/official-seavault/app/modal/creature-picker.tsx) - Creature picker modal route (imports from [`screens/modal/creature-picker/index.tsx`](file:///d:/Work/official-seavault/screens/modal/creature-picker/index.tsx))

### Dive Sites

```
app/dive-sites/
└── add.tsx              # Add dive site screen route
```

Files:
- [`app/dive-sites/add.tsx`](file:///d:/Work/official-seavault/app/dive-sites/add.tsx) - Add dive site screen route (imports from [`screens/dive-sites/AddDiveSiteScreen.tsx`](file:///d:/Work/official-seavault/screens/dive-sites/AddDiveSiteScreen.tsx))

## Screen Implementations

All actual screen implementations are located in the [screens](file:///d:/Work/official-seavault/screens) directory, organized by feature:

### Authentication Screens
- [`screens/auth/login/index.tsx`](file:///d:/Work/official-seavault/screens/auth/login/index.tsx) - Login screen implementation
- [`screens/auth/reset-password/index.tsx`](file:///d:/Work/official-seavault/screens/auth/reset-password/index.tsx) - Reset password screen implementation

### Tab Screens
- [`screens/tabs/HomeScreen.tsx`](file:///d:/Work/official-seavault/screens/tabs/HomeScreen.tsx) - Home/dashboard screen with stats and leaderboard
- [`screens/tabs/CategoriesScreen.tsx`](file:///d:/Work/official-seavault/screens/tabs/categories/index.tsx) - Categories browsing screen
- [`screens/tabs/LogDiveScreen.tsx`](file:///d:/Work/official-seavault/screens/tabs/LogDiveScreen.tsx) - Dive logging screen with map integration
- [`screens/tabs/ProfileScreen.tsx`](file:///d:/Work/official-seavault/screens/tabs/ProfileScreen.tsx) - User profile screen

### Profile Screens
- [`screens/profile/edit/index.tsx`](file:///d:/Work/official-seavault/screens/profile/edit/index.tsx) - Profile editing screen
- [`screens/profile/change-password/index.tsx`](file:///d:/Work/official-seavault/screens/profile/change-password/index.tsx) - Password change screen

### Statistics Screens
- [`screens/stats/discovered/index.tsx`](file:///d:/Work/official-seavault/screens/stats/discovered/index.tsx) - Discovered creatures list
- [`screens/stats/points/index.tsx`](file:///d:/Work/official-seavault/screens/stats/points/index.tsx) - Points history and statistics
- [`screens/stats/wishlist/index.tsx`](file:///d:/Work/official-seavault/screens/stats/wishlist/index.tsx) - Wishlist management

### Category Detail Screens
- [`screens/categories/[id]/index.tsx`](file:///d:/Work/official-seavault/screens/categories/[id]/index.tsx) - Category detail view with creatures in that category

### Creature Detail Screens
- [`screens/creatures/[id]/index.tsx`](file:///d:/Work/official-seavault/screens/creatures/[id]/index.tsx) - Creature detail view with sightings history

### Modal Screens
- [`screens/modal/explore/index.tsx`](file:///d:/Work/official-seavault/screens/modal/explore/index.tsx) - Explore modal
- [`screens/modal/leaderboard/index.tsx`](file:///d:/Work/official-seavault/screens/modal/leaderboard/index.tsx) - Leaderboard modal
- [`screens/modal/creature-picker/index.tsx`](file:///d:/Work/official-seavault/screens/modal/creature-picker/index.tsx) - Creature selection modal

### Dive Site Screens
- [`screens/dive-sites/AddDiveSiteScreen.tsx`](file:///d:/Work/official-seavault/screens/dive-sites/AddDiveSiteScreen.tsx) - Add new dive site screen
- [`screens/dive-sites/DiveSitesScreen.tsx`](file:///d:/Work/official-seavault/screens/dive-sites/DiveSitesScreen.tsx) - Dive sites management screen

## Constants and Configuration

- [`constants/app.ts`](file:///d:/Work/official-seavault/constants/app.ts) - Application-level constants and configuration
- [`constants/routes.ts`](file:///d:/Work/official-seavault/constants/routes.ts) - Route constants and navigation configuration
- [`constants/colors.ts`](file:///d:/Work/official-seavault/constants/colors.ts) - Color palette definitions
- [`constants/dimensions.ts`](file:///d:/Work/official-seavault/constants/dimensions.ts) - Dimension and spacing constants
- [`constants/api.ts`](file:///d:/Work/official-seavault/constants/api.ts) - API-related constants
- [`constants/storage.ts`](file:///d:/Work/official-seavault/constants/storage.ts) - Storage-related constants

## State Management

The application uses Zustand for state management, organized into specialized stores:

- [`stores/auth/`](file:///d:/Work/official-seavault/stores/auth) - Authentication state
- [`stores/catalog/`](file:///d:/Work/official-seavault/stores/catalog) - Creature and category data
- [`stores/user/`](file:///d:/Work/official-seavault/stores/user) - User profile and personal data
- [`stores/diveSites/`](file:///d:/Work/official-seavault/stores/diveSites) - Dive sites data
- [`stores/sightings/`](file:///d:/Work/official-seavault/stores/sightings) - Creature sightings
- [`stores/wishlist/`](file:///d:/Work/official-seavault/stores/wishlist) - User wishlist
- [`stores/achievement/`](file:///d:/Work/official-seavault/stores/achievement) - Achievement tracking

## Services

- [`services/supabase.ts`](file:///d:/Work/official-seavault/services/supabase.ts) - Supabase client configuration
- [`services/statsService.ts`](file:///d:/Work/official-seavault/services/statsService.ts) - Statistics calculation functions

## Utilities

The [utils](file:///d:/Work/official-seavault/utils) directory contains various helper functions:

- [`utils/alertUtils.ts`](file:///d:/Work/official-seavault/utils/alertUtils.ts) - Alert and notification utilities
- [`utils/device.ts`](file:///d:/Work/official-seavault/utils/device.ts) - Device-specific utilities
- [`utils/format.ts`](file:///d:/Work/official-seavault/utils/format.ts) - Data formatting utilities
- [`utils/helpers.ts`](file:///d:/Work/official-seavault/utils/helpers.ts) - General helper functions
- [`utils/supabaseUtils.ts`](file:///d:/Work/official-seavault/utils/supabaseUtils.ts) - Supabase-specific utilities

## Components

Reusable UI components are organized in the [components](file:///d:/Work/official-seavault/components) directory:

- [`components/ui/`](file:///d:/Work/official-seavault/components/ui) - Core UI components
- [`components/forms/`](file:///d:/Work/official-seavault/components/forms) - Form-related components
- [`components/navigation/`](file:///d:/Work/official-seavault/components/navigation) - Navigation components
- [`components/data-display/`](file:///d:/Work/official-seavault/components/data-display) - Data display components
- [`components/feedback/`](file:///d:/Work/official-seavault/components/feedback) - Feedback and loading components

## Styles

- [`styles/globalStyles.ts`](file:///d:/Work/official-seavault/styles/globalStyles.ts) - Global style definitions
- [`styles/componentStyles.ts`](file:///d:/Work/official-seavault/styles/componentStyles.ts) - Component-specific styles

## Supabase Configuration

- [`supabase/migrations/`](file:///d:/Work/official-seavault/supabase/migrations) - Database migration scripts
- [`supabase/SETUP_GUIDE.md`](file:///d:/Work/official-seavault/supabase/SETUP_GUIDE.md) - Database setup instructions
- [`supabase/complete_database_setup_dev.sql`](file:///d:/Work/official-seavault/supabase/complete_database_setup_dev.sql) - Complete development database setup script

## Navigation Flow

1. **Authentication Flow**: Unauthenticated users are directed to `/login`
2. **Main App**: Authenticated users access the tab-based navigation:
   - Home (`/`) - Dashboard with stats and leaderboard
   - Categories (`/categories`) - Browse creature categories
   - Log Dive (`/log-dive`) - Record new creature sightings
   - Profile (`/profile`) - User profile and settings
3. **Detail Screens**: Accessible from main tabs:
   - Category details (`/categories/[id]`)
   - Creature details (`/creatures/[id]`)
4. **User Management**:
   - Edit profile (`/profile/edit`)
   - Change password (`/profile/change-password`)
5. **Statistics**:
   - Discovered creatures (`/stats/discovered`)
   - Points history (`/stats/points`)
   - Wishlist (`/stats/wishlist`)
6. **Modals**:
   - Leaderboard (`/modal/leaderboard`)
   - Explore (`/modal/explore`)
   - Creature picker (`/modal/creature-picker`)
7. **Dive Sites**:
   - Add new dive site (`/dive-sites/add`) - Accessible from the Log Dive screen

## Development Guidelines

1. **Routing**: Add new routes by creating files in the [app](file:///d:/Work/official-seavault/app) directory following the file-based routing convention
2. **Screen Implementation**: Implement screen logic in the [screens](file:///d:/Work/official-seavault/screens) directory
3. **State Management**: Use the appropriate store in the [stores](file:///d:/Work/official-seavault/stores) directory for data management
4. **UI Components**: Reuse or extend components from the [components](file:///d:/Work/official-seavault/components) directory
5. **Constants**: Add new constants to the appropriate file in the [constants](file:///d:/Work/official-seavault/constants) directory
6. **Utilities**: Place helper functions in the [utils](file:///d:/Work/official-seavault/utils) directory