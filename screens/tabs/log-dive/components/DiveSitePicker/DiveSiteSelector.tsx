import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Database } from '@/types/database';

interface DiveSiteSelectorProps {
  diveSites: Database['public']['Tables']['dive_sites']['Row'][] | null;
  selectedDiveSiteId: string | null;
}

const DiveSiteSelector: React.FC<DiveSiteSelectorProps> = ({
  diveSites,
  selectedDiveSiteId,
}) => {
  const handleOpenDiveSitePicker = () => {
    router.push('/modal/dive-site-picker');
  };

  return (
    <TouchableOpacity 
      style={styles.diveSiteSelector}
      onPress={handleOpenDiveSitePicker}
    >
      <Text style={selectedDiveSiteId ? styles.diveSiteSelectedText : styles.diveSitePlaceholderText}>
        {selectedDiveSiteId 
          ? diveSites?.find(site => site.id === selectedDiveSiteId)?.name 
          : "Select a dive site"}
      </Text>
      <Text style={styles.diveSiteSelectorIcon}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  diveSiteSelector: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    backgroundColor: COLORS.SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  diveSiteSelectorIcon: {
    color: COLORS.PRIMARY,
  },
  diveSitePlaceholderText: {
    color: COLORS.TEXT_TERTIARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
  diveSiteSelectedText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
});

export default DiveSiteSelector;