import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { View, Platform } from 'react-native';
import { GoogleMaps, AppleMaps } from 'expo-maps';
import Supercluster from 'supercluster';

interface ClusteredMapViewProps {
  style?: any;
  data: any[];
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  renderMarker: (data: any) => any; // Return marker data object instead of React component
  renderCluster?: (cluster: any, onPress: () => void) => any; // Return marker data object instead of React component
  clusteringEnabled?: boolean;
  onClusterPress?: (clusterId: string, children: any[]) => void;
  onPress?: (event: any) => void;
  onMarkerDragEnd?: (event: any) => void;
  selectedCoordinate?: { latitude: number; longitude: number } | null;
  onMapGestureBegin?: () => void; // Add gesture control props
  onMapGestureEnd?: () => void; // Add gesture control props
  isMarkerDraggable?: boolean; // Add draggable marker support
}

export interface CustomClusteredMapViewRef {
  setCamera: (cameraPosition: any) => void;
}

const CustomClusteredMapView = forwardRef<
  CustomClusteredMapViewRef,
  ClusteredMapViewProps
>(
  (
    {
      style,
      data,
      initialRegion,
      renderMarker,
      renderCluster,
      clusteringEnabled = false, // Changed default to false
      onClusterPress,
      onPress,
      onMarkerDragEnd,
      selectedCoordinate,
      onMapGestureBegin,
      onMapGestureEnd,
      isMarkerDraggable = false, // Default to false for backward compatibility
    }: ClusteredMapViewProps,
    ref: React.ForwardedRef<CustomClusteredMapViewRef>
  ) => {
    // For web and all platforms, use expo-maps directly with basic implementation

    const [markers, setMarkers] = useState<any[]>([]);
    const [region, setRegion] = useState(initialRegion);
    const superclusterRef = useRef<Supercluster | null>(null);
    const [mapKey, setMapKey] = useState(0);
    const [isDragging, setIsDragging] = useState(false); // Track dragging state
    const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Add timeout ref
    const mapRef = useRef<any>(null); // Ref for the actual MapView component

    // Platform-specific map view component
    const MapView =
      Platform.OS === 'android' ? GoogleMaps.View : AppleMaps.View;

    // Expose setCamera function via ref
    useImperativeHandle(ref, () => ({
      setCamera: (cameraPosition: any) => {
        if (mapRef.current && mapRef.current.setCamera) {
          mapRef.current.setCamera(cameraPosition);
        }
      },
    }));

    // Force re-render when selectedCoordinate changes
    useEffect(() => {
      setMapKey((prev) => prev + 1);
    }, [selectedCoordinate]);

    // Update region when initialRegion changes
    useEffect(() => {
      setRegion(initialRegion);
    }, [initialRegion]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (gestureTimeoutRef.current) {
          clearTimeout(gestureTimeoutRef.current);
        }
      };
    }, []);

    // Process markers - simplified to not use clustering by default
    useEffect(() => {
      if (data && data.length > 0) {
        // Make sure all data items have the required structure
        const processedMarkers = data.map((item, index) => {
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
              ...item.properties,
            },
            geometry: {
              type: 'Point',
              coordinates: item.geometry?.coordinates || [
                item.longitude !== undefined ? item.longitude : 0,
                item.latitude !== undefined ? item.latitude : 0,
              ],
            },
          };
        });
        setMarkers(processedMarkers);
      } else {
        setMarkers([]);
      }
    }, [data, initialRegion]);

    // Convert initial region to camera position
    const cameraPosition = selectedCoordinate
      ? {
          coordinates: {
            latitude: selectedCoordinate.latitude,
            longitude: selectedCoordinate.longitude,
          },
          zoom: 15, // Zoom in when a specific location is selected
        }
      : {
          coordinates: {
            latitude: initialRegion.latitude,
            longitude: initialRegion.longitude,
          },
          zoom: 10, // Adjust as needed
        };

    // Convert markers for expo-maps
    const mapMarkers = markers
      .map((marker, index) => {
        if (!marker || !marker.geometry || !marker.geometry.coordinates) {
          return null;
        }

        const coordinates = marker.geometry.coordinates;

        // Validate coordinates
        if (
          !Array.isArray(coordinates) ||
          coordinates.length < 2 ||
          typeof coordinates[0] !== 'number' ||
          typeof coordinates[1] !== 'number'
        ) {
          return null;
        }

        const longitude = coordinates[0];
        const latitude = coordinates[1];

        // Check if clustering is enabled and it's a cluster
        if (
          marker.properties &&
          marker.properties.cluster &&
          clusteringEnabled &&
          superclusterRef.current
        ) {
          // For clusters, we'll use a special marker to indicate it's a cluster
          const pointCount = marker.properties.point_count || 0;
          return {
            id: `cluster-${marker.properties.cluster_id || index}`,
            coordinates: { latitude, longitude },
            title: `${pointCount} dive sites`,
            // Different color for clusters
            color: '#FF9500', // Orange color for clusters
          };
        } else {
          // Render individual marker using the renderMarker function
          const markerData = renderMarker(marker);
          if (markerData) {
            return {
              id:
                markerData.id ||
                marker.properties?.id ||
                marker.id ||
                `marker-${index}`,
              coordinates: {
                latitude: markerData.coordinates?.latitude || latitude,
                longitude: markerData.coordinates?.longitude || longitude,
              },
              title:
                markerData.title ||
                marker.properties?.name ||
                marker.name ||
                'Dive Site',
              color: markerData.color || '#007AFF', // Blue color for individual sites
              onPress: markerData.onPress, // Pass the onPress handler
            };
          }
          // Fallback marker data
          return {
            id: marker.properties?.id || marker.id || `marker-${index}`,
            coordinates: { latitude, longitude },
            title: marker.properties?.name || marker.name || 'Dive Site',
            color: '#007AFF', // Blue color for individual sites
          };
        }
      })
      .filter((marker) => marker !== null);

    // Add selected coordinate marker if present
    if (selectedCoordinate) {
      // Validate the selected coordinate
      if (
        typeof selectedCoordinate.latitude === 'number' &&
        typeof selectedCoordinate.longitude === 'number'
      ) {
        const selectedMarker = {
          id: 'selected-marker',
          coordinates: selectedCoordinate,
          title: 'Selected Location',
          color: isDragging ? '#00FF00' : '#FF3B30', // Green when dragging, red when not
          draggable: isMarkerDraggable, // Make the selected marker draggable if enabled
        };
        mapMarkers.push(selectedMarker);
      }
    }

    // Validate markers before passing to map component
    const validMarkers = mapMarkers.filter((marker) => {
      if (!marker) return false;
      if (!marker.coordinates) return false;
      if (
        typeof marker.coordinates.latitude !== 'number' ||
        typeof marker.coordinates.longitude !== 'number'
      ) {
        // Invalid marker coordinates
        return false;
      }
      return true;
    });

    // Handle map long press for draggable marker simulation
    const handleMapLongPress = (event: any) => {
      if (isMarkerDraggable && selectedCoordinate) {
        // Start dragging simulation
        setIsDragging(true);

        // Notify parent that dragging has started
        if (onMapGestureBegin) {
          onMapGestureBegin();
        }
      }

      // Call the original onPress handler if provided
      if (onPress) {
        onPress(event);
      }
    };

    // Handle map click for ending drag or setting new position
    const handleMapClick = (event: any) => {
      if (isDragging) {
        // End dragging simulation
        setIsDragging(false);

        // Notify parent that dragging has ended
        if (onMapGestureEnd) {
          onMapGestureEnd();
        }

        // Call onMarkerDragEnd with the new position
        if (onMarkerDragEnd) {
          // Ensure the event has the expected structure
          if (event && event.coordinate) {
            // Expo Maps passes coordinates directly in the event object
            const coordinateEvent = {
              nativeEvent: {
                coordinate: {
                  latitude: event.coordinate.latitude,
                  longitude: event.coordinate.longitude,
                },
              },
            };
            onMarkerDragEnd(coordinateEvent);
          } else if (event && event.coordinates) {
            // Handle Expo Maps alternative event structure with 'coordinates' (plural)
            const coordinateEvent = {
              nativeEvent: {
                coordinate: {
                  latitude: event.coordinates.latitude,
                  longitude: event.coordinates.longitude,
                },
              },
            };
            onMarkerDragEnd(coordinateEvent);
          } else {
            // Fallback to the original event if structure is different
            onMarkerDragEnd(event);
          }
        }
      } else {
        // Call the original onPress handler if provided
        if (onPress) {
          // Ensure the event has the expected structure
          if (event && event.coordinate) {
            // Expo Maps passes coordinates directly in the event object
            const coordinateEvent = {
              nativeEvent: {
                coordinate: {
                  latitude: event.coordinate.latitude,
                  longitude: event.coordinate.longitude,
                },
              },
            };
            onPress(coordinateEvent);
          } else if (event && event.coordinates) {
            // Handle Expo Maps alternative event structure with 'coordinates' (plural)
            const coordinateEvent = {
              nativeEvent: {
                coordinate: {
                  latitude: event.coordinates.latitude,
                  longitude: event.coordinates.longitude,
                },
              },
            };
            onPress(coordinateEvent);
          } else {
            // Fallback to the original event if structure is different
            onPress(event);
          }
        }
      }
    };

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

        // Also end dragging if it was active
        if (isDragging) {
          setIsDragging(false);
        }
      }, 100); // Small delay to ensure proper cleanup
    };

    return (
      <View
        style={style}
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
        <MapView
          key={mapKey}
          style={{ flex: 1 }}
          cameraPosition={cameraPosition}
          markers={validMarkers}
          onMapClick={handleMapClick}
          onMapLongClick={handleMapLongPress}
          onMarkerClick={(event) => {
            // Find the marker that was clicked
            const clickedMarker = validMarkers.find(
              (marker) => marker.id === event.id
            );
            if (clickedMarker) {
              // Check if the marker has a custom onPress handler
              if (clickedMarker.onPress) {
                clickedMarker.onPress();
              }
              // Check if it's a cluster marker
              else if (
                clickedMarker.id.startsWith('cluster-') &&
                clusteringEnabled
              ) {
                // Handle cluster press if clustering is enabled
                if (onClusterPress) {
                  // In the simplified version, we'll just call the cluster press handler
                  onClusterPress(clickedMarker.id, []);
                }
              } else if (
                clickedMarker.id === 'selected-marker' &&
                isMarkerDraggable
              ) {
                // Handle click on draggable marker
                // For now, we'll just call the onPress handler if provided
                if (onPress) {
                  // Create a proper event object for the onPress handler
                  const eventObject = {
                    nativeEvent: {
                      coordinate: clickedMarker.coordinates,
                      id: clickedMarker.id,
                    },
                  };
                  onPress(eventObject);
                }
              }
              // For individual markers, call the onPress handler if provided
              else if (onPress) {
                // Create a proper event object for the onPress handler
                const eventObject = {
                  nativeEvent: {
                    coordinate: clickedMarker.coordinates,
                    id: clickedMarker.id,
                  },
                };
                onPress(eventObject);
              }
            }
          }}
        />
      </View>
    );
  }
);

export default CustomClusteredMapView;
