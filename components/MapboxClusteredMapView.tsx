import React, {
    useState,
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
    useMemo,
} from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Mapbox, {
    MapView,
    Camera,
    ShapeSource,
    SymbolLayer,
    CircleLayer,
    Images,
    PointAnnotation,
} from '@rnmapbox/maps';
import { featureCollection, point } from '@turf/helpers';
import MapLoadingState from '@/components/ui/MapLoadingState';
import MapErrorState from '@/components/ui/MapErrorState';

// Set your access token here or in your entry file
// Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

interface ClusteredMapViewProps {
    style?: any;
    data: any[];
    initialRegion: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    renderMarker?: (data: any) => any; // Not used directly in Mapbox SymbolLayer but kept for compatibility
    onPress?: (event: any) => void;
    onMarkerDragEnd?: (event: any) => void;
    selectedCoordinate?: { latitude: number; longitude: number } | null;
    onMapGestureBegin?: () => void;
    onMapGestureEnd?: () => void;
    isMarkerDraggable?: boolean;
    userLocation?: { latitude: number; longitude: number } | null;
    showUserLocation?: boolean;
    clusteringEnabled?: boolean;
}

export interface MapboxClusteredMapViewRef {
    setCamera: (cameraPosition: any) => void;
}

const MapboxClusteredMapView = forwardRef<
    MapboxClusteredMapViewRef,
    ClusteredMapViewProps
