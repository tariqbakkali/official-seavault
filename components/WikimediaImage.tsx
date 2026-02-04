import * as React from 'react';
import { View, StyleSheet, ImageStyle, ViewStyle, ImageSourcePropType } from 'react-native';
import { Image } from 'expo-image';
import LoadingShimmer from './LoadingShimmer';
import DefaultImagePlaceholder from './DefaultImagePlaceholder';
import { getImageUrlOptions } from '@/utils/imageProxy';

interface WikimediaImageProps {
  uri: string | null | undefined;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackColor?: string;
  defaultImageSource?: ImageSourcePropType;
  retryCount?: number;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export default function WikimediaImage({
  uri,
  style,
  containerStyle,
  fallbackColor = '#2a2a2a',
  defaultImageSource,
  retryCount = 3,
  contentFit = 'cover'
}: WikimediaImageProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [retryAttempt, setRetryAttempt] = React.useState(0);
  const [currentUrlIndex, setCurrentUrlIndex] = React.useState(0);
  const retryTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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

  // If error and we have a default image, render it
  if (error && defaultImageSource) {
    return (
      <View style={containerStyle}>
        <Image source={defaultImageSource} style={style} />
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
          console.warn('WikimediaImage: Image load error:', e, 'URL:', currentUrl);
          // Log additional error details if available
          console.warn('WikimediaImage: Error details:', JSON.stringify(e, null, 2));

          setLoading(false);
          handleRetry();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});