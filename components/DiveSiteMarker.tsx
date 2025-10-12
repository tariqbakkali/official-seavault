import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { GoogleMaps, AppleMaps } from 'expo-maps';

interface DiveSiteMarkerProps {
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
 * Reusable component for displaying dive site markers on the map using expo-maps
 */
const DiveSiteMarker: React.FC<DiveSiteMarkerProps> = ({
  id,
  name,
  latitude,
  longitude,
  onPress,
  pinColor = '#007AFF',
  draggable = false,
  onDragEnd
}) => {
  // Platform-specific map view
  const MapViewComponent = Platform.OS === 'android' ? GoogleMaps.View : AppleMaps.View;

  // Convert to camera position
  const cameraPosition = {
    coordinates: { latitude, longitude },
    zoom: 15,
  };

  // Create marker with enhanced properties
  const markers = [{
    id,
    coordinates: { latitude, longitude },
    title: name,
    color: pinColor,
    // Note: draggable is not directly supported in expo-maps
  }];

  return (
    <View style={styles.container}>
      <MapViewComponent
        style={styles.map}
        cameraPosition={cameraPosition}
        markers={markers}
        onMarkerClick={onPress ? () => onPress() : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default DiveSiteMarker;