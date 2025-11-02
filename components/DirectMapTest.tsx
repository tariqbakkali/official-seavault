import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { GoogleMaps, AppleMaps } from 'expo-maps'; // Correct import

const DirectMapTest = () => {
  // Platform-specific map view
  const MapView = Platform.OS === 'android' ? GoogleMaps.View : AppleMaps.View;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Direct Map Test</Text>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          cameraPosition={{
            coordinates: {
              latitude: 52.3676,
              longitude: 4.9041,
            },
            zoom: 10,
          }}
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
    padding: DIMENSIONS.PADDING_LG,
    backgroundColor: '#f0f0f0',
    borderRadius: DIMENSIONS.RADIUS_SM,
    margin: DIMENSIONS.PADDING_LG,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.SPACE_SM,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    borderRadius: DIMENSIONS.RADIUS_SM,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: DIMENSIONS.SPACE_SM,
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

export default DirectMapTest;