import * as React from 'react';
import { render } from '@testing-library/react-native';
import ImageWithFallback from './ImageWithFallback';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
  addEventListener: jest.fn().mockReturnValue(jest.fn()),
}));

// Mock LoadingShimmer
jest.mock('./LoadingShimmer', () => {
  return function MockLoadingShimmer() {
    return <div testID="loading-shimmer" />;
  };
});

describe('ImageWithFallback', () => {
  it('renders fallback when no URI is provided', () => {
    const { getByTestId } = render(
      <ImageWithFallback uri={null} testID="image-fallback" />
    );
    
    // Should render the fallback view
    expect(getByTestId('image-fallback')).toBeTruthy();
  });

  it('renders default image when provided and no URI', () => {
    const defaultImage = { uri: 'default-image-uri' };
    const { getByTestId } = render(
      <ImageWithFallback 
        uri={null} 
        defaultImageSource={defaultImage} 
        testID="image-with-default" 
      />
    );
    
    // Should render the default image
    expect(getByTestId('image-with-default')).toBeTruthy();
  });

  it('renders loading shimmer when loading', () => {
    const { getByTestId } = render(
      <ImageWithFallback uri="https://example.com/image.jpg" testID="image-with-uri" />
    );
    
    // Should render loading shimmer
    expect(getByTestId('loading-shimmer')).toBeTruthy();
  });
});