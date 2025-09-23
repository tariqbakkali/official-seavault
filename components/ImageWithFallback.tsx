import * as React from 'react';
import { Image, View, StyleSheet, ImageStyle, ViewStyle, ImageSourcePropType } from 'react-native';
import LoadingShimmer from './LoadingShimmer';

interface ImageWithFallbackProps {
  uri: string | null | undefined;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackColor?: string;
  defaultImageSource?: ImageSourcePropType; // Add this prop
}

export default function ImageWithFallback({ 
  uri, 
  style, 
  containerStyle,
  fallbackColor = '#2a2a2a',
  defaultImageSource // Destructure the new prop
}: ImageWithFallbackProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // If no URI or an error, and a default image is provided, render the default image
  if ((!uri || error) && defaultImageSource) {
    return (
      <View style={containerStyle}>
        <Image source={defaultImageSource} style={style} />
      </View>
    );
  }

  // If no URI or an error, and no default image, render the fallback color view
  if (!uri || error) {
    return (
      <View style={[styles.fallback, { backgroundColor: fallbackColor }, containerStyle, style]} />
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
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
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