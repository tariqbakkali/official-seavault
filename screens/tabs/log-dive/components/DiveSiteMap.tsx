import React, { useRef, useEffect, useState } from 'react';
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
  onMapGestureBegin?: () => void; // Add gesture control props
  onMapGestureEnd?: () => void;   // Add gesture control props
}

const DiveSiteMap: React.FC<DiveSiteMapProps> = ({
  diveSites,
  selectedDiveSiteId,
  onDeselectDiveSite,
  onDiveSiteSelect,
  onMapGestureBegin,
  onMapGestureEnd,
}) => {
  // Helper function to calculate initial region focused on area with most dive sites
  const calculateInitialRegionForDenseArea = (sites: any[]) => {
    if (sites.length === 0) {
    return {
      latitude: 54,
      longitude: 15,
      latitudeDelta: 40,
      longitudeDelta: 40,
    };
  }

  if (sites.length === 1) {
    return {
      latitude: sites[0].geometry.coordinates[1],
      longitude: sites[0].geometry.coordinates[0],
      latitudeDelta: 10,
      longitudeDelta: 10,
    };
  }

  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  for (const site of sites) {
    const lat = site.geometry.coordinates[1];
    const lng = site.geometry.coordinates[0];

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  const latDelta = (maxLat - minLat) * 1.2; // 20% padding
  const lngDelta = (maxLng - minLng) * 1.2; // 20% padding

  return {
    latitude: (maxLat + minLat) / 2,
    longitude: (maxLng + minLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
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
      
      <View 
        style={styles.mapContainer}
        // These handlers will help us detect when the user is interacting with the map
        onStartShouldSetResponder={() => {
          // Notify parent that map interaction has started
          if (onMapGestureBegin) {
            onMapGestureBegin();
          }
          return false; // Don't capture the responder, just notify
        }}
        onResponderRelease={() => {
          // Notify parent that map interaction has ended
          if (onMapGestureEnd) {
            onMapGestureEnd();
          }
        }}
        onResponderTerminate={() => {
          // Notify parent that map interaction has ended
          if (onMapGestureEnd) {
            onMapGestureEnd();
          }
        }}
      >
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
              const MapView = Platform.OS === 'android' ? GoogleMaps.View : AppleMaps.View;
              
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

            return (
              <CustomClusteredMapView
                style={styles.map}
                data={validSites}
                initialRegion={initialRegion}
                renderMarker={renderMarker}
                clusteringEnabled={false}
                onPress={(event: any) => {
                  if (event.nativeEvent && event.nativeEvent.id) {
      onDiveSiteSelect(event.nativeEvent.id);
    }
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