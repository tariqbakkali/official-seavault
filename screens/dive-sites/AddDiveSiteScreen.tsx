import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAddDiveSite } from '@/hooks/useAddDiveSite';
import { useDiveSites } from '@/hooks/useDiveSites';
import { hasValidCoordinates } from '@/utils/diveSiteUtils';
import FormField from '@/components/forms/FormField';
import MapToggleButton from '@/components/ui/MapToggleButton';
import FormSection from '@/components/ui/FormSection';
import ScreenHeader from '@/components/ui/ScreenHeader';
import MapContainer from '@/components/ui/MapContainer';
import DiveSiteMarker from '@/components/DiveSiteMarker';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { DiveSite } from '@/types/database';

const AddDiveSiteScreen = () => {
  const {
    diveSiteName,
    setDiveSiteName,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    isSelectingCoordinates,
    setIsSelectingCoordinates,
    handleCoordinateSelect,
    handleSubmit,
    validationErrors
  } = useAddDiveSite();
  
  const { diveSites } = useDiveSites();
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);

  // Prepare data for clustering - SuperCluster expects GeoJSON format
  // Filter out sites without valid coordinates
  const validSites = useMemo(() => {
    return diveSites
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

  // Render function for individual markers
  const renderMarker = (data: any) => {
    // Add safety checks for marker data
    if (!data || !data.geometry || !data.geometry.coordinates || 
        !Array.isArray(data.geometry.coordinates) || 
        data.geometry.coordinates.length < 2) {
      return null;
    }
    
    const lat = data.geometry.coordinates[1];
    const lng = data.geometry.coordinates[0];
    
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return null;
    }
    
    return (
      <DiveSiteMarker
        id={data.properties.id}
        name={data.properties.name}
        latitude={lat}
        longitude={lng}
        pinColor="#007AFF"
      />
    );
  };

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
  const getCoordinateError = () => validationErrors.find(error => error.includes('coordinate'));

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
          <FormSection title="Select Location on Map">
            <MapToggleButton 
              isSelecting={isSelectingCoordinates}
              onPress={() => setIsSelectingCoordinates(!isSelectingCoordinates)}
            />
            
            <MapContainer
              data={validSites}
              initialRegion={initialRegion}
              renderMarker={renderMarker}
              clusteringEnabled={validSites.length > 5}
              onPress={handleMapPress}
              onMarkerDragEnd={handleMarkerDragEnd}
              selectedCoordinate={selectedCoordinate}
              helperText={isSelectingCoordinates ? "Tap on the map above to select the dive site location. The coordinates will be filled automatically." : undefined}
            />
          </FormSection>
          
          {/* Manual Coordinate Entry */}
          <FormSection title="Or Enter Coordinates Manually">
            <FormField
              label="Latitude"
              value={latitude}
              onChangeText={setLatitude}
              placeholder="Enter latitude (e.g., 52.4509572)"
              keyboardType="numeric"
              error={getCoordinateError() && validationErrors.find(error => error.includes('Latitude'))}
            />
            
            <FormField
              label="Longitude"
              value={longitude}
              onChangeText={setLongitude}
              placeholder="Enter longitude (e.g., 4.8854407)"
              keyboardType="numeric"
              error={getCoordinateError() && validationErrors.find(error => error.includes('Longitude'))}
            />
            
            <Text style={styles.helperText}>
              Note: Coordinates are required to add a new dive site to the map
            </Text>
          </FormSection>
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