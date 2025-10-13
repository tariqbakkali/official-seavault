import React from 'react';
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
        onMapGestureEnd={onMapGestureEnd}
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