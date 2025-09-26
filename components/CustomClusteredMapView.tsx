import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import Supercluster, { PointFeature } from 'supercluster';

interface ClusteredMapViewProps {
  style?: any;
  data: any[];
  initialRegion: Region;
  renderMarker: (data: any) => React.ReactNode;
  renderCluster?: (cluster: any, onPress: () => void) => React.ReactNode;
  clusteringEnabled?: boolean;
  onClusterPress?: (clusterId: string, children: any[]) => void;
  onPress?: (event: any) => void;
  onMarkerDragEnd?: (event: any) => void;
  selectedCoordinate?: { latitude: number; longitude: number } | null; // Add selectedCoordinate prop
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
  selectedCoordinate, // Add selectedCoordinate prop
}: ClusteredMapViewProps) => {
  // console.log('CustomClusteredMapView called with data length:', data?.length, 'initialRegion:', initialRegion, 'clusteringEnabled:', clusteringEnabled);
  const [clusters, setClusters] = useState<any[]>([]);
  const [region, setRegion] = useState<Region>(initialRegion);
  const mapRef = useRef<MapView>(null);
  const superclusterRef = useRef<Supercluster | null>(null);

  // Initialize Supercluster
  useEffect(() => {
    // console.log('CustomClusteredMapView useEffect called with data:', data?.length, 'clusteringEnabled:', clusteringEnabled);
    if (data && data.length > 0 && clusteringEnabled) {
      const points = data
        .filter(item => 
          item.geometry && 
          item.geometry.coordinates && 
          Array.isArray(item.geometry.coordinates) &&
          item.geometry.coordinates.length >= 2 &&
          typeof item.geometry.coordinates[0] === 'number' &&
          typeof item.geometry.coordinates[1] === 'number'
        )
        .map(item => ({
          type: 'Feature' as const,
          properties: {
            ...item.properties,
            cluster: false,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [
              parseFloat(item.geometry.coordinates[0]),
              parseFloat(item.geometry.coordinates[1])
            ],
          },
        }));

      const supercluster = new Supercluster({
        radius: 40,
        maxZoom: 20,
        minZoom: 0,
      });

      supercluster.load(points as PointFeature<any>[]);
      superclusterRef.current = supercluster;
      
      updateClusters(supercluster, region);
    } else {
      // If clustering is disabled or no data, show all markers directly
      // Ensure data is in the correct format for rendering
      // console.log('Setting clusters directly (no clustering):', data?.length);
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
  const updateClusters = (supercluster: Supercluster, currentRegion: Region) => {
    // console.log('updateClusters called with region:', currentRegion);
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
      // console.log('Generated clusters:', newClusters.length);
      setClusters(newClusters);
    } catch (error) {
      // console.warn('Error updating clusters:', error);
      setClusters(data);
    }
  };

  // Handle region changes
  const onRegionChangeComplete = (newRegion: Region) => {
    // console.log('onRegionChangeComplete called with new region:', newRegion);
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

  // Render markers or clusters
  const renderMarkers = () => {
    // console.log('renderMarkers called with clusters:', clusters?.length);
    if (!clusters) return null;
    
    const markers = [];
    
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      // console.log(`Processing cluster ${i}:`, cluster);
      
      if (!cluster || !cluster.geometry || !cluster.geometry.coordinates) {
        // console.log(`Skipping cluster ${i} due to missing geometry or coordinates`);
        continue;
      }
      
      const coordinates = cluster.geometry.coordinates;
      
      // Validate coordinates
      if (!Array.isArray(coordinates) || coordinates.length < 2 || 
          typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
        // console.log(`Skipping cluster ${i} due to invalid coordinates`);
        continue;
      }
      
      const longitude = coordinates[0];
      const latitude = coordinates[1];
      
      // Check if it's a cluster
      if (cluster.properties && cluster.properties.cluster && clusteringEnabled) {
        // console.log(`Rendering cluster ${i}`);
        if (renderCluster) {
          // For custom renderCluster, we call it directly
          const clusterElement = renderCluster(cluster, () => handleClusterPress(cluster));
          if (clusterElement) {
            // Ensure the cluster element has a key prop
            const keyedClusterElement = React.cloneElement(clusterElement as React.ReactElement, {
              key: `cluster-${cluster.properties.cluster_id || i}`
            });
            markers.push(keyedClusterElement);
          }
        } else {
          // Default cluster rendering
          markers.push(
            <Marker
              key={`cluster-${cluster.properties.cluster_id || i}`}
              coordinate={{ latitude, longitude }}
              onPress={() => handleClusterPress(cluster)}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#007AFF',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}>
                  {cluster.properties.point_count}
                </Text>
              </View>
            </Marker>
          );
        }
      } else {
        // Render individual marker
        // console.log(`Rendering individual marker ${i}`);
        const markerElement = renderMarker(cluster);
        if (markerElement) {
          // Ensure the marker element has a key prop
          const keyedMarkerElement = React.cloneElement(markerElement as React.ReactElement, {
            key: `marker-${cluster.properties?.id || cluster.id || i}`
          });
          markers.push(keyedMarkerElement);
        }
      }
    }
    
    // Render draggable marker when coordinates are selected
    if (selectedCoordinate) {
      markers.push(
        <Marker
          key="selected-marker"
          coordinate={{
            latitude: selectedCoordinate.latitude,
            longitude: selectedCoordinate.longitude,
          }}
          title="Selected Location"
          pinColor="#FF0000"
          draggable={true}
          onDragEnd={onMarkerDragEnd}
        />
      );
    }
    
    // console.log('Returning markers:', markers.length);
    return markers;
  };

  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={initialRegion}
      onRegionChangeComplete={onRegionChangeComplete}
      onPress={onPress}
      showsUserLocation={true}
      showsMyLocationButton={true}
      showsCompass={true}
      showsScale={true}
      showsBuildings={false}
      showsTraffic={false}
      showsIndoors={false}
      toolbarEnabled={true}
      loadingEnabled={true}
      loadingBackgroundColor="#1a1a1a"
      loadingIndicatorColor="#007AFF"
    >
      {renderMarkers()}
    </MapView>
  );
};

export default CustomClusteredMapView;