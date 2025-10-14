# Offline Image Handling

This document explains how the offline-first image handling system works in the Seavault application.

## Overview

The Seavault application implements a robust offline-first image handling system that ensures users can view their images even when they don't have an internet connection. The system prioritizes local images and only attempts to download remote images when online.

## Key Components

### 1. OptimizedImage Component

The [OptimizedImage](file:///Users/applevalley/Work/official-seavault/components/OptimizedImage.tsx#L15-L125) component is responsible for displaying images with the following priority:

1. **Local URI First**: Always tries to use local images when available, regardless of online status
2. **Remote URL When Online**: Downloads and caches remote images when device is online
3. **Cached Images Offline**: Uses cached versions of remote images when offline
4. **Fallback Handling**: Shows any available image even in error states

### 2. Image Sync Service

The [imageSyncService](file:///Users/applevalley/Work/official-seavault/services/imageSyncService.ts#L12-L365) handles synchronization between local storage and Supabase Storage with improved offline handling:

- Checks network connectivity before attempting downloads
- Verifies local file existence before using local URIs
- Provides graceful degradation when offline

### 3. Image Storage Service

The [imageStorageService](file:///Users/applevalley/Work/official-seavault/services/imageStorageService.ts#L0-L236) manages local file operations with dynamic imports for native modules:

- Dynamic import of ImageManipulator to handle native module issues
- Graceful fallbacks when native modules aren't available
- Proper error handling for file operations

## Offline Handling Improvements

### Local Image Prioritization

The system now prioritizes local images over remote ones and verifies their existence:

```typescript
// PRIORITY 1: Always try to use local URI first (works offline and online)
if (imageMetadata.localUri) {
  // Verify local file exists before using it
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageMetadata.localUri);
    if (fileInfo.exists) {
      setImageUri(imageMetadata.localUri);
      setIsLoading(false);
      return;
    }
  } catch (error) {
    console.log('Local file check failed:', error);
  }
}
```

### Network Awareness

Before attempting to download remote images, the system checks network connectivity:

```typescript
// Check if we're online before trying to download
const isOnline = await isDeviceOnline();
if (!isOnline) {
  console.log('Device is offline, cannot download image:', imageMetadata.id);
  return null;
}
```

### No Fallback Images When Offline

When offline, the system no longer shows fallback images and instead displays proper error messages:

```typescript
// When offline and no local image is available
if (!isOnline) {
  // Don't try to show fallback images
  setHasError(true);
  setIsLoading(false);
  return;
}
```

## Usage Examples

### Displaying Images Offline

```tsx
<OptimizedImage 
  imageMetadata={imageMetadata}
  style={styles.image}
  showSyncStatus={true}
/>
```

### Ensuring Images are Available Offline

```typescript
const localUri = await ensureImageDownloaded(imageMetadata);
if (localUri) {
  // Image is available locally
  displayImage(localUri);
} else {
  // Handle case where image isn't available
}
```

## Best Practices

1. **Always provide local URIs** when images are captured or selected locally
2. **Verify local file existence** before using local URIs
3. **Check network connectivity** before attempting remote operations
4. **Implement graceful fallbacks** for all image operations
5. **Use appropriate error handling** to ensure UI remains responsive

## Testing Offline Scenarios

To test offline image handling:

1. Enable airplane mode on the device
2. Navigate to a screen with images
3. Verify that locally stored images are still displayed
4. Confirm that remote-only images show appropriate fallbacks

## Error Handling

The system implements comprehensive error handling:

- Network connectivity checks before remote operations
- File existence verification for local images
- Graceful degradation when native modules aren't available
- Fallback mechanisms for all image operations