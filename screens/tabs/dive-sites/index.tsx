import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useSyncedData } from '@/hooks/useSyncedData';
import { hasValidCoordinates } from '@/utils/diveSiteUtils';
import AutocompleteField from '@/components/forms/AutocompleteField';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { COLORS, DIMENSIONS } from '@/constants';
import { TYPOGRAPHY } from '@/constants';
import { DiveSite } from '@/types/database';
import { CoordinateSelectionSection } from './components';

// Default coordinates (you can change these to your preferred default location)
const DEFAULT_COORDINATES = {
  latitude: 52.0,
  longitude: 5.0,
};

const AddDiveSiteScreen = () => {
  const [diveSiteName, setDiveSiteName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedCoordinate, setSelectedCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: DEFAULT_COORDINATES.latitude,
    longitude: DEFAULT_COORDINATES.longitude,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const { diveSites, createDiveSite } = useSyncedData();

  // Get current location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;

          // Set initial region to current location
          setInitialRegion({
            latitude,
            longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });

          // Set current location as default coordinates
          setLatitude(latitude.toString());
          setLongitude(longitude.toString());
          setSelectedCoordinate({ latitude, longitude });
        } else {
          // Use default coordinates if permission denied
          setLatitude(DEFAULT_COORDINATES.latitude.toString());
          setLongitude(DEFAULT_COORDINATES.longitude.toString());
          setSelectedCoordinate(DEFAULT_COORDINATES);
        }
      } catch (error) {
        // Use default coordinates on error
        setLatitude(DEFAULT_COORDINATES.latitude.toString());
        setLongitude(DEFAULT_COORDINATES.longitude.toString());
        setSelectedCoordinate(DEFAULT_COORDINATES);
      }
    };

    initializeLocation();
  }, []);

  // Prepare valid sites for map markers
  const validSites = useMemo(() => {
    let diveSitesData: any[] = [];

    if (diveSites) {
      if (typeof diveSites === 'object' && !Array.isArray(diveSites)) {
        diveSitesData = Object.values(diveSites).filter(
          (site) => site !== null && site !== undefined
        );
      } else if (Array.isArray(diveSites)) {
        diveSitesData = diveSites;
      }
    }

    return (
      diveSitesData
        ?.filter((site: DiveSite) => hasValidCoordinates(site))
        .map((site: DiveSite) => ({
          type: 'Feature',
          id: site.id,
          properties: {
            id: site.id,
            name: site.name,
          },
          geometry: {
            type: 'Point',
            coordinates: [site.longitude!, site.latitude!],
          },
        })) || []
    );
  }, [diveSites]);

  /**
   * Handle location selection from Google Places autocomplete
   */
  const handleSuggestionSelect = useCallback(async (suggestion: any) => {
    try {
      const apiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        Alert.alert('Error', 'Google Maps API key not configured.');
        return;
      }

      // Fetch place details to get coordinates
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=${apiKey}`;
      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const latitude = parseFloat(lat.toString());
        const longitude = parseFloat(lng.toString());

        if (isNaN(latitude) || isNaN(longitude)) {
          Alert.alert('Error', 'Invalid coordinates received.');
          return;
        }

        // Update all location data
        setDiveSiteName(suggestion.description);
        setLatitude(latitude.toString());
        setLongitude(longitude.toString());
        setSelectedCoordinate({ latitude, longitude });

        // Focus map on selected location
        setInitialRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        Alert.alert(
          'Location Selected',
          `"${suggestion.description}" has been set on the map`
        );
      } else {
        Alert.alert('Error', 'Could not fetch location details.');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not fetch location details.');
    }
  }, []);

  /**
   * Handle map press to select coordinates
   */
  const handleMapPress = useCallback((event: any) => {
    // Extract coordinates from different event structures
    let coordinate;
    if (event?.nativeEvent?.coordinate) {
      coordinate = event.nativeEvent.coordinate;
    } else if (event?.coordinate) {
      coordinate = event.coordinate;
    } else if (event?.coordinates) {
      coordinate = event.coordinates;
    } else {
      return;
    }

    setLatitude(coordinate.latitude.toString());
    setLongitude(coordinate.longitude.toString());
    setSelectedCoordinate(coordinate);
  }, []);

  /**
   * Handle marker drag
   */
  const handleMarkerDragEnd = useCallback((event: any) => {
    let coordinate;
    if (event?.nativeEvent?.coordinate) {
      coordinate = event.nativeEvent.coordinate;
    } else if (event?.coordinate) {
      coordinate = event.coordinate;
    } else if (event?.coordinates) {
      coordinate = event.coordinates;
    } else {
      return;
    }

    setLatitude(coordinate.latitude.toString());
    setLongitude(coordinate.longitude.toString());
    setSelectedCoordinate(coordinate);
  }, []);

  /**
   * Validate and submit form
   */
  const handleSubmit = useCallback(async () => {
    // Validation
    const errors: string[] = [];

    if (!diveSiteName.trim()) {
      errors.push('Dive site name is required');
    }

    if (!latitude.trim() || !longitude.trim()) {
      errors.push('Please select a location on the map');
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      errors.push('Invalid coordinates');
    }

    if (lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180');
    }

    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    try {
      createDiveSite({
        name: diveSiteName,
        latitude: lat,
        longitude: lng,
        osm_id: null,
      });

      Alert.alert('Success', 'Dive site added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add dive site. Please try again.');
    }
  }, [diveSiteName, latitude, longitude, createDiveSite]);

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled}
        nestedScrollEnabled={true}
      >
        <ScreenHeader
          title="Add New Dive Site"
          onBackPress={() => router.back()}
          onActionPress={handleSubmit}
          actionText="Save"
          showActionButton={true}
        />

        <View style={styles.content}>
          {/* Search for location */}
          <AutocompleteField
            label="Search Location"
            value={diveSiteName}
            onChangeText={setDiveSiteName}
            placeholder="Search for dive site location"
            required
            onSuggestionSelect={handleSuggestionSelect}
          />

          {/* Map for coordinate selection */}
          <CoordinateSelectionSection
            isSelectingCoordinates={true}
            setIsSelectingCoordinates={() => {}}
            validSites={validSites}
            initialRegion={initialRegion}
            handleMapPress={handleMapPress}
            handleMarkerDragEnd={handleMarkerDragEnd}
            selectedCoordinate={selectedCoordinate}
            onMapGestureBegin={() => setScrollEnabled(false)}
            onMapGestureEnd={() => setScrollEnabled(true)}
          />

          {/* Display selected coordinates */}
          {/* {latitude && longitude && (
            <View style={styles.coordinatesDisplay}>
              <Text style={styles.coordinatesTitle}>Selected Location:</Text>
              <Text style={styles.coordinateText}>
                Latitude: {parseFloat(latitude).toFixed(6)}
              </Text>
              <Text style={styles.coordinateText}>
                Longitude: {parseFloat(longitude).toFixed(6)}
              </Text>
            </View>
          )} */}

          {/* Instructions */}
          {/* <View style={styles.instructions}>
            <Text style={styles.instructionsText}>
              • Search for a location using the search bar above
            </Text>
            <Text style={styles.instructionsText}>
              • Or tap anywhere on the map to select coordinates
            </Text>
            <Text style={styles.instructionsText}>
              • Long press and drag the marker to adjust position
            </Text>
          </View> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  container: {
    flexGrow: 1,
    paddingBottom: 40,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    padding: DIMENSIONS.PADDING_HORIZONTAL,
  },
  coordinatesDisplay: {
    backgroundColor: COLORS.SURFACE,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_SECONDARY,
  },
  coordinatesTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
    marginBottom: 8,
  },
  coordinateText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    marginBottom: 4,
  },
  instructions: {
    backgroundColor: COLORS.SURFACE,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER_SECONDARY,
  },
  instructionsText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    marginBottom: 4,
  },
});

export default AddDiveSiteScreen;
