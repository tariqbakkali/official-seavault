import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

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
        { backgroundColor: isSelecting ? '#0056b3' : '#333' }
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
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  toggleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MapToggleButton;