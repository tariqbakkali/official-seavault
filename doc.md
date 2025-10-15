# Project Refactoring Documentation

This document outlines the findings from a comprehensive review of the project's codebase, focusing on identifying and addressing duplicated logic, redundant synchronization mechanisms, and other areas for improvement, particularly within the image handling and synchronization modules.

## Summary of Issues Found

### 1. Duplicated and Inconsistent Network Status Checks

**Problem:** The application had multiple, independent implementations for checking network connectivity, leading to redundant code, potential for inconsistent behavior, and increased maintenance overhead. Network status was being checked in:

*   `components/ImageWithFallback.tsx` (direct `NetInfo` listener)
*   `components/OfflineImageHandler.tsx` (direct `NetInfo` listener)
*   `services/imageService.ts` (`isDeviceOnline` function, wrapping `NetInfo.fetch()`)
*   `services/imageSyncService.ts` (direct `NetInfo` listener and calls to `isDeviceOnline`)
*   `hooks/useImageSync.ts` (calls `isDeviceOnline` and direct `NetInfo` listener)

**Impact:** Inconsistent network awareness across components, increased code complexity, and difficulty in debugging network-related issues.

### 2. Redundant Image Loading and Fallback Logic in Display Components

**Problem:** Three different React components (`ImageWithFallback.tsx`, `OfflineImageHandler.tsx`, `OptimizedImage.tsx`) shared significant overlap in their responsibilities for loading images, handling errors, implementing retry mechanisms, and displaying placeholders/fallbacks. While they had subtle behavioral differences (e.g., `localUri` prioritization), the core logic was duplicated.

**Impact:** High maintenance burden, inconsistent user experience, code bloat, and difficulty in introducing new image loading features or fixing bugs.

### 3. Dispersed and Duplicated Image Upload Retry Logic

**Problem:** The logic for retrying failed image uploads was scattered across multiple files, leading to confusion about the authoritative source and potential for conflicting retry strategies:

*   `services/imageSyncService.ts` managed an internal `uploadQueue` with its own retry mechanism.
*   `services/imageService.ts` had a `retryFailedUploads` function that directly retried `ImageMetadata` objects.
*   `hooks/useImageSync.ts` had a `retryFailedUploads` function that wrapped `batchUploadImages` from `imageSyncService.ts`.

**Impact:** Inconsistent retry behavior, difficulty in tracking upload status, and increased complexity in the synchronization process.

### 4. Duplicated App State Listeners for Synchronization

**Problem:** Both `services/imageSyncService.ts` and `hooks/useImageSync.ts` were independently listening to `AppState` changes (e.g., when the app comes to the foreground) to trigger synchronization processes.

**Impact:** Redundant event subscriptions and potential for multiple, uncoordinated sync attempts.

### 5. Scattered Image Manipulation Functions

**Problem:** Image manipulation functions (like `compressImage`, `generateThumbnail`, `resizeImage`, etc.) were present in both `services/imageStorageService.ts` and `utils/imageUtils.ts`, with slightly different implementations and dependencies.

**Impact:** Duplicated code, inconsistent image processing, and difficulty in maintaining a single set of image utility functions.

### 6. Inconsistent `getImagesForDiveSite` Implementations

**Problem:** There were two functions named `getImagesForDiveSite` with different responsibilities and data sources:

*   `services/imageService.ts` had a placeholder version based on local URIs.
*   `stores/imageState.ts` had an authoritative version that filtered images from the Legend State observable.

**Impact:** Confusion about which function to use and potential for incorrect data retrieval.

## Refactoring Steps Taken

The following steps were taken to address the identified issues:

### Phase 1: Core Utilities & Hooks

1.  **Created `hooks/useNetworkStatus.ts`:**
    *   A new custom hook was created to centralize network connectivity detection using `NetInfo`.
    *   It provides a single `isOnline` state, ensuring consistent network awareness across the application.

2.  **Created `hooks/useImageLoader.ts`:**
    *   A new custom hook was developed to encapsulate the complex logic of image loading for display.
    *   It handles `uri`, `localUri`, `ImageMetadata`, network status (via `useNetworkStatus`), URL options (via `getImageUrlOptions`), and retry mechanisms.
    *   It returns `displayUri`, `isLoading`, `hasError`, and `handleImageError` for simplified component rendering.

### Phase 2: Image Synchronization Service Consolidation

1.  **Refactored `services/imageService.ts`:**
    *   The `isDeviceOnline` function was removed.
    *   The `NetInfo` import was removed.
    *   The `retryFailedUploads` function was removed, as its functionality was consolidated into `services/imageSyncService.ts`.

