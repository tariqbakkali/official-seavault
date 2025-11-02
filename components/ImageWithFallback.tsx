import * as React from 'react';
import { View, StyleSheet, ImageStyle, ViewStyle, ImageSourcePropType, Platform } from 'react-native';
import { Image } from 'expo-image';
import { DIMENSIONS } from '@/constants';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import LoadingShimmer from './LoadingShimmer';
import DefaultImagePlaceholder from './DefaultImagePlaceholder';
import { getImageUrlOptions } from '@/utils/imageProxy';

interface ImageWithFallbackProps {
  uri: string | null | undefined;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackColor?: string;
  defaultImageSource?: ImageSourcePropType;
  retryCount?: number; // Number of retry attempts
  showOfflineIndicator?: boolean; // Show offline indicator
}

export default function ImageWithFallback({ 
  uri, 
  style, 
  containerStyle,
  fallbackColor = '#2a2a2a',
  defaultImageSource,
  retryCount = 3,
  showOfflineIndicator = false
}: ImageWithFallbackProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState<boolean>(true);
  const [retryAttempt, setRetryAttempt] = React.useState(0);
  const [currentUrlIndex, setCurrentUrlIndex] = React.useState(0);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check network connectivity
  React.useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const state: NetInfoState = await NetInfo.fetch();
        // isInternetReachable can sometimes be null or unreliable
        // Let's be more permissive and only consider truly disconnected as offline
        const online = state.isConnected !== false; // Consider connected if not explicitly false
        setIsOnline(online);
      } catch (err) {
        console.warn('ImageWithFallback: Error checking connectivity', err);
        // If we can't determine connectivity, assume we're online to avoid blocking image loads
        setIsOnline(true);
      }
    };

    checkConnectivity();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      // isInternetReachable can sometimes be null or unreliable
      // Let's be more permissive and only consider truly disconnected as offline
      const online = state.isConnected !== false; // Consider connected if not explicitly false
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Get URL options
  const urlOptions = React.useMemo(() => {
    return getImageUrlOptions(uri);
  }, [uri]);

  // Get current URL to try
  const currentUrl = React.useMemo(() => {
    const urls = [urlOptions.original, urlOptions.encoded, urlOptions.proxied].filter(Boolean) as string[];
    return urls[currentUrlIndex] || urlOptions.original;
  }, [urlOptions, currentUrlIndex]);

  // Reset loading state when URI changes
  React.useEffect(() => {
    setLoading(true);
    setError(false);
    setRetryAttempt(0);
    setCurrentUrlIndex(0);
  }, [uri]);

  // Retry mechanism for failed image loads
  const handleRetry = React.useCallback(() => {
    const urls = [urlOptions.original, urlOptions.encoded, urlOptions.proxied].filter(Boolean) as string[];
    
    // Try next URL option if available
    if (currentUrlIndex < urls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setLoading(true);
      setError(false);
    } else if (retryAttempt < retryCount) {
      // Retry with same URL
      setRetryAttempt(prev => prev + 1);
      setLoading(true);
      setError(false);
      
      // Add a small delay before retrying to avoid rapid retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        // Force re-render by updating state
        setLoading(false);
        // Small timeout to allow state update before setting back to loading
        setTimeout(() => setLoading(true), 50);
      }, 500 * (retryAttempt + 1)); // Exponential backoff
    } else {
      setError(true);
    }
  }, [retryAttempt, retryCount, urlOptions, currentUrlIndex]);

  // If no URI, render the default image or fallback
  if (!uri) {
    if (defaultImageSource) {
      return (
        <View style={containerStyle}>
          <Image source={defaultImageSource} style={style} />
        </View>
      );
    }
    return (
      <DefaultImagePlaceholder 
        style={style} 
        containerStyle={containerStyle} 
      />
    );
  }

  // If offline and no cached version, show appropriate fallback
  // But only do this if showOfflineIndicator is true
  if (!isOnline && showOfflineIndicator) {
    // According to user requirement: when internet is off, must show real images from local storage
    // instead of fallback images or placeholders. So we'll try to load the image anyway
    // and only show the offline indicator
    // Device is offline, but still attempting to load image
  }

  // If error and we have a default image, render it
  // Only consider offline if showOfflineIndicator is true
  if ((error || (!isOnline && showOfflineIndicator)) && defaultImageSource) {
    // According to user requirement: when internet is off, must show real images from local storage
    // instead of fallback images or placeholders. So we'll only show default image if there's an actual error
    if (error) {
      return (
        <View style={containerStyle}>
          <Image source={defaultImageSource} style={style} />
          {showOfflineIndicator && !isOnline && (
            <View style={styles.offlineBadge}>
              <View style={styles.offlineDot} />
            </View>
          )}
        </View>
      );
    }
  }

  // If error or offline and no default image, render the fallback color view
  // Only consider offline if showOfflineIndicator is true
  if (error || (!isOnline && showOfflineIndicator)) {
    // According to user requirement: when internet is off, must show real images from local storage
    // instead of fallback images or placeholders. So we'll only show fallback if there's an actual error
    if (error) {
      return (
        <View style={containerStyle}>
          <DefaultImagePlaceholder 
            style={style} 
            containerStyle={containerStyle} 
          />
          {showOfflineIndicator && !isOnline && (
            <View style={styles.offlineBadge}>
              <View style={styles.offlineDot} />
            </View>
          )}
        </View>
      );
    }
  }

  return (
    <View style={containerStyle}>
      {loading && (
        <LoadingShimmer 
          style={StyleSheet.absoluteFill as ViewStyle}
        />
      )}
      <Image
        key={currentUrl} // Force re-render when URL changes
        source={{ uri: currentUrl || '' }}
        style={style}
        cachePolicy="memory-disk"
        allowDownscaling={true}
        onLoad={() => {
          // Log additional load details if available
          setLoading(false);
          setRetryAttempt(0); // Reset retry attempts on successful load
        }}
        onLoadEnd={() => {
        }}
        onError={(e) => {
          console.warn('ImageWithFallback: Image load error:', e, 'URL:', currentUrl);
          // Log additional error details if available
          console.warn('ImageWithFallback: Error details:', JSON.stringify(e, null, 2));
          
          setLoading(false);
          // Only handle retry if we're online, otherwise just show error
          if (isOnline) {
            handleRetry();
          } else {
            setError(true);
          }
        }}
      />
      {showOfflineIndicator && !isOnline && (
        <View style={styles.offlineBadge}>
          <View style={styles.offlineDot} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineContainer: {
    position: 'relative',
  },
  offlineIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  errorBadge: {
    position: 'absolute',
    top: DIMENSIONS.SPACE_XS,
    right: DIMENSIONS.SPACE_XS,
    width: DIMENSIONS.SPACE_MD,
    height: DIMENSIONS.SPACE_MD,
    borderRadius: DIMENSIONS.RADIUS_XS,
    backgroundColor: '#FF3B30',
  },
  offlineBadge: {
    position: 'absolute',
    top: DIMENSIONS.SPACE_XS,
    right: DIMENSIONS.SPACE_XS,
    width: DIMENSIONS.SPACE_MD,
    height: DIMENSIONS.SPACE_MD,
    borderRadius: DIMENSIONS.RADIUS_XS,
    backgroundColor: '#FF3B30',
    zIndex: 1,
  },
  offlineDot: {
    width: '100%',
    height: '100%',
    borderRadius: DIMENSIONS.RADIUS_XS,
    backgroundColor: '#FF3B30',
  }
});
