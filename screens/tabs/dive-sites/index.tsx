import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAddDiveSite } from '@/hooks/useAddDiveSite';
import { useDiveSites } from '@/hooks/useDiveSites';
import { hasValidCoordinates } from '@/utils/diveSiteUtils';
import FormField from '@/components/forms/FormField';
import FormSection from '@/components/ui/FormSection';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { DiveSite } from '@/types/database';
import { CoordinateSelectionSection, ManualCoordinateEntrySection } from './components';

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