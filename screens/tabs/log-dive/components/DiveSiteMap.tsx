import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapboxClusteredMapView from '@/components/MapboxClusteredMapView';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Database } from '@/types/database';
import { optimizeMarkerData, convertToGeoJSON } from '@/utils/mapOptimization';

interface DiveSiteMapProps {
  diveSites: Database['public']['Tables']['dive_sites']['Row'][] | null;
  selectedDiveSiteId: string | null;
  onDeselectDiveSite: () => void;
  onDiveSiteSelect: (siteId: string) => void;
  onMapGestureBegin?: () => void;
  onMapGestureEnd?: () => void;
}

const DiveSiteMap: React.FC<DiveSiteMapProps> = ({
  diveSites,
  selectedDiveSiteId,
  onDeselectDiveSite,
  onDiveSiteSelect,
  onMapGestureBegin,
  onMapGestureEnd,
}) => {
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('[DiveSiteMap] Rendering with:', {
    diveSitesCount: diveSites?.length,
    selectedDiveSiteId
  });

  useEffect(() => {
    return () => {
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
    };
  }, []);

  const endGesture = () => {
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
    }
    gestureTimeoutRef.current = setTimeout(() => {
      if (onMapGestureEnd) {
        onMapGestureEnd();
      }
    }, 100);
  };

  // Optimize marker data for performance
  const optimizedMarkers = useMemo(() => {
    if (!diveSites || diveSites.length === 0) return [];
    return optimizeMarkerData(diveSites);
  }, [diveSites]);

  // Calculate marker counts
  const totalMarkers = optimizedMarkers.length;

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
        <View>
          <Text style={styles.mapTitle}>Dive Site Location</Text>
          {totalMarkers > 0 && (
            <Text style={styles.markerCount}>
              {totalMarkers} site{totalMarkers !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
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
        onStartShouldSetResponder={() => {
          if (onMapGestureBegin) {
            onMapGestureBegin();
          }
          return false;
        }}
        onResponderRelease={() => {
          endGesture();
        }}
        onResponderTerminate={() => {
          endGesture();
        }}
        onTouchEnd={() => {
          endGesture();
        }}
      >
        {selectedDiveSiteId ? (
          (() => {
            const selectedSite = diveSites?.find(site => site.id === selectedDiveSiteId);
            if (selectedSite && selectedSite.latitude && selectedSite.longitude) {
              const initialRegion = {
                latitude: selectedSite.latitude,
                longitude: selectedSite.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              };

              return (
                <MapboxClusteredMapView
                  style={styles.map}
                  data={[]} // No markers when selected, or just the selected one
                  initialRegion={initialRegion}
                  selectedCoordinate={{
                    latitude: selectedSite.latitude,
                    longitude: selectedSite.longitude
                  }}
                  clusteringEnabled={false}
                  onPress={() => onDiveSiteSelect(selectedSite.id)}
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
            const validSites = convertToGeoJSON(optimizedMarkers);
            const initialRegion = calculateInitialRegionForDenseArea(validSites);

            return (
              <MapboxClusteredMapView
                style={styles.map}
                data={validSites}
                initialRegion={initialRegion}
                clusteringEnabled={true}
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
  markerCount: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: DIMENSIONS.SPACE_XS,
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
