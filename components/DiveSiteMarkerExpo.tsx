import React from 'react';
import { Platform, View } from 'react-native';
import { GoogleMaps, AppleMaps } from 'expo-maps';

interface DiveSiteMarkerExpoProps {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  onPress?: () => void;
  pinColor?: string;
  draggable?: boolean;
  onDragEnd?: (event: any) => void;
}

/**
 * Reusable function for creating dive site marker data for expo-maps
 * Simplified to avoid JS Symbols conversion issues
 */
export const createDiveSiteMarkerData = ({
  id,
  name,
  latitude,
  longitude,
  onPress,
  pinColor = '#007AFF',
  draggable = false,
  onDragEnd
}: DiveSiteMarkerExpoProps) => {
  // Create a simple marker data object for expo-maps
  // Avoid complex properties that might cause "JS Symbols are not convertible to dynamic" errors
  const markerData = {
    id,
    title: name,
    coordinates: {
      latitude,
      longitude,
    },
  };

  return markerData;
};

// Component version using expo-maps
export const DiveSiteMarkerExpo: React.FC<DiveSiteMarkerExpoProps> = ({
  id,
  name,
  latitude,
  longitude,
  onPress,
  pinColor = '#007AFF',
}) => {
  // Platform-specific map view
  const MapView = Platform.OS === 'android' ? GoogleMaps.View : AppleMaps.View;

  // Convert to camera position
  const cameraPosition = {
    coordinates: { latitude, longitude },
    zoom: 15,
  };

  // Create marker
  const markers = [{
    id,
    coordinates: { latitude, longitude },
    title: name,
    // Note: pinColor is not directly supported in expo-maps
  }];

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        cameraPosition={cameraPosition}
        markers={markers}
        onMarkerClick={onPress ? () => onPress() : undefined}
      />
    </View>
  );
};

export default createDiveSiteMarkerData;