import * as React from 'react';
import { View, StyleSheet, ImageStyle, ViewStyle, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import LoadingShimmer from './LoadingShimmer';
import DefaultImagePlaceholder from './DefaultImagePlaceholder';
import { getImageUrlOptions } from '@/utils/imageProxy';

interface OfflineImageHandlerProps {
  uri: string | null | undefined;
  localUri?: string | null; // Local image URI for offline use
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackColor?: string;
  defaultImageSource?: ImageSourcePropType;
  retryCount?: number;
  showOfflineIndicator?: boolean;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export default function OfflineImageHandler({
  uri,
  localUri,
  style,
  containerStyle,
  fallbackColor = '#2a2a2a',
  defaultImageSource,
  retryCount = 3,
  showOfflineIndicator = false,
  contentFit = 'cover'
}: OfflineImageHandlerProps) {
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
        console.warn('OfflineImageHandler: Error checking connectivity', err);
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
    // If offline and we have a local URI, use it
    if (!isOnline && localUri) {
      return localUri;
    }

    const urls = [urlOptions.original, urlOptions.encoded, urlOptions.proxied].filter(Boolean) as string[];
    return urls[currentUrlIndex] || urlOptions.original;
  }, [urlOptions, currentUrlIndex, isOnline, localUri]);

  // Reset loading state when URI changes
  React.useEffect(() => {
    setLoading(true);
    setError(false);
    setRetryAttempt(0);
    setCurrentUrlIndex(0);
  }, [uri, localUri]);

  // Retry mechanism for failed image loads
  const handleRetry = React.useCallback(() => {
    // Don't retry when offline
    if (!isOnline) {
      setError(true);
      setLoading(false);
      return;
    }

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
  }, [retryAttempt, retryCount, urlOptions, currentUrlIndex, isOnline]);

  // If no URI, render the default image or fallback
  if (!uri && !localUri) {
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

  // If error and we have a default image, render it
  if (error && defaultImageSource) {
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

  // If error and no default image, render the fallback color view
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
        contentFit={contentFit}
        cachePolicy="memory-disk"
        allowDownscaling={true}
        onLoad={() => {
          setLoading(false);
          setRetryAttempt(0); // Reset retry attempts on successful load
        }}
        onLoadEnd={() => {
        }}
        onError={(e) => {
          console.warn('OfflineImageHandler: Image load error:', e, 'URL:', currentUrl);
          setLoading(false);
          handleRetry();
        }}
      />
      {showOfflineIndicator && !isOnline && localUri && (
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
  offlineBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    zIndex: 1,
  },
  offlineDot: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});