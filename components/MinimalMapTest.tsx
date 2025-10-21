import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { TYPOGRAPHY } from '@/constants';
import { GoogleMaps, AppleMaps } from 'expo-maps';

const MinimalMapTest = () => {
  // Platform-specific map view
  const MapView = Platform.OS === 'android' ? GoogleMaps.View : AppleMaps.View;

  // Simple camera position
  const cameraPosition = {
    coordinates: { latitude: 52.3676, longitude: 4.9041 },
    zoom: 10,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minimal Map Test</Text>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          cameraPosition={cameraPosition}
        />
      </View>
      <Text style={styles.info}>
        If you see this text but not the map, there might be an issue with the expo-maps implementation.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    margin: 20,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  map: {
    flex: 1,
  },
  info: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    textAlign: 'center',
    color: '#666',
  },
});

export default MinimalMapTest;