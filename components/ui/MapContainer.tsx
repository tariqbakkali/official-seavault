import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY } from '@/constants';
import CustomClusteredMapView from '@/components/CustomClusteredMapView';

interface MapContainerProps {
  data: any[];
  initialRegion: any;
  renderMarker: (data: any) => any; // Return marker data object instead of React component
  clusteringEnabled?: boolean;
  onPress?: (event: any) => void;
  onMarkerDragEnd?: (event: any) => void;
  selectedCoordinate?: { latitude: number; longitude: number } | null;
  style?: object;
  helperText?: string;
  onMapGestureBegin?: () => void; // Add gesture control props
  onMapGestureEnd?: () => void;   // Add gesture control props
  isMarkerDraggable?: boolean; // Add draggable marker support
}

/**
 * Reusable map container component with consistent styling
 */
const MapContainer: React.FC<MapContainerProps> = ({
  data,
  initialRegion,
  renderMarker,
  clusteringEnabled = true,
  onPress,
  onMarkerDragEnd,
  selectedCoordinate,
  style,
  helperText,
  onMapGestureBegin,
  onMapGestureEnd,
  isMarkerDraggable = false // Default to false for backward compatibility
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

  console.log('[DEBUG] MapContainer: Received props', { data, initialRegion, selectedCoordinate, clusteringEnabled });
  return (
    <View style={[styles.container, style]}>
      <View 
        style={styles.mapWrapper}
        // These handlers will help us detect when the user is interacting with the map
        onStartShouldSetResponder={() => {
          // Notify parent that map interaction has started
          if (onMapGestureBegin) {
            onMapGestureBegin();
          }
          return false; // Don't capture the responder, just notify
        }}
        onResponderRelease={() => {
          // End gesture safely
          endGesture();
        }}
        onResponderTerminate={() => {
          // End gesture safely
          endGesture();
        }}
        // Add additional handlers to ensure cleanup
        onTouchEnd={() => {
          // End gesture safely
          endGesture();
        }}
      >
        <CustomClusteredMapView
          key={selectedCoordinate ? `${selectedCoordinate.latitude}-${selectedCoordinate.longitude}` : 'no-selection'}
          style={styles.map}
          data={data}
          initialRegion={initialRegion}
          renderMarker={renderMarker}
          clusteringEnabled={clusteringEnabled && data.length > 10}
          onPress={onPress}
          onMarkerDragEnd={onMarkerDragEnd}
          selectedCoordinate={selectedCoordinate}
          onMapGestureBegin={onMapGestureBegin}
          onMapGestureEnd={onMapGestureEnd}
          isMarkerDraggable={isMarkerDraggable}
        />
      </View>
      {helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  mapWrapper: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  helperText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
    padding: 8,
    backgroundColor: '#1a1a1a',
  },
});

export default MapContainer;