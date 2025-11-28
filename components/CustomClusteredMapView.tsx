import React, {
    useState,
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
    useMemo,
    useCallback,
} from 'react';
import { View, Platform, Dimensions } from 'react-native';
import { GoogleMaps, AppleMaps } from 'expo-maps';
import Supercluster from 'supercluster';
import MapLoadingState from '@/components/ui/MapLoadingState';
import MapErrorState from '@/components/ui/MapErrorState';
import {
    MAX_MARKERS_ANDROID,
} from '@/utils/mapOptimization';

interface ClusteredMapViewProps {
    style?: any;
    data: any[];
    initialRegion: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    renderMarker: (data: any) => any;
    renderCluster?: (cluster: any, onPress: () => void) => any;
    clusteringEnabled?: boolean;
    onClusterPress?: (clusterId: string, children: any[]) => void;
    onPress?: (event: any) => void;
    onMarkerDragEnd?: (event: any) => void;
    selectedCoordinate?: { latitude: number; longitude: number } | null;
    onMapGestureBegin?: () => void;
    onMapGestureEnd?: () => void;
    isMarkerDraggable?: boolean;
    userLocation?: { latitude: number; longitude: number } | null;
    showUserLocation?: boolean;
}

export interface CustomClusteredMapViewRef {
    setCamera: (cameraPosition: any) => void;
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;

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
            clusteringEnabled = false,
            onClusterPress,
            onPress,
            onMarkerDragEnd,
            selectedCoordinate,
            onMapGestureBegin,
            onMapGestureEnd,
            isMarkerDraggable = false,
            userLocation,
            showUserLocation = false,
        }: ClusteredMapViewProps,
        ref: React.ForwardedRef<CustomClusteredMapViewRef>
    ) => {
        console.log('[CustomClusteredMapView] Rendered with:', {
            dataLength: data?.length,
            clusteringEnabled,
            region: initialRegion
        });

        // State management
        const [markers, setMarkers] = useState<any[]>([]);
        const [region, setRegion] = useState(initialRegion);
        const [zoom, setZoom] = useState(10); // Default zoom
        const superclusterRef = useRef<Supercluster | null>(null);
        const [mapKey, setMapKey] = useState(0);
        const [isDragging, setIsDragging] = useState(false);
        const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const mapRef = useRef<any>(null);

        // Loading and error states
        const [isLoading, setIsLoading] = useState(true);
        const [hasError, setHasError] = useState(false);
        const [errorMessage, setErrorMessage] = useState('');
        const [showTimeout, setShowTimeout] = useState(false);
        const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const timeoutWarningRef = useRef<NodeJS.Timeout | null>(null);

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
            // Estimate zoom from delta
            const newZoom = Math.round(Math.log(360 / initialRegion.longitudeDelta) / Math.LN2);
            setZoom(newZoom);
        }, [initialRegion]);

        // Cleanup timeouts on unmount
        useEffect(() => {
            return () => {
                if (gestureTimeoutRef.current) {
                    clearTimeout(gestureTimeoutRef.current);
                }
                if (loadingTimeoutRef.current) {
                    clearTimeout(loadingTimeoutRef.current);
                }
                if (timeoutWarningRef.current) {
                    clearTimeout(timeoutWarningRef.current);
                }
            };
        }, []);

        // Loading timeout protection
        useEffect(() => {
            if (isLoading) {
                timeoutWarningRef.current = setTimeout(() => {
                    setShowTimeout(true);
                }, 5000);

                loadingTimeoutRef.current = setTimeout(() => {
                    setIsLoading(false);
                    setHasError(true);
                    setErrorMessage('Map took too long to load. Please try again.');
                }, 10000);
            }

            return () => {
                if (loadingTimeoutRef.current) {
                    clearTimeout(loadingTimeoutRef.current);
                }
                if (timeoutWarningRef.current) {
                    clearTimeout(timeoutWarningRef.current);
                }
            };
        }, [isLoading]);

        // Initialize Supercluster
        useEffect(() => {
            if (clusteringEnabled) {
                superclusterRef.current = new Supercluster({
                    radius: 40,
                    maxZoom: 16,
                });
            }
        }, [clusteringEnabled]);

        // Process markers and load into Supercluster
        useEffect(() => {
            try {
                if (data && data.length > 0) {
                    const processedMarkers = data.map((item, index) => {
                        if (item.geometry && item.properties) {
                            return item;
                        }
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

                    if (clusteringEnabled && superclusterRef.current) {
                        superclusterRef.current.load(processedMarkers);
                    }

                    setIsLoading(false);
                    setHasError(false);
                } else {
                    setMarkers([]);
                    if (clusteringEnabled && superclusterRef.current) {
                        superclusterRef.current.load([]);
                    }
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error processing markers:', error);
                setIsLoading(false);
                setHasError(true);
                setErrorMessage('Failed to process map markers');
            }
        }, [data, clusteringEnabled]);

        // Helper to get bounding box from region
        const getBBox = (region: any) => {
            const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
            return [
                longitude - longitudeDelta / 2,
                latitude - latitudeDelta / 2,
                longitude + longitudeDelta / 2,
                latitude + latitudeDelta / 2,
            ] as [number, number, number, number];
        };

        // Calculate clusters or markers to render
        const mapMarkers = useMemo(() => {
            let markersToRender = [];

            if (clusteringEnabled && superclusterRef.current) {
                // Get clusters based on current region (bbox) and zoom
                const bbox = getBBox(region);
                // Ensure zoom is within valid range for supercluster (0-16 usually)
                const safeZoom = Math.max(0, Math.min(Math.floor(zoom), 16));

                try {
                    const clusters = superclusterRef.current.getClusters(bbox, safeZoom);
                    markersToRender = clusters;
                } catch (e) {
                    console.warn("Supercluster error:", e);
                    markersToRender = markers; // Fallback
                }
            } else {
                markersToRender = markers;

                // ONLY limit markers on Android if clustering is DISABLED
                if (Platform.OS === 'android' && !clusteringEnabled && markers.length > MAX_MARKERS_ANDROID) {
                    markersToRender = markers.slice(0, MAX_MARKERS_ANDROID);
                    console.log(`[Android] Limiting markers from ${markers.length} to ${MAX_MARKERS_ANDROID} (Clustering Disabled)`);
                }
            }

            return markersToRender
                .map((marker, index) => {
                    if (!marker || !marker.geometry || !marker.geometry.coordinates) {
                        return null;
                    }

                    const coordinates = marker.geometry.coordinates;

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

                    // Check if it's a cluster
                    const isCluster = marker.properties && marker.properties.cluster;

                    if (isCluster) {
                        const pointCount = marker.properties.point_count || 0;
                        const clusterId = marker.properties.cluster_id;

                        return {
                            id: `cluster-${clusterId}`,
                            coordinates: { latitude, longitude },
                            title: `${pointCount} dive sites`,
                            color: '#FF9500', // Orange for clusters
                            // Custom property to identify as cluster for click handling
                            isCluster: true,
                            clusterId: clusterId,
                            pointCount: pointCount
                        };
                    } else {
                        // Individual marker
                        const markerData = renderMarker(marker);
                        if (markerData) {
                            return {
                                id: markerData.id || marker.properties?.id || marker.id || `marker-${index}`,
                                coordinates: {
                                    latitude: markerData.coordinates?.latitude || latitude,
                                    longitude: markerData.coordinates?.longitude || longitude,
                                },
                                title: markerData.title || marker.properties?.name || marker.name || 'Dive Site',
                                color: markerData.color || '#007AFF',
                                onPress: markerData.onPress,
                                isCluster: false
                            };
                        }
                        return {
                            id: marker.properties?.id || marker.id || `marker-${index}`,
                            coordinates: { latitude, longitude },
                            title: marker.properties?.name || marker.name || 'Dive Site',
                            color: '#007AFF',
                            isCluster: false
                        };
                    }
                })
                .filter((marker) => marker !== null);
        }, [markers, region, zoom, clusteringEnabled, renderMarker]);

        // Add selected/user markers (same as before)
        const finalMarkers = [...mapMarkers];

        if (selectedCoordinate && typeof selectedCoordinate.latitude === 'number' && typeof selectedCoordinate.longitude === 'number') {
            finalMarkers.push({
                id: 'selected-marker',
                coordinates: selectedCoordinate,
                title: 'Selected Location',
                color: isDragging ? '#00FF00' : '#FF3B30',
                draggable: isMarkerDraggable,
            });
        }

        if (showUserLocation && userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
            finalMarkers.push({
                id: 'user-location',
                coordinates: userLocation,
                title: 'You are here',
                color: '#2196F3',
            });
        }

        // Camera move handler to update region/zoom for clustering
        const handleCameraMove = (event: any) => {
            // Expo Maps specific event structure for camera move
            // Note: This depends on the exact version of expo-maps, assuming it returns camera position
            if (event && event.cameraPosition) {
                const { target, zoom: newZoom } = event.cameraPosition;
                if (target && typeof newZoom === 'number') {
                    // Calculate approximate delta based on zoom
                    const longitudeDelta = 360 / Math.pow(2, newZoom);
                    const latitudeDelta = longitudeDelta * ASPECT_RATIO;

                    setRegion({
                        latitude: target.latitude,
                        longitude: target.longitude,
                        latitudeDelta,
                        longitudeDelta,
                    });
                    setZoom(newZoom);
                }
            } else if (event && event.nativeEvent) {
                // Try native event structure
                // This is a best-effort estimation if exact props aren't available
                // For now we rely on initialRegion and manual updates if possible
            }
        };

        const handleRetry = () => {
            setIsLoading(true);
            setHasError(false);
            setErrorMessage('');
            setShowTimeout(false);
            setMapKey(prev => prev + 1);
        };

        if (isLoading) {
            return (
                <View style={style}>
                    <MapLoadingState message="Loading dive sites map..." showTimeout={showTimeout} />
                </View>
            );
        }

        if (hasError) {
            return (
                <View style={style}>
                    <MapErrorState message={errorMessage} onRetry={handleRetry} />
                </View>
            );
        }

        return (
            <View
                style={style}
                onStartShouldSetResponder={() => {
                    if (onMapGestureBegin) onMapGestureBegin();
                    return false;
                }}
                onResponderRelease={() => {
                    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
                    gestureTimeoutRef.current = setTimeout(() => {
                        if (onMapGestureEnd) onMapGestureEnd();
                        if (isDragging) setIsDragging(false);
                    }, 100);
                }}
            >
                <MapView
                    key={mapKey}
                    style={{ flex: 1 }}
                    cameraPosition={{
                        coordinates: {
                            latitude: region.latitude,
                            longitude: region.longitude,
                        },
                        zoom: zoom,
                    }}
                    markers={finalMarkers}
                    onCameraMoveEnded={handleCameraMove}
                    onMapClick={(event) => {
                        if (isDragging) {
                            setIsDragging(false);
                            if (onMapGestureEnd) onMapGestureEnd();
                            // ... drag end logic
                        } else if (onPress) {
                            onPress(event);
                        }
                    }}
                    onMarkerClick={(event) => {
                        const clickedMarker = finalMarkers.find(m => m.id === event.id);
                        if (clickedMarker) {
                            if (clickedMarker.isCluster) {
                                // Handle cluster press
                                if (onClusterPress) {
                                    onClusterPress(clickedMarker.clusterId, []);
                                } else {
                                    // Default behavior: zoom in
                                    const expansionZoom = superclusterRef.current?.getClusterExpansionZoom(clickedMarker.clusterId);
                                    if (expansionZoom) {
                                        setZoom(expansionZoom);
                                        setRegion({
                                            ...region,
                                            latitude: clickedMarker.coordinates.latitude,
                                            longitude: clickedMarker.coordinates.longitude,
                                            // Update deltas for new zoom
                                            longitudeDelta: 360 / Math.pow(2, expansionZoom),
                                            latitudeDelta: (360 / Math.pow(2, expansionZoom)) * ASPECT_RATIO
                                        });
                                    }
                                }
                            } else if (clickedMarker.onPress) {
                                clickedMarker.onPress();
                            } else if (onPress) {
                                onPress({ nativeEvent: { coordinate: clickedMarker.coordinates, id: clickedMarker.id } });
                            }
                        }
                    }}
                />
            </View>
        );
    }
);

export default React.memo(CustomClusteredMapView);
