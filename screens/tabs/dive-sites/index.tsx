import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useSyncedData } from '@/hooks/useSyncedData';
import { hasValidCoordinates } from '@/utils/diveSiteUtils';
import AutocompleteField from '@/components/forms/AutocompleteField';
import FormSection from '@/components/ui/FormSection';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { DiveSite } from '@/types/database';
import { CoordinateSelectionSection, ManualCoordinateEntrySection } from './components';

const AddDiveSiteScreen = () => {
  const [diveSiteName, setDiveSiteName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isSelectingCoordinates, setIsSelectingCoordinates] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 52,
    longitude: 5,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });
  
  // Debug state changes
  useEffect(() => {
    console.log('[DEBUG] AddDiveSiteScreen: diveSiteName changed to', diveSiteName);
  }, [diveSiteName]);
  
  useEffect(() => {
    console.log('[DEBUG] AddDiveSiteScreen: selectedCoordinate changed to', selectedCoordinate);
  }, [selectedCoordinate]);
  
  const { diveSites, createDiveSite } = useSyncedData();

  // Prepare data for clustering - SuperCluster expects GeoJSON format
  // Filter out sites without valid coordinates
  const validSites = useMemo(() => {
    // Extract the actual data from the observable
    let diveSitesData: any[] = [];
    
    if (diveSites) {
      // If diveSites is an object with ID keys, extract the values
      if (typeof diveSites === 'object' && !Array.isArray(diveSites)) {
        diveSitesData = Object.values(diveSites).filter(site => site !== null && site !== undefined);
      } 
      // If it's already an array, use as is
      else if (Array.isArray(diveSites)) {
        diveSitesData = diveSites;
      }
    }
    
    return diveSitesData
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
          coordinates: [site.longitude!, site.latitude!], // [longitude, latitude]
        },
      })) || [];
  }, [diveSites]);

  /**
   * Handle suggestion selection from Google Places API
   */
  const handleSuggestionSelect = useCallback(async (suggestion: any) => {
    console.log('[DEBUG] AddDiveSiteScreen: handleSuggestionSelect called with', suggestion);
    try {
      // Get API key from environment
      const apiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('[DEBUG] AddDiveSiteScreen: Google Maps API key not found');
        Alert.alert('Error', 'Google Maps API key not configured.');
        return;
      }

      console.log('[DEBUG] AddDiveSiteScreen: API key found, proceeding with place details fetch');
      
      // Fetch place details to get coordinates
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=${apiKey}`;
      console.log('[DEBUG] AddDiveSiteScreen: Fetching place details from', detailsUrl);
      
      const response = await fetch(detailsUrl);
      const data = await response.json();
      console.log('[DEBUG] AddDiveSiteScreen: Place details response received', data);
      
      if (data.result && data.result.geometry && data.result.geometry.location) {
        const { lat, lng } = data.result.geometry.location;
        console.log('[DEBUG] AddDiveSiteScreen: Coordinates found in response', { lat, lng });
        
        // Ensure coordinates are valid numbers
        const latitude = parseFloat(lat.toString());
        const longitude = parseFloat(lng.toString());
        
        console.log('[DEBUG] AddDiveSiteScreen: Parsed coordinates', { latitude, longitude });
        
        if (isNaN(latitude) || isNaN(longitude)) {
          console.error('[DEBUG] AddDiveSiteScreen: Invalid coordinates after parsing', { lat, lng });
          Alert.alert('Error', 'Invalid coordinates received. Please try another location.');
          return;
        }
        
        // Set the dive site name first
        console.log('[DEBUG] AddDiveSiteScreen: Setting dive site name to', suggestion.description);
        setDiveSiteName(suggestion.description);
        console.log('[DEBUG] AddDiveSiteScreen: Dive site name set successfully');
        
        // Then set the coordinates
        console.log('[DEBUG] AddDiveSiteScreen: Setting latitude to', latitude.toString());
        setLatitude(latitude.toString());
        console.log('[DEBUG] AddDiveSiteScreen: Latitude set successfully');
        
        console.log('[DEBUG] AddDiveSiteScreen: Setting longitude to', longitude.toString());
        setLongitude(longitude.toString());
        console.log('[DEBUG] AddDiveSiteScreen: Longitude set successfully');
        
        // Set the selected coordinate to show the marker on the map
        const coordinate = { latitude, longitude };
        console.log('[DEBUG] AddDiveSiteScreen: Setting selected coordinate to', coordinate);
        setSelectedCoordinate(coordinate);
        console.log('[DEBUG] AddDiveSiteScreen: Selected coordinate set successfully');
        
        // Update initial region to focus on the selected location
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        console.log('[DEBUG] AddDiveSiteScreen: Setting initial region to', newRegion);
        setInitialRegion(newRegion);
        console.log('[DEBUG] AddDiveSiteScreen: Initial region set successfully');
        
        // Show confirmation
        console.log('[DEBUG] AddDiveSiteScreen: Showing success alert');
        Alert.alert(
          'Location Found', 
          `Coordinates for "${suggestion.description}" have been set`,
          [{ text: 'OK' }]
        );
        console.log('[DEBUG] AddDiveSiteScreen: Success alert shown');
      } else {
        console.warn('[DEBUG] AddDiveSiteScreen: No geometry data found in place details response', data);
        Alert.alert('Error', 'Could not fetch location details. Please try another location.');
      }
    } catch (err) {
      console.error('[DEBUG] AddDiveSiteScreen: Error fetching place details', err);
      Alert.alert('Error', 'Could not fetch location details. Please enter coordinates manually.');
    }
    console.log('[DEBUG] AddDiveSiteScreen: handleSuggestionSelect completed');
  }, []);

  /**
   * Get user's current location
   */
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      setLatitude(latitude.toString());
      setLongitude(longitude.toString());
      setSelectedCoordinate({ latitude, longitude });
      
      // Update initial region to focus on current location
      setInitialRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
      Alert.alert(
        'Current Location', 
        `Your current location has been set\nLatitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Could not get current location. Please try again.');
    }
  };

  /**
   * Handle coordinate selection from map tap
   */
  const handleCoordinateSelect = useCallback((event: any) => {
    if (isSelectingCoordinates) {
      const { coordinate } = event.nativeEvent;
      setLatitude(coordinate.latitude.toString());
      setLongitude(coordinate.longitude.toString());
      
      // Show confirmation
      Alert.alert(
        'Coordinates Selected', 
        `Latitude: ${coordinate.latitude.toFixed(6)}\nLongitude: ${coordinate.longitude.toFixed(6)}`,
        [{ text: 'OK' }]
      );
    }
  }, [isSelectingCoordinates]);

  /**
   * Validate form data
   */
  const validateForm = useCallback(() => {
    const errors: string[] = [];
    
    // Validate dive site name
    if (!diveSiteName.trim()) {
      errors.push('Dive site name is required');
    }
    
    // Validate coordinates
    if (!latitude.trim() || !longitude.trim()) {
      errors.push('Both latitude and longitude coordinates are required');
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      errors.push('Coordinates must be valid numbers');
    }
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90 degrees');
    }
    
    if (lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180 degrees');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [diveSiteName, latitude, longitude]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }
    
    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      // Create a new dive site using the new Legend-State implementation
      createDiveSite({
        name: diveSiteName,
        latitude: lat,
        longitude: lng,
        osm_id: null
      });
      
      // Since the createDiveSite function doesn't return the created dive site,
      // we'll just show a success message
      Alert.alert(
        'Success', 
        'Dive site added successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating dive site:', error);
      Alert.alert('Error', 'Failed to add dive site. Please try again.');
    }
  }, [diveSiteName, latitude, longitude, validateForm, validationErrors, createDiveSite]);

  // Handle coordinate selection and update the draggable marker
  const handleMapPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    handleCoordinateSelect(event);
    if (isSelectingCoordinates) {
      const { coordinate } = event.nativeEvent;
      setSelectedCoordinate(coordinate);
    }
  };

  // Handle marker drag end event
  const handleMarkerDragEnd = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { coordinate } = event.nativeEvent;
    setLatitude(coordinate.latitude.toString());
    setLongitude(coordinate.longitude.toString());
    setSelectedCoordinate(coordinate);
  };

  // Get validation errors for specific fields
  const getNameError = () => validationErrors.find(error => error.includes('name'));

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView 
        style={styles.container} 
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        nestedScrollEnabled={true}
        // Allow the map to handle gestures by not intercepting them
        onStartShouldSetResponderCapture={(e) => {
          // Allow map gestures to work properly
          return false;
        }}
        // Additional gesture handling for better map interaction
        onMoveShouldSetResponderCapture={() => false}
        onResponderTerminationRequest={() => false}
      >
        <ScreenHeader 
          title="Add New Dive Site"
          onBackPress={() => router.back()}
          onActionPress={handleSubmit}
          actionText="Save"
          showActionButton={true}
        />
        
        <View style={styles.content}>
          {/* Dive Site Name with Autocomplete */}
          <FormSection title="Dive Site Information">
            <AutocompleteField
              label="Dive Site Name"
              value={diveSiteName}
              onChangeText={(text) => {
                console.log('[DEBUG] AddDiveSiteScreen: Autocomplete text changed to', text);
                setDiveSiteName(text);
              }}
              placeholder="Search for dive site location"
              required
              error={getNameError()}
              onSuggestionSelect={handleSuggestionSelect}
            />
            
            <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
              <Text style={styles.currentLocationText}>Use Current Location</Text>
            </TouchableOpacity>
          </FormSection>
          
          {/* Map for Coordinate Selection */}
          <CoordinateSelectionSection
            isSelectingCoordinates={isSelectingCoordinates}
            setIsSelectingCoordinates={setIsSelectingCoordinates}
            validSites={validSites}
            initialRegion={initialRegion}
            handleMapPress={handleMapPress}
            handleMarkerDragEnd={handleMarkerDragEnd}
            selectedCoordinate={selectedCoordinate}
          />
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
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    padding: DIMENSIONS.PADDING_HORIZONTAL,
  },
  currentLocationButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  currentLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddDiveSiteScreen;