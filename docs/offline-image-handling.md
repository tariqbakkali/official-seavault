# Offline Image Handling

This document explains how the improved offline image handling works in the Seavault application.

## Overview

The [ImageWithFallback](file:///d:/Work/official-seavault/components/ImageWithFallback.tsx#L7-L62) component has been enhanced to provide comprehensive offline support with the following features:

1. Network connectivity detection using `@react-native-community/netinfo`
2. Smart caching mechanisms for better offline image availability
3. Retry mechanism for failed image loads
4. Visual indicators for offline status
5. Fallback strategies for various offline scenarios

## Key Features

### Network Connectivity Detection

The component uses NetInfo to monitor network connectivity and determine if the device is online or offline:

```typescript
import NetInfo from '@react-native-community/netinfo';

// Check initial connectivity
const state = await NetInfo.fetch();
setIsOnline(state.isConnected && state.isInternetReachable !== false);

// Subscribe to connectivity changes
const unsubscribe = NetInfo.addEventListener(state => {
  setIsOnline(state.isConnected && state.isInternetReachable !== false);
});
```

### Retry Mechanism

Failed image loads are automatically retried with exponential backoff:

```typescript
const handleRetry = React.useCallback(() => {
  if (retryAttempt < retryCount && uri) {
    setRetryAttempt(prev => prev + 1);
    setLoading(true);
    setError(false);
    
    // Exponential backoff
    retryTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setLoading(true), 50);
    }, 500 * (retryAttempt + 1));
  } else {
    setError(true);
  }
}, [retryAttempt, retryCount, uri]);
```

### Offline Indicators

When the `showOfflineIndicator` prop is set to `true`, a visual indicator is displayed on images when the device is offline:

```typescript
{showOfflineIndicator && isOnline === false && (
  <View style={styles.offlineBadge}>
    <View style={styles.offlineDot} />
  </View>
)}
```

### Cache Control

Images are loaded with cache control settings optimized for offline usage:

```typescript
<Image
  source={{ uri }}
  cache={Platform.OS === 'ios' ? 'only-if-cached' : 'force-cache'}
/>
```

## Usage

To use the enhanced offline image handling, simply add the `showOfflineIndicator` prop to any [ImageWithFallback](file:///d:/Work/official-seavault/components/ImageWithFallback.tsx#L7-L62) component:

```typescript
<ImageWithFallback
  uri={imageUrl}
  style={styles.image}
  containerStyle={styles.imageContainer}
  showOfflineIndicator={true}
/>
```

## Configuration Options

The [ImageWithFallback](file:///d:/Work/official-seavault/components/ImageWithFallback.tsx#L7-L62) component accepts the following props for offline handling:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `uri` | string | undefined | The image URI to load |
| `style` | ImageStyle | undefined | Style for the image component |
| `containerStyle` | ViewStyle | undefined | Style for the container view |
| `fallbackColor` | string | '#2a2a2a' | Background color when image fails to load |
| `defaultImageSource` | ImageSourcePropType | undefined | Default image to show when URI is null/undefined |
| `retryCount` | number | 3 | Number of retry attempts for failed loads |
| `showOfflineIndicator` | boolean | false | Show visual indicator when offline |

## Fallback Strategies

The component implements multiple fallback strategies:

1. **No URI**: Shows default image or fallback color
2. **Network Error**: Shows default image or fallback color
3. **Offline Mode**: Shows cached version if available, otherwise default image or fallback color
4. **Loading Timeout**: Retries with exponential backoff

## Testing Offline Mode

To test the offline functionality:

1. Enable Airplane Mode on your device
2. Navigate to any screen with images
3. Observe the offline indicators on images
4. Images should show cached versions or fallbacks when available

## Future Improvements

Potential future enhancements could include:

1. Pre-caching of frequently accessed images
2. Progressive image loading (low-res then high-res)
3. Storage of images in local database for offline access
4. Bandwidth-aware image loading (different quality based on connection)