import * as React from 'react';
import { Image, View, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import LoadingShimmer from './LoadingShimmer';

interface ImageWithFallbackProps {
  uri: string | null | undefined;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackColor?: string;
}

export default function ImageWithFallback({ 
  uri, 
  style, 
  containerStyle,
  fallbackColor = '#2a2a2a'
}: ImageWithFallbackProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

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