2.  **Refactored `services/imageSyncService.ts`:**
    *   Its internal `uploadQueue` array and related functions (`addToUploadQueue`, `removeFromUploadQueue`, `getUploadQueueStatus`) were removed.
    *   It now interacts directly with the `uploadQueue$` observable and its utility functions (`addImageToQueueObservable`, `updateUploadQueueItem`, `removeImageFromQueueObservable`, `getObservableUploadQueueStatus`) from `stores/imageState.ts`.
    *   The `NetInfo` import and `isDeviceOnline` import were removed.
    *   `startSyncProcess`, `processUploadQueue`, `ensureImageDownloaded`, `batchUploadImages`, `uploadSingleImage`, and `retryFailedUploads` were updated to accept an `isOnline` parameter.
    *   The `NetInfo.addEventListener` and `AppState.addEventListener` were removed from `initializeImageSyncService`.
    *   `initializeImageSyncService` was modified to accept a `getIsOnline` function, allowing it to receive the online status from a higher level (e.g., `hooks/useImageSync.ts`).

3.  **Refactored `hooks/useImageSync.ts`:**
    *   It now uses the `useNetworkStatus` hook to get the `isOnline` status.
    *   The `isDeviceOnline` import, `NetInfo` import, and `AppState` import were removed.
    *   The `checkConnectivity` function was removed.
    *   `startSync`, `retryFailedUploads`, and `ensureImageDownloadedForOffline` were updated to use the `isOnline` state directly.
    *   The `useEffect` hooks for network connectivity changes and app state changes were removed.
    *   `initializeImageSyncService` is now called with a getter for the `isOnline` status.

### Phase 3: Image Display Component Unification

1.  **Refactored `components/ImageWithFallback.tsx`:**
    *   Now uses the `useImageLoader` hook for all image loading, error handling, and retry logic.
    *   Removed redundant state, network logic, and `getImageUrlOptions` import.
    *   Simplified rendering based on `displayUri`, `isLoading`, and `hasError` from `useImageLoader`.

2.  **Refactored `components/OfflineImageHandler.tsx`:**
    *   Now uses the `useImageLoader` hook, passing the `localUri` prop correctly.
    *   Removed redundant state, network logic, and `getImageUrlOptions` import.
    *   Simplified rendering based on `displayUri`, `isLoading`, and `hasError` from `useImageLoader`.

3.  **Refactored `components/OptimizedImage.tsx`:**
    *   Now uses the `useImageLoader` hook, passing `imageMetadata` and its `remoteUrl` and `localUri` properties.
    *   Removed redundant state, `useImageSync` import, and `ensureImageDownloaded` import.
    *   Simplified rendering based on `displayUri`, `isLoading`, and `hasError` from `useImageLoader`.

### Phase 4: Review and Cleanup

1.  **Consolidated Image Manipulation:**
    *   All image manipulation functions (`resizeImage`, `convertImageFormat`, `applyGrayscaleFilter`, `getImageDimensions`, `generateMultipleSizes`, `optimizeImageForWeb`, `validateImage`, `isPortraitImage`, `isLandscapeImage`, `isSquareImage`, `getMimeTypeFromExtension`, `getExtensionFromMimeType`) were moved from `utils/imageUtils.ts` to `services/imageStorageService.ts`.
    *   The `getImageFileSize` function was properly implemented in `services/imageStorageService.ts` using `FileSystem.getInfoAsync`.
    *   The `utils/imageUtils.ts` file was deleted.

2.  **Authoritative Image State:**
    *   The redundant `getImagesForDiveSite` function in `services/imageService.ts` was removed, ensuring `stores/imageState.ts` is the single source of truth for Legend State-managed images.

## Potentially Unused Functions

During the analysis, the following functions were identified as potentially unused, meaning they are exported but not imported or directly called anywhere else in the codebase. These functions may represent dead code that can be safely removed or refactored if their functionality is indeed no longer required.

### From `services/imageSyncService.ts`:

*   `removeFromUploadQueue` (L45): This function is exported but not directly called externally. It wraps an observable function from `stores/imageState.ts`.

### From `services/imageStorageService.ts`:

*   `convertImageFormat`
*   `applyGrayscaleFilter`
*   `generateMultipleSizes`
*   `optimizeImageForWeb`
*   `validateImage`
*   `isPortraitImage`
*   `isLandscapeImage`
*   `isSquareImage`
*   `getMimeTypeFromExtension`
*   `getExtensionFromMimeType`
*   `clearOldImages`

### From `hooks/useImageSync.ts` (values returned by the hook):

*   `isSyncing`
*   `queueStatus`
*   `syncError`
*   `startSync`
*   `retryFailedUploads`
*   `ensureImageDownloadedForOffline`
*   `clearSyncError`

### From `stores/imageState.ts`:

*   `imageCache$`
*   `getImages`
*   `getImagesForDiveSite`
*   `addImage`
*   `updateImage`
*   `addImageToCache`
*   `removeImageFromCache`
*   `updateImageCacheAccessTime`

## Conclusion

This refactoring effort has significantly improved the project's codebase by centralizing common logic, eliminating redundancy, and clarifying responsibilities within the image handling and synchronization modules. The changes lead to a more maintainable, consistent, and robust application architecture. Further improvements could include a more generic `retry` utility if similar patterns emerge in other parts of the application.