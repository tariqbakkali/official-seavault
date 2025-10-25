import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { GoogleMaps, AppleMaps } from 'expo-maps';
import CustomClusteredMapView, { CustomClusteredMapViewRef } from '@/components/CustomClusteredMapView';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Database } from '@/types/database';

interface DiveSitePickerProps {
  diveSites: Database['public']['Tables']['dive_sites']['Row'][] | null;
  selectedDiveSiteId: string | null;
  onDeselectDiveSite: () => void;
  onDiveSiteSelect: (siteId: string) => void;
  onMapGestureBegin?: () => void;
  onMapGestureEnd?: () => void;
}

const DiveSitePicker: React.FC<DiveSitePickerProps> = ({
  diveSites,
  selectedDiveSiteId,
  onDeselectDiveSite,
  onDiveSiteSelect,
  onMapGestureBegin,
  onMapGestureEnd,
}) => {
  const mapRef = useRef<CustomClusteredMapViewRef>(null);

  // Helper function to calculate initial region based on all dive sites
  const calculateInitialRegionForDenseArea = (sites: any[]) => {
    if (sites.length === 0) {
      // Default to a global view if no sites are available
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 100,
        longitudeDelta: 100,
      };
    }

    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;

    sites.forEach(site => {
      const lat = site.geometry.coordinates[1];
      const lng = site.geometry.coordinates[0];
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Add some padding to the delta
    const latitudeDelta = (maxLat - minLat) * 1.5;
    const longitudeDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latitudeDelta > 0 ? latitudeDelta : 0.1, // Ensure non-zero delta
      longitudeDelta: longitudeDelta > 0 ? longitudeDelta : 0.1, // Ensure non-zero delta
    };
  };

  const handleOpenDiveSitePicker = () => {
    router.push('/modal/dive-site-picker');
  };

  // Platform-specific map view component
  const MapView = Platform.OS === 'android' ? GoogleMaps.View : AppleMaps.View;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dive Site</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.diveSiteSelector}
        onPress={handleOpenDiveSitePicker}
      >
        <Text style={selectedDiveSiteId ? styles.diveSiteSelectedText : styles.diveSitePlaceholderText}>
          {selectedDiveSiteId 
            ? diveSites?.find(site => site.id === selectedDiveSiteId)?.name 
            : "Select a dive site"}
        </Text>
        <Text style={styles.diveSiteSelectorIcon}>›</Text>
      </TouchableOpacity>

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
                  <MapView
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
                    coordinates: [site.longitude, site.latitude], // [longitude, latitude]
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
                  ref={mapRef}
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
                          // Calculate bounding box for the children
                          let minLat = 90;
                          let maxLat = -90;
                          let minLng = 180;
                          let maxLng = -180;

                          children.forEach(child => {
                            const lat = child.geometry.coordinates[1];
                            const lng = child.geometry.coordinates[0];
                            minLat = Math.min(minLat, lat);
                            maxLat = Math.max(maxLat, lat);
                            minLng = Math.min(minLng, lng);
                            maxLng = Math.max(maxLng, lng);
                          });

                          const centerLat = (minLat + maxLat) / 2;
                          const centerLng = (minLng + maxLng) / 2;

                          const latitudeDelta = (maxLat - minLat) * 1.5;
                          const longitudeDelta = (maxLng - minLng) * 1.5;

                          const newCameraPosition = {
                            coordinates: {
                              latitude: centerLat,
                              longitude: centerLng,
                            },
                            // Adjust zoom level based on the delta, or set a default if delta is too small
                            zoom: Math.max(1, Math.min(15, Math.round(Math.log(360 / (longitudeDelta > 0 ? longitudeDelta : 0.1)) / Math.LN2))),
                          };
                          mapRef.current?.setCamera(newCameraPosition);
                        }
                      }
                    } catch (error) {
                      console.warn('Error handling cluster press:', error);
                    }
                  }}
                  onPress={(event: any) => {
                    // Map onPress handler - no longer needed as coordinate selection is in AddDiveSiteScreen
                  }}
                  onMapGestureBegin={onMapGestureBegin}
                  onMapGestureEnd={onMapGestureEnd}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DIMENSIONS.SPACE_XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  diveSiteSelector: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    backgroundColor: COLORS.SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  diveSiteSelectorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
  },
  diveSiteSelectorIcon: {
    color: COLORS.PRIMARY,
  },
  diveSitePlaceholderText: {
    color: COLORS.TEXT_TERTIARY,
  },
  diveSiteSelectedText: {
    color: COLORS.TEXT_PRIMARY,
  },
  mapCard: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
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

export default DiveSitePicker;