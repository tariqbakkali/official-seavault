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
    LocationPuck,
} from '@rnmapbox/maps';
import { featureCollection, point } from '@turf/helpers';

interface SimpleMapViewProps {
    style?: any;
    data: any[];
    initialRegion: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    renderMarker?: (data: any) => any;
    onPress?: (event: any) => void;
    onMarkerDragEnd?: (event: any) => void;
    selectedCoordinate?: { latitude: number; longitude: number } | null;
    onMapGestureBegin?: () => void;
    onMapGestureEnd?: () => void;
    isMarkerDraggable?: boolean;
    showUserLocation?: boolean;
}

export interface MapboxSimpleMapViewRef {
    setCamera: (cameraPosition: any) => void;
}

const MapboxSimpleMapView = forwardRef<
    MapboxSimpleMapViewRef,
    SimpleMapViewProps
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
        }: SimpleMapViewProps,
        ref: React.ForwardedRef<MapboxSimpleMapViewRef>
    ) => {
        const mapRef = useRef<MapView>(null);
        const cameraRef = useRef<Camera>(null);

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
        };

        return (
            <View style={style}>
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFill}
                    onTouchStart={onMapGestureBegin}
                    onTouchEnd={onMapGestureEnd}
                    scaleBarEnabled={false}
                >
                    <Camera
                        ref={cameraRef}
                        defaultSettings={{
                            centerCoordinate: [initialRegion.longitude, initialRegion.latitude],
                            zoomLevel: 10,
                        }}
                    />

                    {showUserLocation && <LocationPuck />}

                    <ShapeSource
                        id="simpleMarkersSource"
                        shape={shapeSourceData}
                        onPress={handleShapePress}
                    >
                        <CircleLayer
                            id="simplePoints"
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

export default MapboxSimpleMapView;
