import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  helperText
}) => {
  console.log('[DEBUG] MapContainer: Received props', { data, initialRegion, selectedCoordinate, clusteringEnabled });
  return (
    <View style={[styles.container, style]}>
      <View 
        style={styles.mapWrapper}
        // Prevent parent ScrollView from intercepting touch events
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onStartShouldSetResponderCapture={() => false}
        onMoveShouldSetResponderCapture={() => false}
        // Ensure the map exclusively handles all touch events
        onResponderTerminationRequest={() => false}
        onResponderGrant={() => true}
        onResponderMove={() => true}
        onResponderRelease={() => true}
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
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
    padding: 8,
    backgroundColor: '#1a1a1a',
  },
});

export default MapContainer;