import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, DIMENSIONS } from '@/constants';
import { TYPOGRAPHY } from '@/constants';

interface MapToggleButtonProps {
  isSelecting: boolean;
  onPress: () => void;
}

/**
 * Reusable map toggle button component for coordinate selection
 */
const MapToggleButton: React.FC<MapToggleButtonProps> = ({ 
  isSelecting, 
  onPress 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.toggleButton, 
        { backgroundColor: isSelecting ? COLORS.PRIMARY : '#333' }
      ]}
      onPress={onPress}
    >
      <Text style={styles.toggleText}>
        {isSelecting 
          ? 'Tap on the map to select coordinates' 
          : 'Select coordinates from map'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    padding: DIMENSIONS.PADDING_SM,
    borderRadius: DIMENSIONS.RADIUS_SM,
    marginBottom: DIMENSIONS.SPACE_LG,
    alignItems: 'center',
  },
  toggleText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
  },
});

export default MapToggleButton;