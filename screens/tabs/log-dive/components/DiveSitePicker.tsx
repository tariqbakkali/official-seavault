import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import MapboxClusteredMapView, { MapboxClusteredMapViewRef } from '@/components/MapboxClusteredMapView';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Database } from '@/types/database';
import CountryFlag from '@/components/CountryFlag';
import { calculateDistance } from '@/utils/locationUtils';

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
  const mapRef = useRef<MapboxClusteredMapViewRef>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [mapKey, setMapKey] = useState(0); // For forcing re-render on retry

  // Request location permission and get location
  useEffect(() => {
    let subscription: Location.LocationSubscription;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          setPermissionGranted(true);

          // Use watchPositionAsync for live updates and better reliability
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            (location) => {
              setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          );
        }
      } catch (error) {
        console.warn('[DiveSitePicker] Error getting location:', error);
      }
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const handleRetry = () => {
    setMapKey(prev => prev + 1);
  };

  // Helper function to calculate initial region based on all dive sites
  const calculateInitialRegionForDenseArea = (sites: any[]) => {
    // ALWAYS prioritize user location when available (regardless of dive sites)
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 5.0,  // Zoomed out view (~500km range)
        longitudeDelta: 5.0,
      };
    }

    // If no user location, calculate from dive sites
    if (sites.length === 0) {
      return {
        latitude: 54,  // Central Europe
        longitude: 15,
        latitudeDelta: 40,  // Wide view
        longitudeDelta: 40,
      };
    }
    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;

    // Limit to first 50 sites for performance if needed, but for bounds calculation we might want all
    // If there are too many, maybe just take a sample
    const sitesToConsider = sites.length > 100 ? sites.slice(0, 100) : sites;

    sitesToConsider.forEach(site => {
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

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setCamera({
        coordinates: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        zoom: 12,
      });
    } else if (!permissionGranted) {
      Alert.alert('Permission needed', 'Please enable location services to use this feature.');
    }
  };

  const renderMapContent = () => {
    if (mapError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load map</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (selectedDiveSiteId) {
      const selectedSite = diveSites?.find(site => site.id === selectedDiveSiteId);
      if (selectedSite && selectedSite.latitude && selectedSite.longitude) {
        // Convert initial region to camera position
        const initialRegion = {
          latitude: selectedSite.latitude,
          longitude: selectedSite.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        return (
          <MapboxClusteredMapView
            key={`selected-${mapKey}`}
            style={styles.map}
            data={[]} // Single marker handled by selectedCoordinate
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
    }

    if (diveSites && diveSites.length > 0) {
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

      // Calculate initial region
      const initialRegion = calculateInitialRegionForDenseArea(validSites);

      return (
        <MapboxClusteredMapView
          key={`clustered-${mapKey}-${userLocation ? 'loc' : 'no-loc'}-${selectedDiveSiteId || 'none'}`}
          ref={mapRef}
          style={styles.map}
          data={validSites}
          initialRegion={initialRegion}
          clusteringEnabled={validSites.length > 5} // Only enable clustering if there are more than 5 sites
          userLocation={userLocation}
          showUserLocation={true}
          onPress={(event: any) => {
            if (event.nativeEvent && event.nativeEvent.id) {
              onDiveSiteSelect(event.nativeEvent.id);
            }
          }}
          onMapGestureBegin={onMapGestureBegin}
          onMapGestureEnd={onMapGestureEnd}
        />
      );
    }

    return (
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>
          No dive sites available. Select a dive site to view its location on the map.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.diveSiteSelector}
        onPress={handleOpenDiveSitePicker}
      >
        {
          selectedDiveSiteId && (() => {
            const site = diveSites?.find(s => s.id === selectedDiveSiteId);
            if (site) {
              return (
                <View style={styles.selectedSiteContainer}>
                  <CountryFlag
                    latitude={site.latitude || 0}
                    longitude={site.longitude || 0}
                    size={20}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.diveSiteSelectedText}>{site.name}</Text>
                </View>
              );
            }
            return null;
          })()
        }
        {
          !selectedDiveSiteId && (
            <Text style={styles.diveSitePlaceholderText}>Select a dive site</Text>
          )
        }
        <Text style={styles.diveSiteSelectorIcon}>›</Text>
      </TouchableOpacity>

      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View>
            <Text style={styles.mapTitle}>Dive Site Location</Text>
            {userLocation && diveSites && (
              <Text style={styles.nearbyText}>
                {diveSites.filter(site => {
                  if (!site.latitude || !site.longitude) return false;
                  const dist = calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    site.latitude,
                    site.longitude
                  );
                  return dist <= 50; // 50km radius
                }).length} sites nearby
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {userLocation && !selectedDiveSiteId && (
              <TouchableOpacity onPress={handleCenterOnUser} style={styles.centerButton}>
                <Text style={styles.centerButtonText}>Center on Me</Text>
              </TouchableOpacity>
            )}
            {selectedDiveSiteId && (
              <TouchableOpacity
                style={styles.deselectButton}
                onPress={onDeselectDiveSite}
              >
                <Text style={styles.deselectButtonText}>Deselect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.mapContainer}>
          {renderMapContent()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DIMENSIONS.SPACE_XL,
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
  selectedSiteContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  nearbyText: {
    fontSize: TYPOGRAPHY.SIZE_XS,
    color: COLORS.TEXT_TERTIARY,
    marginTop: 2,
  },
  centerButton: {
    paddingHorizontal: DIMENSIONS.SPACE_SM,
    paddingVertical: DIMENSIONS.SPACE_XS,
    backgroundColor: COLORS.SURFACE_SECONDARY,
    borderRadius: DIMENSIONS.RADIUS_SM,
  },
  centerButtonText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
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
    position: 'relative',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE_SECONDARY,
  },
  errorText: {
    color: COLORS.ERROR,
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: DIMENSIONS.SPACE_LG,
    paddingVertical: DIMENSIONS.SPACE_SM,
    borderRadius: DIMENSIONS.RADIUS_SM,
  },
  retryButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
});

export default DiveSitePicker;