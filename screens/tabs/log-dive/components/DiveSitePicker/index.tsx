import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Database } from '@/types/database';
import DiveSiteSelector from './DiveSiteSelector';
import DiveSiteMap from '../DiveSiteMap';

interface DiveSitePickerProps {
  diveSites: Database['public']['Tables']['dive_sites']['Row'][] | null;
  selectedDiveSiteId: string | null;
  onDeselectDiveSite: () => void;
  onDiveSiteSelect: (siteId: string) => void;
  onMapGestureBegin?: () => void; // Add gesture control props
  onMapGestureEnd?: () => void;   // Add gesture control props
}

const DiveSitePicker: React.FC<DiveSitePickerProps> = ({
  diveSites,
  selectedDiveSiteId,
  onDeselectDiveSite,
  onDiveSiteSelect,
  onMapGestureBegin,
  onMapGestureEnd,
}) => {
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
    };
  }, []);
  
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
    }, 100); // Small delay to ensure proper cleanup
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dive Site</Text>
      </View>
      
      <DiveSiteSelector 
        diveSites={diveSites}
        selectedDiveSiteId={selectedDiveSiteId}
      />
      
      <DiveSiteMap
        diveSites={diveSites}
        selectedDiveSiteId={selectedDiveSiteId}
        onDeselectDiveSite={onDeselectDiveSite}
        onDiveSiteSelect={onDiveSiteSelect}
        onMapGestureBegin={onMapGestureBegin}
        onMapGestureEnd={endGesture}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DIMENSIONS.SPACE_XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
});

export default DiveSitePicker;