import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomClusteredMapView from '@/components/CustomClusteredMapView';

interface MapContainerProps {
  data: any[];
  initialRegion: any;
  renderMarker: (data: any) => React.ReactNode;
  clusteringEnabled?: boolean;
  onPress?: (event: any) => void;
  onMarkerDragEnd?: (event: any) => void;
  selectedCoordinate?: { latitude: number; longitude: number } | null; // Add selectedCoordinate prop
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
  selectedCoordinate, // Add selectedCoordinate prop
  style,
  helperText
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapWrapper}>
        <CustomClusteredMapView
          style={styles.map}
          data={data}
          initialRegion={initialRegion}
          renderMarker={renderMarker}
          clusteringEnabled={clusteringEnabled}
          onPress={onPress}
          onMarkerDragEnd={onMarkerDragEnd}
          selectedCoordinate={selectedCoordinate} // Pass selectedCoordinate prop
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
  },
});

export default MapContainer;