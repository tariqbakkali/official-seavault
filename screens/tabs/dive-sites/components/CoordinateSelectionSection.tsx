import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapToggleButton from '@/components/ui/MapToggleButton';
import MapContainer from '@/components/ui/MapContainer';
import FormSection from '@/components/ui/FormSection';
import { DiveSite } from '@/types/database';
import { hasValidCoordinates } from '@/utils/diveSiteUtils';
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
  onMapGestureBegin?: () => void; // Add gesture control props
  onMapGestureEnd?: () => void;   // Add gesture control props
}

const CoordinateSelectionSection: React.FC<CoordinateSelectionSectionProps> = ({
  isSelectingCoordinates,
  setIsSelectingCoordinates,
  validSites,
  initialRegion,
  handleMapPress,
  handleMarkerDragEnd,
  selectedCoordinate,
  onMapGestureBegin,
  onMapGestureEnd
}) => {
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
    };
  }, []);
  
  // Function to safely end gestures
  const endGesture = () => {
    // Clear any existing timeout
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
    }
    
    // Set a timeout to ensure the gesture ends
    gestureTimeoutRef.current = setTimeout(() => {
      if (onMapGestureEnd) {
        onMapGestureEnd();
      }
    }, 100); // Small delay to ensure proper cleanup
  };

  // Render function for individual markers - return marker data instead of component
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
    
    // Return marker data object for CustomClusteredMapView
    return {
      id: data.properties.id,
      coordinates: { latitude: lat, longitude: lng },
      title: data.properties.name,
      color: "#007AFF"
    };
  };

  // CoordinateSelectionSection: Passing selectedCoordinate to MapContainer

  return (
    <FormSection title="Location">
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
        helperText={isSelectingCoordinates ? "Tap on the map to select the dive site location" : "Press the button above to select coordinates from the map"}
        onMapGestureBegin={onMapGestureBegin}
        onMapGestureEnd={endGesture}
        isMarkerDraggable={true} // Enable draggable markers
      />
    </FormSection>
  );
};

export default CoordinateSelectionSection;