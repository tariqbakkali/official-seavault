import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapToggleButton from '@/components/ui/MapToggleButton';
import MapContainer from '@/components/ui/MapContainer';
import FormSection from '@/components/ui/FormSection';
import { DiveSite } from '@/types/database';
import { hasValidCoordinates } from '@/utils/diveSiteUtils';
import DiveSiteMarker from '@/components/DiveSiteMarker';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface CoordinateSelectionSectionProps {
  isSelectingCoordinates: boolean;
  setIsSelectingCoordinates: (value: boolean) => void;
  validSites: any[];
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  handleMapPress: (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
  handleMarkerDragEnd: (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
  selectedCoordinate: { latitude: number; longitude: number } | null;
}

const CoordinateSelectionSection: React.FC<CoordinateSelectionSectionProps> = ({
  isSelectingCoordinates,
  setIsSelectingCoordinates,
  validSites,
  initialRegion,
  handleMapPress,
  handleMarkerDragEnd,
  selectedCoordinate
}) => {
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

  return (
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
  );
};

export default CoordinateSelectionSection;