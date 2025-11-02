import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';
import MapContainer from '@/components/ui/MapContainer';

const MapTest = () => {
  const [selectedCoordinate, setSelectedCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Sample dive sites data
  const sampleSites = [
    {
      type: 'Feature',
      id: 'site-1',
      properties: {
        id: 'site-1',
        name: 'Sample Dive Site 1',
      },
      geometry: {
        type: 'Point',
        coordinates: [4.9041, 52.3676], // [longitude, latitude] - Amsterdam
      },
    },
    {
      type: 'Feature',
      id: 'site-2',
      properties: {
        id: 'site-2',
        name: 'Sample Dive Site 2',
      },
      geometry: {
        type: 'Point',
        coordinates: [4.8952, 52.3669], // [longitude, latitude] - Amsterdam area
      },
    },
  ];

  const initialRegion = {
    latitude: 52.3676,
    longitude: 4.9041,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // Render function for individual markers
  const renderMarker = (data: any) => {
    if (
      !data ||
      !data.geometry ||
      !data.geometry.coordinates ||
      !Array.isArray(data.geometry.coordinates) ||
      data.geometry.coordinates.length < 2
    ) {
      return null;
    }

    const lat = data.geometry.coordinates[1];
    const lng = data.geometry.coordinates[0];

    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return null;
    }

    // Return marker data object for CustomClusteredMapView
    return {
      id: data.properties.id,
      coordinates: { latitude: lat, longitude: lng },
      title: data.properties.name,
      color: '#007AFF',
    };
  };

  const handleMapPress = (event: any) => {
    // Handle different event structures from Expo Maps
    let coordinate;
    if (event && event.nativeEvent && event.nativeEvent.coordinate) {
      // Standard React Native event structure
      coordinate = event.nativeEvent.coordinate;
    } else if (event && event.coordinate) {
      // Expo Maps direct coordinate structure
      coordinate = event.coordinate;
    } else if (event && event.coordinates) {
      // Expo Maps alternative event structure with 'coordinates' (plural)
      coordinate = event.coordinates;
    } else {
      // Fallback if we can't find coordinates
      console.warn('Could not extract coordinates from event:', event);
      return;
    }

    setSelectedCoordinate(coordinate);
    Alert.alert(
      'Coordinates Selected',
      `Latitude: ${coordinate.latitude.toFixed(
        6
      )}\nLongitude: ${coordinate.longitude.toFixed(6)}`,
      [{ text: 'OK' }]
    );
  };

  const handleMarkerDragEnd = (event: any) => {
    // Handle different event structures from Expo Maps
    let coordinate;
    if (event && event.nativeEvent && event.nativeEvent.coordinate) {
      // Standard React Native event structure
      coordinate = event.nativeEvent.coordinate;
    } else if (event && event.coordinate) {
      // Expo Maps direct coordinate structure
      coordinate = event.coordinate;
    } else if (event && event.coordinates) {
      // Expo Maps alternative event structure with 'coordinates' (plural)
      coordinate = event.coordinates;
    } else {
      // Fallback if we can't find coordinates
      console.warn('Could not extract coordinates from event:', event);
      return;
    }

    setSelectedCoordinate(coordinate);
    Alert.alert(
      'Marker Moved',
      `New position:\nLatitude: ${coordinate.latitude.toFixed(
        6
      )}\nLongitude: ${coordinate.longitude.toFixed(6)}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map Test</Text>
      <Text style={styles.description}>
        Test map functionality: pan, zoom, tap to select coordinates, drag the
        red marker.
      </Text>

      <MapContainer
        data={sampleSites}
        initialRegion={initialRegion}
        renderMarker={renderMarker}
        clusteringEnabled={false}
        onPress={handleMapPress}
        onMarkerDragEnd={handleMarkerDragEnd}
        selectedCoordinate={selectedCoordinate}
        // helperText="Tap on the map to select coordinates. Drag the red marker to move it."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: DIMENSIONS.PADDING_MD,
    backgroundColor: '#000',
    borderRadius: DIMENSIONS.RADIUS_SM,
    margin: DIMENSIONS.PADDING_MD,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.SPACE_XS,
    textAlign: 'center',
    color: '#fff',
  },
  description: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    textAlign: 'center',
    color: '#999',
    marginBottom: DIMENSIONS.PADDING_MD,
  },
});

export default MapTest;
