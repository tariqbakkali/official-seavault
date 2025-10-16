import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
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
  // State to control ScrollView scrolling
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const coordinatesRef = useRef<{ latitude: string; longitude: string }>({ latitude: '', longitude: '' });
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // Update coordinates ref when latitude or longitude changes
  useEffect(() => {
    coordinatesRef.current = { latitude, longitude };
    // AddDiveSiteScreen: coordinatesRef updated
  }, [latitude, longitude]);
  
  // Debug state changes
  useEffect(() => {
    // AddDiveSiteScreen: diveSiteName changed
  }, [diveSiteName]);
  
  useEffect(() => {
    // AddDiveSiteScreen: latitude changed
  }, [latitude]);
  
  useEffect(() => {
    // AddDiveSiteScreen: longitude changed
  }, [longitude]);
  
  useEffect(() => {
    // AddDiveSiteScreen: selectedCoordinate changed
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
    // AddDiveSiteScreen: handleSuggestionSelect called
    try {
      // Get API key from environment
      const apiKey = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        // AddDiveSiteScreen: Google Maps API key not found
        Alert.alert('Error', 'Google Maps API key not configured.');
        return;
      }

      // AddDiveSiteScreen: API key found
      
      // Fetch place details to get coordinates
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=${apiKey}`;
      // AddDiveSiteScreen: Fetching place details
      
      const response = await fetch(detailsUrl);
      const data = await response.json();
      // AddDiveSiteScreen: Place details response received
      
      if (data.result && data.result.geometry && data.result.geometry.location) {
        const { lat, lng } = data.result.geometry.location;
        // AddDiveSiteScreen: Coordinates found in response
        
        // Ensure coordinates are valid numbers
        const latitude = parseFloat(lat.toString());
        const longitude = parseFloat(lng.toString());
        
        // AddDiveSiteScreen: Parsed coordinates
        
        if (isNaN(latitude) || isNaN(longitude)) {
          // AddDiveSiteScreen: Invalid coordinates after parsing
          Alert.alert('Error', 'Invalid coordinates received. Please try another location.');
          return;
        }
        
        // Set the dive site name first
        // AddDiveSiteScreen: Setting dive site name
        setDiveSiteName(suggestion.description);
        // AddDiveSiteScreen: Dive site name set successfully
        
        // Then set the coordinates
        // AddDiveSiteScreen: Setting latitude
        setLatitude(latitude.toString());
        // AddDiveSiteScreen: Latitude set successfully
        
        // AddDiveSiteScreen: Setting longitude
        setLongitude(longitude.toString());
        // AddDiveSiteScreen: Longitude set successfully
        
        // Update the coordinates ref
        coordinatesRef.current = { 
          latitude: latitude.toString(), 
          longitude: longitude.toString() 
        };
        // AddDiveSiteScreen: coordinatesRef updated
        
        // Set the selected coordinate to show the marker on the map
        const coordinate = { latitude, longitude };
        // AddDiveSiteScreen: Setting selected coordinate
        setSelectedCoordinate(coordinate);
        // AddDiveSiteScreen: Selected coordinate set successfully
        
        // Update initial region to focus on the selected location
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        // AddDiveSiteScreen: Setting initial region
        setInitialRegion(newRegion);
        // AddDiveSiteScreen: Initial region set successfully
        
        // Show confirmation
        // AddDiveSiteScreen: Showing success alert
        Alert.alert(
          'Location Found', 
          `Coordinates for "${suggestion.description}" have been set`,
          [{ text: 'OK' }]
        );
        // AddDiveSiteScreen: Success alert shown
      } else {
        // AddDiveSiteScreen: No geometry data found in place details response
        Alert.alert('Error', 'Could not fetch location details. Please try another location.');
      }
    } catch (err) {
      // AddDiveSiteScreen: Error fetching place details
      Alert.alert('Error', 'Could not fetch location details. Please enter coordinates manually.');
    }
    // AddDiveSiteScreen: handleSuggestionSelect completed
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
      
      // Update the coordinates ref
      coordinatesRef.current = { 
        latitude: latitude.toString(), 
        longitude: longitude.toString() 
      };
      // getCurrentLocation: coordinatesRef updated
      
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
      // Error getting current location
      Alert.alert('Error', 'Could not get current location. Please try again.');
    }
  };

  /**
   * Handle coordinate selection from map tap
   */
  const handleCoordinateSelect = useCallback((event: any) => {
    // handleCoordinateSelect: Called with event
    if (isSelectingCoordinates) {
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
        // Could not extract coordinates from event
        return;
      }
      
      // handleCoordinateSelect: Setting latitude
      setLatitude(coordinate.latitude.toString());
      // handleCoordinateSelect: Setting longitude
      setLongitude(coordinate.longitude.toString());
      
      // Update the coordinates ref
      coordinatesRef.current = { 
        latitude: coordinate.latitude.toString(), 
        longitude: coordinate.longitude.toString() 
      };
      // handleCoordinateSelect: coordinatesRef updated
      
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
    // handleSubmit: Called
    // handleSubmit: Current state values
    // handleSubmit: Current ref values
    
    // Get the latest coordinate values from the ref
    const currentLatitude = coordinatesRef.current.latitude;
    const currentLongitude = coordinatesRef.current.longitude;
    const currentDiveSiteName = diveSiteName;
    
    // handleSubmit: Using values
    
    // Create a validation function that uses current values
    const validateCurrentForm = () => {
      const errors: string[] = [];
      
      // Validate dive site name
      if (!currentDiveSiteName.trim()) {
        errors.push('Dive site name is required');
      }
      
      // Validate coordinates
      if (!currentLatitude.trim() || !currentLongitude.trim()) {
        errors.push('Both latitude and longitude coordinates are required');
      }
      
      const lat = parseFloat(currentLatitude);
      const lng = parseFloat(currentLongitude);
      
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
      
      return { isValid: errors.length === 0, errors };
    };
    
    const { isValid, errors } = validateCurrentForm();
    
    if (!isValid) {
      // handleSubmit: Validation failed
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }
    
    try {
      const lat = parseFloat(currentLatitude);
      const lng = parseFloat(currentLongitude);
      
      // handleSubmit: Parsed coordinates
      
      // Create a new dive site using the new Legend-State implementation
      createDiveSite({
        name: currentDiveSiteName,
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
      // Error creating dive site
      Alert.alert('Error', 'Failed to add dive site. Please try again.');
    }
  }, [diveSiteName, createDiveSite]);

  // Handle coordinate selection and update the draggable marker
  const handleMapPress = (event: any) => {
    // handleMapPress: Called with event
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
      // Could not extract coordinates from event
      return;
    }
    
    // handleMapPress: Setting latitude
    setLatitude(coordinate.latitude.toString());
    // handleMapPress: Setting longitude
    setLongitude(coordinate.longitude.toString());
    
    // Update the coordinates ref
    coordinatesRef.current = { 
      latitude: coordinate.latitude.toString(), 
      longitude: coordinate.longitude.toString() 
    };
    // handleMapPress: coordinatesRef updated
    
    // Call handleCoordinateSelect with the proper structure
    const formattedEvent = {
      nativeEvent: {
        coordinate
      }
    };
    handleCoordinateSelect(formattedEvent);
    
    if (isSelectingCoordinates) {
      // handleMapPress: Setting selectedCoordinate
      setSelectedCoordinate(coordinate);
    }
  };

  // Handle marker drag end event
  const handleMarkerDragEnd = (event: any) => {
    // handleMarkerDragEnd: Called with event
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
      // Could not extract coordinates from event
      return;
    }
    
    // handleMarkerDragEnd: Setting latitude
    setLatitude(coordinate.latitude.toString());
    // handleMarkerDragEnd: Setting longitude
    setLongitude(coordinate.longitude.toString());
    // handleMarkerDragEnd: Setting selectedCoordinate
    setSelectedCoordinate(coordinate);
    
    // Update the coordinates ref
    coordinatesRef.current = { 
      latitude: coordinate.latitude.toString(), 
      longitude: coordinate.longitude.toString() 
    };
    // handleMarkerDragEnd: coordinatesRef updated
    
    // Show confirmation that the marker was moved
    Alert.alert(
      'Marker Moved', 
      `New position set\nLatitude: ${coordinate.latitude.toFixed(6)}\nLongitude: ${coordinate.longitude.toFixed(6)}`,
      [{ text: 'OK' }]
    );
  };

  // Function to safely enable scroll
  const enableScroll = () => {
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set a timeout to ensure the scroll is enabled
    scrollTimeoutRef.current = setTimeout(() => {
      setScrollEnabled(true);
    }, 100); // Small delay to ensure proper cleanup
  };

  // Get validation errors for specific fields
  const getNameError = () => validationErrors.find(error => error.includes('name'));

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView 
        style={styles.container} 
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled} // Control scroll behavior
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
          {/* Dive Site Name with Autocomplete */}
          <FormSection title="Dive Site Information">
            <AutocompleteField
              label="Dive Site Name"
              value={diveSiteName}
              onChangeText={(text) => {
                // AddDiveSiteScreen: Autocomplete text changed
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
            // Pass scroll control functions to disable/enable parent scroll
            onMapGestureBegin={() => setScrollEnabled(false)}
            onMapGestureEnd={enableScroll}
          />
          
          {/* Display current coordinates */}
          {(latitude || longitude) ? (
            <View style={styles.coordinatesDisplay}>
              <Text style={styles.coordinatesTitle}>Current Coordinates:</Text>
              <Text style={styles.coordinateText}>Latitude: {latitude || 'Not set'}</Text>
              <Text style={styles.coordinateText}>Longitude: {longitude || 'Not set'}</Text>
            </View>
          ) : null}
          
          {/* Instructions for dragging marker */}
          {selectedCoordinate && (
            <View style={styles.dragInstructions}>
              <Text style={styles.dragInstructionsText}>
                Tip: Long press on the map to move the marker to a new location
              </Text>
            </View>
          )}
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
  dragInstructions: {
    backgroundColor: COLORS.SURFACE,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER_SECONDARY,
  },
  dragInstructionsText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    textAlign: 'center',
  },
  coordinatesDisplay: {
    backgroundColor: COLORS.SURFACE,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER_SECONDARY,
  },
  coordinatesTitle: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  coordinateText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    marginBottom: 2,
  },
});

export default AddDiveSiteScreen;