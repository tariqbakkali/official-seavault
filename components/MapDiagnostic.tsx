import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { GoogleMaps, AppleMaps } from 'expo-maps';

const MapDiagnostic = () => {
  const [locationPermission, setLocationPermission] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  // Platform-specific map view
  const MapView = Platform.OS === 'android' ? GoogleMaps.View : AppleMaps.View;

  useEffect(() => {
    checkLocationPermission();
    getApiKey();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationPermission('error');
    }
  };

  const getApiKey = () => {
    const key = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || '';
    setApiKey(key);
  };
  // Simple marker for the map
  const markers = location ? [{
    id: 'current-location',
    coordinates: { 
      latitude: location.coords.latitude, 
      longitude: location.coords.longitude 
    },
    title: 'Current Location',
  }] : [];

  // Camera position
  const cameraPosition = {
    coordinates: {
      latitude: location?.coords?.latitude || 52.3676,
      longitude: location?.coords?.longitude || 4.9041,
    },
    zoom: 10,
  };

  // Handle map load error
  const handleMapLoadError = (error: any) => {
    console.error('Map load error:', error);
    setMapLoadError(error?.message || 'Unknown error occurred while loading map');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map Diagnostic</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.label}>Platform:</Text>
        <Text style={styles.value}>{Platform.OS}</Text>
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.label}>API Key Status:</Text>
        <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
          {apiKey ? '✅ Key Loaded' : '❌ No Key Found'}
        </Text>
        {apiKey ? (
          <Text style={styles.smallText}>Key: {apiKey.substring(0, 10)}...</Text>
        ) : null}
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.label}>Location Permission:</Text>
        <Text style={styles.value}>
          {locationPermission === 'granted' ? '✅ Granted' : 
           locationPermission === 'denied' ? '❌ Denied' : 
           locationPermission === 'undetermined' ? '❓ Undetermined' : 
           locationPermission === 'error' ? '⚠️ Error' : 'Unknown'}
        </Text>
      </View>
      
      {location && (
        <View style={styles.infoBox}>
          <Text style={styles.label}>Current Location:</Text>
          <Text style={styles.smallText}>
            Lat: {location.coords.latitude.toFixed(4)}
          </Text>
          <Text style={styles.smallText}>
            Lng: {location.coords.longitude.toFixed(4)}
          </Text>
        </View>
      )}
      
      {mapLoadError && (
        <View style={styles.infoBox}>
          <Text style={styles.label}>Map Load Error:</Text>
          <Text style={styles.errorText}>{mapLoadError}</Text>
        </View>
      )}
      
      <View style={styles.mapContainer}>
        <Text style={styles.mapLabel}>Map Preview:</Text>
        <View style={styles.mapPlaceholder}>
          <MapView 
            style={styles.map}
            cameraPosition={cameraPosition}
            markers={markers}
            onMapLoaded={() => {}}
          />
        </View>
      </View>
      
      <View style={styles.troubleshootingSection}>
        <Text style={styles.troubleshootingTitle}>Troubleshooting Steps:</Text>
        <Text style={styles.troubleshootingText}>1. Verify your Google Maps API key is correct</Text>
        <Text style={styles.troubleshootingText}>2. Check that the Maps SDK for Android is enabled in Google Cloud Console</Text>
        <Text style={styles.troubleshootingText}>3. Ensure your API key has the correct restrictions</Text>
        <Text style={styles.troubleshootingText}>4. Verify SHA-1 certificate fingerprint is correctly configured</Text>
        <Text style={styles.troubleshootingText}>5. Create a new development build after making changes</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: DIMENSIONS.PADDING_MD,
    backgroundColor: '#f0f0f0',
    borderRadius: DIMENSIONS.RADIUS_SM,
    margin: DIMENSIONS.PADDING_MD,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.SPACE_LG,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'white',
    padding: DIMENSIONS.PADDING_XS,
    borderRadius: DIMENSIONS.RADIUS_XS,
    marginBottom: DIMENSIONS.SPACE_XS,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: TYPOGRAPHY.SIZE_LG,
  },
  smallText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#666',
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#ff0000',
  },
  mapContainer: {
    marginTop: DIMENSIONS.PADDING_LG,
  },
  mapLabel: {
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#e0e0e0',
    borderRadius: DIMENSIONS.RADIUS_XS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  map: {
    flex: 1,
  },
  note: {
    marginTop: DIMENSIONS.PADDING_LG,
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  troubleshootingSection: {
    marginTop: DIMENSIONS.PADDING_LG,
    padding: DIMENSIONS.PADDING_LG,
    backgroundColor: '#fff',
    borderRadius: DIMENSIONS.RADIUS_SM,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  troubleshootingTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: 'bold',
    marginBottom: DIMENSIONS.SPACE_XS,
    color: '#333',
  },
  troubleshootingText: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    marginBottom: DIMENSIONS.SPACE_XS,
    color: '#666',
  },
});

export default MapDiagnostic;