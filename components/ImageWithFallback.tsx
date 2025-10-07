import * as React from 'react';
import { Image, View, StyleSheet, ImageStyle, ViewStyle, ImageSourcePropType, Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import LoadingShimmer from './LoadingShimmer';
import DefaultImagePlaceholder from './DefaultImagePlaceholder';

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
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Check network connectivity
  React.useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const state: NetInfoState = await NetInfo.fetch();
        setIsOnline(!!(state.isConnected && state.isInternetReachable !== false));
      } catch (err) {
        setIsOnline(false);
      }
    };

    checkConnectivity();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable !== false));
    });

    return () => {
      unsubscribe();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Reset loading state when URI changes
  React.useEffect(() => {
    setLoading(true);
    setError(false);
    setRetryAttempt(0);
  }, [uri]);

  // Retry mechanism for failed image loads
  const handleRetry = React.useCallback(() => {
    if (retryAttempt < retryCount && uri) {
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
  }, [retryAttempt, retryCount, uri]);

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
  if (!isOnline && showOfflineIndicator) {
    return (
      <View style={[containerStyle, styles.offlineContainer]}>
        {defaultImageSource ? (
          <Image source={defaultImageSource} style={style} />
        ) : (
          <DefaultImagePlaceholder 
            style={style} 
            containerStyle={containerStyle} 
          />
        )}
        {showOfflineIndicator && (
          <View style={styles.offlineBadge}>
            <View style={styles.offlineDot} />
          </View>
        )}
      </View>
    );
  }

  // If error and we have a default image, render it
  if ((error || !isOnline) && defaultImageSource) {
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

  // If error or offline and no default image, render the fallback color view
  if (error || !isOnline) {
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
        source={{ uri }}
        style={style}
        onLoad={() => {
          setLoading(false);
          setRetryAttempt(0); // Reset retry attempts on successful load
        }}
        onError={() => {
          setLoading(false);
          if (retryAttempt < retryCount) {
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
    backgroundColor: '#999999',
  },
  offlineBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999999',
  },
});