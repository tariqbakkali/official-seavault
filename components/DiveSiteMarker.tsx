import React from 'react';
import { Marker } from 'react-native-maps';

interface DiveSiteMarkerProps {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  onPress?: () => void;
  pinColor?: string;
  draggable?: boolean;
  onDragEnd?: (event: any) => void;
}

/**
 * Reusable component for displaying dive site markers on the map
 */
const DiveSiteMarker: React.FC<DiveSiteMarkerProps> = ({
  id,
  name,
  latitude,
  longitude,
  onPress,
  pinColor = '#007AFF',
  draggable = false,
  onDragEnd
}) => {
  return (
    <Marker
      key={id}
      coordinate={{
        latitude,
        longitude,
      }}
      title={name}
      pinColor={pinColor}
      onPress={onPress}
      draggable={draggable}
      onDragEnd={onDragEnd}
    />
  );
};

export default DiveSiteMarker;