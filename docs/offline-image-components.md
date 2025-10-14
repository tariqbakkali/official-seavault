# Offline Image Components

This document explains the offline image handling components and how they address the requirement of showing real images instead of fallback images when the internet is off.

## Overview

The Seavault application implements a robust offline-first image handling system that ensures users can view their images even when they don't have an internet connection. The system prioritizes local images and only attempts to download remote images when online.

## Components

### 1. OfflineImageHandler

The [OfflineImageHandler](file:///Users/applevalley/Work/official-seavault/components/OfflineImageHandler.tsx#L15-L165) component is the new component designed to handle offline image display according to the user's requirements:

- When offline, it attempts to load images anyway (relying on expo-image's caching)
- It prioritizes local images when provided
- It shows proper error states only when there's an actual loading error
- It doesn't show fallback images when offline

### 2. ImageWithFallback (Modified)

The [ImageWithFallback](file:///Users/applevalley/Work/official-seavault/components/ImageWithFallback.tsx#L15-L135) component has been modified to align with the offline image display requirements:

- When offline, it still attempts to load images (relying on expo-image's caching)
- It only shows fallback images when there's an actual loading error
- It preserves the offline indicator functionality

## Key Improvements

### 1. Local Image Prioritization

When a local URI is provided, the [OfflineImageHandler](file:///Users/applevalley/Work/official-seavault/components/OfflineImageHandler.tsx#L15-L165) uses it instead of remote URLs:

```typescript
// Get current URL to try
const currentUrl = React.useMemo(() => {
  // If offline and we have a local URI, use it
  if (!isOnline && localUri) {
    return localUri;
  }
  
  const urls = [urlOptions.original, urlOptions.encoded, urlOptions.proxied].filter(Boolean) as string[];
  return urls[currentUrlIndex] || urlOptions.original;
}, [urlOptions, currentUrlIndex, isOnline, localUri]);
```

### 2. No Fallback Images When Offline

The components now avoid showing fallback images when offline:

```typescript
// In ImageWithFallback component
if (!isOnline && showOfflineIndicator) {
  // According to user requirement: when internet is off, must show real images from local storage
  // instead of fallback images or placeholders. So we'll try to load the image anyway
  // and only show the offline indicator
  console.log('Device is offline, but still attempting to load image:', uri);
}
```

### 3. Proper Error Handling

Error states are only shown when there's an actual loading error, not just because the device is offline:

```typescript
onError={(e) => {
  console.warn('OfflineImageHandler: Image load error:', e, 'URL:', currentUrl);
  setLoading(false);
  // Only handle retry if we're online, otherwise just show error
  if (isOnline) {
    handleRetry();
  } else {
    setError(true);
  }
}}
```

## Usage

### Using OfflineImageHandler

```tsx
import OfflineImageHandler from '@/components/OfflineImageHandler';

<OfflineImageHandler
  uri={imageUrl}
  localUri={localImageUrl} // Optional local URI for offline use
  style={styles.image}
  containerStyle={styles.imageContainer}
  showOfflineIndicator={true}
/>
```

### Using Modified ImageWithFallback

```tsx
import { ImageWithFallback } from '@/components';

<ImageWithFallback
  uri={imageUrl}
  style={styles.image}
  containerStyle={styles.imageContainer}
  showOfflineIndicator={true}
/>
```

## Affected Screens

The following screens and components have been updated to use the new offline image handling:

1. **Categories Screen**
   - CategoryCard component
   - Category detail screen

2. **Creatures Screen**
   - CreatureSelectionModal component
   - CreatureSelector component
   - Creature detail screen
   - Creature picker modal
   - ExploreCreatureCard component
   - LeaderboardEntry component
   - AvatarSection component

## Testing Offline Scenarios

To test offline image handling:

1. Enable airplane mode on the device
2. Navigate to the categories or creatures screens
3. Verify that images are still displayed (from cache)
4. Confirm that no fallback images are shown
5. Check that offline indicators are displayed when appropriate

## Best Practices

1. **Provide local URIs** when images are available locally
2. **Use showOfflineIndicator** to indicate offline status without showing fallback images
3. **Handle errors gracefully** to maintain UI responsiveness
4. **Test offline scenarios** to ensure proper behavior