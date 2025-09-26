import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FormField from '@/components/forms/FormField';
import FormSection from '@/components/ui/FormSection';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface ManualCoordinateEntrySectionProps {
  latitude: string;
  setLatitude: (value: string) => void;
  longitude: string;
  setLongitude: (value: string) => void;
  validationErrors: string[];
}

const ManualCoordinateEntrySection: React.FC<ManualCoordinateEntrySectionProps> = ({
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  validationErrors
}) => {
  // Get validation errors for specific fields
  const getCoordinateError = () => validationErrors.find(error => error.includes('coordinate'));

  return (
    <FormSection title="Or Enter Coordinates Manually">
      <FormField
        label="Latitude"
        value={latitude}
        onChangeText={setLatitude}
        placeholder="Enter latitude (e.g., 52.4509572)"
        keyboardType="numeric"
        error={getCoordinateError() && validationErrors.find(error => error.includes('Latitude'))}
      />
      
      <FormField
        label="Longitude"
        value={longitude}
        onChangeText={setLongitude}
        placeholder="Enter longitude (e.g., 4.8854407)"
        keyboardType="numeric"
        error={getCoordinateError() && validationErrors.find(error => error.includes('Longitude'))}
      />
      
      <Text style={styles.helperText}>
        Note: Coordinates are required to add a new dive site to the map
      </Text>
    </FormSection>
  );
};

const styles = StyleSheet.create({
  helperText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
    fontStyle: 'italic',
    marginTop: DIMENSIONS.SPACE_XS,
  },
});

export default ManualCoordinateEntrySection;