>(
    (
        {
            style,
            data,
            initialRegion,
            onPress,
            onMarkerDragEnd,
            selectedCoordinate,
            onMapGestureBegin,
            onMapGestureEnd,
            isMarkerDraggable = false,
            showUserLocation = false,
            clusteringEnabled = true,
            userLocation,
        }: ClusteredMapViewProps,
        ref: React.ForwardedRef<MapboxClusteredMapViewRef>
    ) => {
        const mapRef = useRef<MapView>(null);
        const cameraRef = useRef<Camera>(null);
        const [isMapLoaded, setIsMapLoaded] = useState(false);
        const [isDragging, setIsDragging] = useState(false);
        const [draggedCoordinate, setDraggedCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);

        // Debug logging for user location
        useEffect(() => {
            if (showUserLocation && userLocation) {
                console.log('[MapboxClusteredMapView] User location updated:', userLocation);
            } else if (showUserLocation && !userLocation) {
                console.log('[MapboxClusteredMapView] showUserLocation is true but userLocation is null');
            }
        }, [showUserLocation, userLocation]);

        // Expose setCamera function via ref
        useImperativeHandle(ref, () => ({
            setCamera: (cameraPosition: any) => {
                if (cameraRef.current) {
                    cameraRef.current.setCamera({
                        centerCoordinate: [
                            cameraPosition.coordinates.longitude,
                            cameraPosition.coordinates.latitude,
                        ],
                        zoomLevel: cameraPosition.zoom,
                        animationDuration: 1000,
                    });
                }
            },
        }));

        // Convert data to GeoJSON FeatureCollection
        const shapeSourceData = useMemo(() => {
            if (!data || data.length === 0) {
                return featureCollection([]);
            }

            const features = data.map((item) => {
                const longitude = item.geometry?.coordinates?.[0] ?? item.longitude ?? 0;
                const latitude = item.geometry?.coordinates?.[1] ?? item.latitude ?? 0;

                return point([longitude, latitude], {
                    id: item.id || item.properties?.id,
                    name: item.name || item.properties?.name,
                    ...item.properties,
                });
            });

            return featureCollection(features);
        }, [data]);

        const handleShapePress = (e: any) => {
            if (e.features && e.features.length > 0) {
                const feature = e.features[0];
                if (feature.properties?.cluster) {
                    // Handle cluster press - zoom in
                } else {
                    // Handle marker press
                    if (onPress) {
                        onPress({
                            nativeEvent: {
                                id: feature.properties?.id,
                                coordinate: {
                                    latitude: feature.geometry.coordinates[1],
                                    longitude: feature.geometry.coordinates[0],
                                },
                            },
                        });
                    }
                }
            }
        };

        // Handle map press - either place marker or update drag position
        const handleMapPress = async (e: any) => {
            const { geometry } = e;
            if (!geometry || !geometry.coordinates) return;

            const [longitude, latitude] = geometry.coordinates;
            const newCoordinate = { latitude, longitude };

            // If marker is draggable and we have a selected coordinate, update it
            if (isMarkerDraggable && selectedCoordinate) {
                setIsDragging(true);
                setDraggedCoordinate(newCoordinate);

                // Immediately call the drag end handler to update coordinates
                if (onMarkerDragEnd) {
                    onMarkerDragEnd({
                        nativeEvent: {
                            coordinate: newCoordinate,
                        },
                    });
                }

                // Reset drag state after a short delay
                setTimeout(() => {
                    setIsDragging(false);
                    setDraggedCoordinate(null);
                }, 200);
            } else {
                // Normal map press handling
                handleShapePress(e);
            }
        };

        // Handle touch start to begin visual feedback
        const handleTouchStart = () => {
            if (isMarkerDraggable && selectedCoordinate) {
                if (onMapGestureBegin) {
                    onMapGestureBegin();
                }
            }
        };

        // Handle touch end
        const handleTouchEnd = () => {
            if (onMapGestureEnd) {
                onMapGestureEnd();
            }
        };

        // Get the current marker coordinate (dragged or selected)
        const currentMarkerCoordinate = draggedCoordinate || selectedCoordinate;

        return (
            <View style={style}>
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFill}
                    onDidFinishLoadingMap={() => setIsMapLoaded(true)}
                    onPress={handleMapPress}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    scaleBarEnabled={false}
                >
                    <Camera
                        ref={cameraRef}
                        defaultSettings={{
                            centerCoordinate: [initialRegion.longitude, initialRegion.latitude],
                            zoomLevel: 10, // Approximate zoom level based on delta
                        }}
                    />

                    <ShapeSource
                        id="diveSitesSource"
                        shape={shapeSourceData}
                        cluster={clusteringEnabled}
                        clusterRadius={50}
                        clusterMaxZoomLevel={14}
                        onPress={handleShapePress}
                    >
                        {/* Render Clusters */}
                        <SymbolLayer
                            id="pointCount"
                            style={{
                                textField: ['get', 'point_count'],
                                textSize: 12,
                                textColor: '#ffffff',
                                textIgnorePlacement: true,
                                textAllowOverlap: true,
                            }}
                        />

                        <CircleLayer
                            id="clusteredPoints"
                            belowLayerID="pointCount"
                            filter={['has', 'point_count']}
                            style={{
                                circleColor: [
                                    'step',
                                    ['get', 'point_count'],
                                    '#51bbd6',
                                    100,
                                    '#f1f075',
                                    750,
                                    '#f28cb1',
                                ],
                                circleRadius: 20,
                                circleStrokeWidth: 2,
                                circleStrokeColor: '#fff',
                            }}
                        />


                        {/* Render Individual Markers */}
                        <CircleLayer
                            id="singlePoint"
                            filter={['!', ['has', 'point_count']]}
                            style={{
                                circleColor: '#007AFF', // Blue markers for dive sites (differentiated from orange user location)
                                circleRadius: 10,
                                circleStrokeWidth: 3,
                                circleStrokeColor: '#FFFFFF',
                                circleOpacity: 1,
                            }}
                        />

                        {/* Add a smaller white dot in the center for pin effect */}
                        <CircleLayer
                            id="singlePointCenter"
                            filter={['!', ['has', 'point_count']]}
                            style={{
                                circleColor: '#FFFFFF',
                                circleRadius: 3,
                            }}
                        />
                    </ShapeSource>

                    {/* Selected Marker */}
                    {currentMarkerCoordinate && (
                        <ShapeSource
                            id="selectedMarkerSource"
                            shape={point([
                                currentMarkerCoordinate.longitude,
                                currentMarkerCoordinate.latitude,
                            ])}
                        >
                            <CircleLayer
                                id="selectedMarker"
                                style={{
                                    circleColor: isDragging ? '#00FF00' : '#FF3B30',
                                    circleRadius: isDragging ? 12 : 10,
                                    circleStrokeWidth: 2,
                                    circleStrokeColor: '#fff',
                                }}
                            />
                        </ShapeSource>
                    )}

                    {/* Custom User Location Marker (Orange) - Rendered last for proper z-index */}
                    {showUserLocation && userLocation && (
                        <PointAnnotation
                            id="user-location"
                            coordinate={[userLocation.longitude, userLocation.latitude]}
                        >
                            <View style={styles.userLocationMarker} />
                        </PointAnnotation>
                    )}
                </MapView>
            </View>
        );
    }
);

export default MapboxClusteredMapView;

const styles = StyleSheet.create({
    userLocationMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 149, 0, 0.3)', // Semi-transparent orange halo
        borderWidth: 2,
        borderColor: '#FF9500', // Solid orange border
        justifyContent: 'center',
        alignItems: 'center',
        // Inner dot created with shadow/overlay effect
        shadowColor: '#FF9500',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
});
