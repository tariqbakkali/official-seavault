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
    LocationPuck,
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
            selectedCoordinate,
            onMapGestureBegin,
            onMapGestureEnd,
            showUserLocation = false,
            clusteringEnabled = true,
        }: ClusteredMapViewProps,
        ref: React.ForwardedRef<MapboxClusteredMapViewRef>
    ) => {
        const mapRef = useRef<MapView>(null);
        const cameraRef = useRef<Camera>(null);
        const [isMapLoaded, setIsMapLoaded] = useState(false);

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
                    // Mapbox handles expansion automatically if configured, or we can do it manually
                    // For now let's just log or let user handle it
                    console.log('Cluster pressed', feature);
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

        return (
            <View style={style}>
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFill}
                    onDidFinishLoadingMap={() => setIsMapLoaded(true)}
                    onTouchStart={onMapGestureBegin}
                    onTouchEnd={onMapGestureEnd}
                    scaleBarEnabled={false}
                >
                    <Camera
                        ref={cameraRef}
                        defaultSettings={{
                            centerCoordinate: [initialRegion.longitude, initialRegion.latitude],
                            zoomLevel: 10, // Approximate zoom level based on delta
                        }}
                    />

                    {showUserLocation && <LocationPuck />}

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
                                circleColor: '#007AFF',
                                circleRadius: 8,
                                circleStrokeWidth: 2,
                                circleStrokeColor: '#fff',
                            }}
                        />
                    </ShapeSource>

                    {/* Selected Marker */}
                    {selectedCoordinate && (
                        <ShapeSource
                            id="selectedMarkerSource"
                            shape={point([
                                selectedCoordinate.longitude,
                                selectedCoordinate.latitude,
                            ])}
                        >
                            <CircleLayer
                                id="selectedMarker"
                                style={{
                                    circleColor: '#FF3B30',
                                    circleRadius: 10,
                                    circleStrokeWidth: 2,
                                    circleStrokeColor: '#fff',
                                }}
                            />
                        </ShapeSource>
                    )}
                </MapView>
            </View>
        );
    }
);

export default MapboxClusteredMapView;
