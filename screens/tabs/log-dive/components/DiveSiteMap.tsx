import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { GoogleMaps, AppleMaps } from 'expo-maps';
import CustomClusteredMapView from '@/components/CustomClusteredMapView';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Database } from '@/types/database';

interface DiveSiteMapProps {
  diveSites: Database['public']['Tables']['dive_sites']['Row'][] | null;
  selectedDiveSiteId: string | null;
  onDeselectDiveSite: () => void;
  onDiveSiteSelect: (siteId: string) => void;
}

const DiveSiteMap: React.FC<DiveSiteMapProps> = ({
  diveSites,
  selectedDiveSiteId,
  onDeselectDiveSite,
  onDiveSiteSelect,
}) => {
  // Helper function to calculate initial region focused on area with most dive sites
  const calculateInitialRegionForDenseArea = (sites: any[]) => {
    // Europe region to show a broader view
    const europeRegion = {
      latitude: 54,
      longitude: 15,
      latitudeDelta: 40,
      longitudeDelta: 40,
    };
    
    if (sites.length === 0) {
      return europeRegion;
    }

    // Check if any sites are in the Netherlands area
    const netherlandsSites = sites.filter(site => {
      const lat = site.geometry.coordinates[1];
      const lng = site.geometry.coordinates[0];
      // Rough bounds for Netherlands: lat 50-54, lng 3-8
      return lat >= 50 && lat <= 54 && lng >= 3 && lng <= 8;
    });

    // If we have sites in Netherlands, still show Europe view to provide context
    if (netherlandsSites.length > 0) {
      return europeRegion;
    }

    // If no sites in Netherlands, still default to Europe view for better context
    return europeRegion;
  };

  return (
    <View style={styles.mapCard}>
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>Dive Site Location</Text>
        {selectedDiveSiteId && (
          <TouchableOpacity 
            style={styles.deselectButton}
            onPress={onDeselectDiveSite}
          >
            <Text style={styles.deselectButtonText}>Deselect</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.mapContainer}>
        {selectedDiveSiteId ? (
          (() => {
            const selectedSite = diveSites?.find(site => site.id === selectedDiveSiteId);
            if (selectedSite && selectedSite.latitude && selectedSite.longitude) {
              // Convert initial region to camera position
              const cameraPosition = {
                coordinates: {
                  latitude: selectedSite.latitude,
                  longitude: selectedSite.longitude,
                },
                zoom: 15, // Zoom in for a single site
              };
              
              // Platform-specific map view
              const MapViewComponent = Platform.OS === 'android' ? GoogleMaps.View : AppleMaps.View;
              
              // Create marker
              const markers = [{
                id: selectedSite.id,
                coordinates: { 
                  latitude: selectedSite.latitude, 
                  longitude: selectedSite.longitude 
                },
                title: selectedSite.name,
              }];
              
              return (
                <MapViewComponent
                  style={styles.map}
                  cameraPosition={cameraPosition}
                  markers={markers}
                  onMarkerClick={() => onDiveSiteSelect(selectedSite.id)}
                />
              );
            } else {
              return (
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapPlaceholderText}>
                    {selectedSite?.name ? `${selectedSite.name} (Location not available)` : "Location not available"}
                  </Text>
                </View>
              );
            }
          })()
        ) : diveSites && diveSites.length > 0 ? (
          (() => {
            // Prepare data for clustering - SuperCluster expects GeoJSON format
            // Filter out sites without valid coordinates
            const validSites = diveSites
              .filter(site => site.latitude !== null && site.longitude !== null && 
                             site.latitude !== undefined && site.longitude !== undefined)
              .map(site => ({
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
              }));

            // Calculate initial region focused on Netherlands shores
            const initialRegion = calculateInitialRegionForDenseArea(validSites);

            // Render function for individual markers
            const renderMarker = (data: any) => {
              // Add safety checks for marker data
              if (!data || !data.geometry || !data.geometry.coordinates || 
                  !Array.isArray(data.geometry.coordinates) || 
                  data.geometry.coordinates.length < 2) {
                return null;
              }
              
              const latitude = data.geometry.coordinates[1];
              const longitude = data.geometry.coordinates[0];
              
              // Validate coordinates
              if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                return null;
              }
              
              // Create marker data
              const markerData = {
                id: data.properties.id,
                title: data.properties.name,
                coordinates: { latitude, longitude },
                onPress: () => onDiveSiteSelect(data.properties.id),
              };
              
              return markerData;
            };

            // Render function for clusters
            const renderCluster = (cluster: any, onPress: () => void) => {
              // Add safety checks for cluster data
              if (!cluster || !cluster.geometry || !cluster.geometry.coordinates || 
                  !Array.isArray(cluster.geometry.coordinates) || 
                  cluster.geometry.coordinates.length < 2) {
                return null;
              }
              
              const latitude = cluster.geometry.coordinates[1];
              const longitude = cluster.geometry.coordinates[0];
              
              // Validate coordinates
              if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                return null;
              }
                
              const pointCount = cluster && cluster.properties && cluster.properties.point_count ? 
                                cluster.properties.point_count : 0;

              // Create marker data for cluster
              const clusterMarkerData = {
                id: `cluster-${cluster.properties?.cluster_id || 'unknown'}`,
                title: `${pointCount} sites`,
                coordinates: { latitude, longitude },
                onPress: onPress,
              };
              
              return clusterMarkerData;
            };

            return (
              <CustomClusteredMapView
                style={styles.map}
                data={validSites}
                initialRegion={initialRegion}
                renderMarker={renderMarker}
                renderCluster={renderCluster}
                clusteringEnabled={validSites.length > 5} // Only enable clustering if there are more than 5 sites
                onClusterPress={(clusterId: string, children: any[]) => {
                  // When a cluster is pressed, show a selection dialog or zoom in
                  try {
                    if (children && children.length > 0) {
                      // If there's only one site in the cluster, select it directly
                      if (children.length === 1) {
                        onDiveSiteSelect(children[0].properties.id);
                      } 
                      // If there are only a few sites (2-5), show selection dialog
                      else if (children.length <= 5) {
                        const siteOptions = children.map((child: any) => ({ text: child.properties.name, onPress: () => onDiveSiteSelect(child.properties.id) }));
                          
                        // Show an alert to let the user choose a dive site
                        Alert.alert(
                          'Select a Dive Site',
                          'Multiple dive sites are clustered here. Please choose one:',
                          [...siteOptions, { text: 'Cancel', style: 'cancel' }]
                        );
                      }
                      // If there are many sites, zoom in
                      else {
                        // Zoom in by reducing the delta values
                        const currentRegion = {
                          latitude: children[0].geometry.coordinates[1],
                          longitude: children[0].geometry.coordinates[0],
                          latitudeDelta: initialRegion.latitudeDelta * 0.5,
                          longitudeDelta: initialRegion.longitudeDelta * 0.5,
                        };
                      }
                    }
                  } catch (error) {
                    console.warn('Error handling cluster press:', error);
                  }
                }}
                onPress={(event: any) => {
                  // Map onPress handler - no longer needed as coordinate selection is in AddDiveSiteScreen
                }}
              />
            );
          })()
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              No dive sites available. Select a dive site to view its location on the map.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapCard: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    marginBottom: DIMENSIONS.SPACE_XL,
    shadowColor: COLORS.TEXT_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  mapTitle: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  deselectButton: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: DIMENSIONS.SPACE_MD,
    paddingVertical: DIMENSIONS.SPACE_XS,
    borderRadius: DIMENSIONS.RADIUS_SM,
  },
  deselectButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  mapContainer: {
    height: 200,
    borderRadius: DIMENSIONS.RADIUS_MD,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER_SECONDARY,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    backgroundColor: COLORS.SURFACE_SECONDARY,
    height: 200,
    borderRadius: DIMENSIONS.RADIUS_MD,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_SECONDARY,
  },
  mapPlaceholderText: {
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    paddingHorizontal: DIMENSIONS.SPACE_LG,
  },
});

export default DiveSiteMap;