import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface DiveNotesSectionProps {
  diveNotes: string;
  onDiveNotesChange: (notes: string) => void;
}

const DiveNotesSection: React.FC<DiveNotesSectionProps> = ({
  diveNotes,
  onDiveNotesChange,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Dive Notes</Text>
      <TextInput
        style={[styles.textInput, styles.textArea]}
        placeholder="Describe your dive experience, conditions, observations..."
        placeholderTextColor={COLORS.TEXT_TERTIARY}
        value={diveNotes}
        onChangeText={onDiveNotesChange}
        multiline
        numberOfLines={4}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: DIMENSIONS.SPACE_XL,
  },
  label: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    backgroundColor: COLORS.SURFACE,
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default DiveNotesSection;