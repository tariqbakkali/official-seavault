import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSyncedData } from '@/hooks/useSyncedData';
import { hasValidCoordinates } from '@/utils/diveSiteUtils';
import FormField from '@/components/forms/FormField';
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
  
  const { diveSites, createDiveSite } = useSyncedData();

  // Prepare data for clustering - SuperCluster expects GeoJSON format
  // Filter out sites without valid coordinates
  const validSites = useMemo(() => {
    const diveSitesData = diveSites.get() || [];
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

  // Calculate initial region focused on Netherlands shores
  const initialRegion = {
    latitude: 52,
    longitude: 5,
    latitudeDelta: 5,
    longitudeDelta: 5,
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
      <ScrollView style={styles.container}>
        <ScreenHeader 
          title="Add New Dive Site"
          onBackPress={() => router.back()}
          onActionPress={handleSubmit}
          actionText="Save"
          showActionButton={true}
        />
        
        <View style={styles.content}>
          {/* Dive Site Name */}
          <FormSection title="">
            <FormField
              label="Dive Site Name"
              value={diveSiteName}
              onChangeText={setDiveSiteName}
              placeholder="Enter dive site name"
              required
              error={getNameError()}
            />
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
          
          {/* Manual Coordinate Entry */}
          <ManualCoordinateEntrySection
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
            validationErrors={validationErrors}
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
  helperText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
    fontStyle: 'italic',
    marginTop: DIMENSIONS.SPACE_XS,
  },
});

export default AddDiveSiteScreen;