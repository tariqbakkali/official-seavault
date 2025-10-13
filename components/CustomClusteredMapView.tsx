import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { GoogleMaps, AppleMaps } from 'expo-maps';
import Supercluster from 'supercluster';

interface ClusteredMapViewProps {
  style?: any;
  data: any[];
  initialRegion: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  renderMarker: (data: any) => any; // Return marker data object instead of React component
  renderCluster?: (cluster: any, onPress: () => void) => any; // Return marker data object instead of React component
  clusteringEnabled?: boolean;
  onClusterPress?: (clusterId: string, children: any[]) => void;
  onPress?: (event: any) => void;
  onMarkerDragEnd?: (event: any) => void;
  selectedCoordinate?: { latitude: number; longitude: number } | null;
}

const CustomClusteredMapView = ({
  style,
  data,
  initialRegion,
  renderMarker,
  renderCluster,
  clusteringEnabled = true,
  onClusterPress,
  onPress,
  onMarkerDragEnd,
  selectedCoordinate,
}: ClusteredMapViewProps) => {
  // For web and all platforms, use expo-maps directly with basic implementation
  
  const [clusters, setClusters] = useState<any[]>([]);
  const [region, setRegion] = useState(initialRegion);
  const superclusterRef = useRef<Supercluster | null>(null);
  const [mapKey, setMapKey] = useState(0);

  // Platform-specific map view component
  const MapView = Platform.OS === 'android' ? GoogleMaps.View : AppleMaps.View;

  // Force re-render when selectedCoordinate changes
  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, [selectedCoordinate]);

  // Initialize Supercluster
  useEffect(() => {
    if (data && data.length > 0 && clusteringEnabled) {
      const points: Supercluster.PointFeature<any>[] = data
        .filter(item => 
          item.geometry && 
          item.geometry.coordinates && 
          Array.isArray(item.geometry.coordinates) &&
          item.geometry.coordinates.length >= 2 &&
          typeof item.geometry.coordinates[0] === 'number' &&
          typeof item.geometry.coordinates[1] === 'number'
        )
        .map(item => ({
          type: 'Feature',
          properties: {
            ...item.properties,
            cluster: false,
          },
          geometry: {
            type: 'Point',
            coordinates: [
              parseFloat(item.geometry.coordinates[0]),
              parseFloat(item.geometry.coordinates[1])
            ],
          },
        }));

      const supercluster = new Supercluster({
        radius: 60, // Increased cluster radius for better grouping
        maxZoom: 20,
        minZoom: 0,
        extent: 512, // Tile extent (default is 512)
        nodeSize: 64, // Size of the KD-tree leaf node (default is 64)
      });

      supercluster.load(points);
      superclusterRef.current = supercluster;
      
      updateClusters(supercluster, region);
    } else {
      // If clustering is disabled or no data, show all markers directly
      if (data && data.length > 0) {
        // Make sure all data items have the required structure
        const formattedData = data.map((item, index) => {
          // If it's already properly formatted, return as is
          if (item.geometry && item.properties) {
            return item;
          }
          // Otherwise, try to format it properly
          return {
            type: 'Feature',
            id: item.id || item.properties?.id || `item-${index}`,
            properties: {
              id: item.id || item.properties?.id || `item-${index}`,
              name: item.name || item.properties?.name || 'Unknown Site',
              ...item.properties
            },
            geometry: {
              type: 'Point',
              coordinates: item.geometry?.coordinates || [
                item.longitude !== undefined ? item.longitude : 0,
                item.latitude !== undefined ? item.latitude : 0
              ]
            }
          };
        });
        setClusters(formattedData);
      } else {
        setClusters([]);
      }
    }
  }, [data, clusteringEnabled, region]);

  // Update clusters when region changes
  const updateClusters = (supercluster: Supercluster, currentRegion: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => {
    if (!supercluster || !currentRegion) return;
    
    const bbox: [number, number, number, number] = [
      currentRegion.longitude - currentRegion.longitudeDelta / 2,
      currentRegion.latitude - currentRegion.latitudeDelta / 2,
      currentRegion.longitude + currentRegion.longitudeDelta / 2,
      currentRegion.latitude + currentRegion.latitudeDelta / 2,
    ];
    
    // Calculate zoom level - adjusted for better clustering at country level
    const zoom = Math.max(0, Math.min(20, Math.round(Math.log(360 / currentRegion.longitudeDelta) / Math.LN2)));
    
    try {
      const newClusters = supercluster.getClusters(bbox, zoom);
      setClusters(newClusters);
    } catch (error) {
      console.warn('Error updating clusters:', error);
      setClusters(data);
    }
  };

  // Handle region changes
  const handleRegionChange = (newRegion: any) => {
    setRegion(newRegion);
    if (superclusterRef.current && clusteringEnabled) {
      updateClusters(superclusterRef.current, newRegion);
    }
  };

  // Handle cluster press
  const handleClusterPress = (cluster: any) => {
    if (!superclusterRef.current || !onClusterPress) return;
    
    if (cluster.properties && cluster.properties.cluster) {
      const leaves = superclusterRef.current.getLeaves(
        cluster.properties.cluster_id,
        Infinity
      );
      onClusterPress(cluster.properties.cluster_id, leaves);
    }
  };

  // Convert initial region to camera position
  const cameraPosition = selectedCoordinate ? {
    coordinates: {
      latitude: selectedCoordinate.latitude,
      longitude: selectedCoordinate.longitude,
    },
    zoom: 15, // Zoom in when a specific location is selected
  } : {
    coordinates: {
      latitude: initialRegion.latitude,
      longitude: initialRegion.longitude,
    },
    zoom: 10, // Adjust as needed
  };

  // Convert clusters to markers for expo-maps
  const mapMarkers = clusters.map((cluster, index) => {
    if (!cluster || !cluster.geometry || !cluster.geometry.coordinates) {
      return null;
    }
    
    const coordinates = cluster.geometry.coordinates;
    
    // Validate coordinates
    if (!Array.isArray(coordinates) || coordinates.length < 2 || 
        typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
      return null;
    }
    
    const longitude = coordinates[0];
    const latitude = coordinates[1];
    
    // Check if it's a cluster
    if (cluster.properties && cluster.properties.cluster && clusteringEnabled) {
      // For clusters, we'll use a special marker to indicate it's a cluster
      const pointCount = cluster.properties.point_count || 0;
      return {
        id: `cluster-${cluster.properties.cluster_id || index}`,
        coordinates: { latitude, longitude },
        title: `${pointCount} dive sites`,
        // Different color for clusters
        color: '#FF9500', // Orange color for clusters
      };
    } else {
      // Render individual marker using the renderMarker function
      const markerData = renderMarker(cluster);
      if (markerData) {
        return {
          id: markerData.id || cluster.properties?.id || cluster.id || `marker-${index}`,
          coordinates: { 
            latitude: markerData.coordinates?.latitude || latitude, 
            longitude: markerData.coordinates?.longitude || longitude 
          },
          title: markerData.title || cluster.properties?.name || cluster.name || 'Dive Site',
          color: markerData.color || '#007AFF', // Blue color for individual sites
        };
      }
      // Fallback marker data
      return {
        id: cluster.properties?.id || cluster.id || `marker-${index}`,
        coordinates: { latitude, longitude },
        title: cluster.properties?.name || cluster.name || 'Dive Site',
        color: '#007AFF', // Blue color for individual sites
      };
    }
  }).filter(marker => marker !== null);

  // Add selected coordinate marker if present
  if (selectedCoordinate) {
    // Validate the selected coordinate
    if (typeof selectedCoordinate.latitude === 'number' && typeof selectedCoordinate.longitude === 'number') {
      const selectedMarker = {
        id: "selected-marker",
        coordinates: selectedCoordinate,
        title: "Selected Location",
        color: '#FF3B30', // Red color for selected location
        draggable: true, // Make the selected marker draggable
      };
      mapMarkers.push(selectedMarker);
    }
  }

  // Validate markers before passing to map component
  const validMarkers = mapMarkers.filter(marker => {
    if (!marker) return false;
    if (!marker.coordinates) return false;
    if (typeof marker.coordinates.latitude !== 'number' || typeof marker.coordinates.longitude !== 'number') {
      console.warn('Invalid marker coordinates', marker);
      return false;
    }
    return true;
  });

  return (
    <View style={style}>
      <MapView
        key={mapKey}
        style={{ flex: 1 }}
        cameraPosition={cameraPosition}
        markers={validMarkers}
        onMapClick={onPress}
        onMarkerClick={(event) => {
          // Find the marker that was clicked
          const clickedMarker = validMarkers.find(marker => marker.id === event.id);
          if (clickedMarker) {
            // Check if it's a cluster marker
            if (clickedMarker.id.startsWith('cluster-')) {
              // Find the cluster data
              const clusterIndex = clickedMarker.id.split('-')[1];
              const cluster = clusters.find(c => 
                c.properties && c.properties.cluster_id && 
                c.properties.cluster_id.toString() === clusterIndex
              );
              if (cluster) {
                handleClusterPress(cluster);
              }
            } else if (clickedMarker.id === "selected-marker" && onMarkerDragEnd) {
              // Handle drag end for selected marker
              // Note: expo-maps doesn't directly support onMarkerDragEnd, 
              // but we can simulate it by handling map clicks when dragging ends
            }
            // For individual markers, call the onPress handler if provided
            else if (onPress) {
              // Create a proper event object for the onPress handler
              const eventObject = {
                nativeEvent: {
                  coordinate: clickedMarker.coordinates,
                  id: clickedMarker.id,
                }
              };
              onPress(eventObject);
            }
          }
        }}
      />
    </View>
  );
};

export default CustomClusteredMapView;