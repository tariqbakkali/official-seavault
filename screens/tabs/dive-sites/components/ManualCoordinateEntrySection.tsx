import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FormSection from '@/components/ui/FormSection';
import { COLORS, DIMENSIONS } from '@/constants';

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
  // This section is now hidden as per user requirements
  return null;
};

export default ManualCoordinateEntrySection;
