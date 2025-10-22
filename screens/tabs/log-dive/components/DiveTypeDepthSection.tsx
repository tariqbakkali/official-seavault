import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ruler } from 'lucide-react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import SelectionModal from '@/components/ui/SelectionModal';

interface DiveTypeDepthSectionProps {
  diveType: string;
  depth: string;
  onDiveTypeChange: (diveType: string) => void;
  onDepthChange: (depth: string) => void;
}

const DiveTypeDepthSection: React.FC<DiveTypeDepthSectionProps> = ({
  diveType,
  depth,
  onDiveTypeChange,
  onDepthChange,
}) => {
  const [showDiveTypeModal, setShowDiveTypeModal] = useState(false);
  const diveTypes = [
    { value: 'Recreational', label: 'Recreational' },
    { value: 'Technical', label: 'Technical' },
    { value: 'Night', label: 'Night' },
    { value: 'Drift', label: 'Drift' },
    { value: 'Wreck', label: 'Wreck' },
    { value: 'Cave', label: 'Cave' }
  ];
  
  return (
    <View style={styles.section}>
      <View style={styles.diveTypeDepthContainer}>
        <View style={styles.diveTypeContainer}>
          <Text style={styles.label}>Dive Type</Text>
          <TouchableOpacity 
            style={styles.pickerContainer}
            onPress={() => setShowDiveTypeModal(true)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.pickerText}>
                {diveType || 'Select dive type'}
              </Text>
              <Text style={{ color: COLORS.TEXT_TERTIARY, fontSize: TYPOGRAPHY.SIZE_XL }}>▼</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.depthContainer}>
          <Text style={styles.label}>Depth (m)</Text>
          <View style={styles.depthInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Depth"
              placeholderTextColor={COLORS.TEXT_TERTIARY}
              value={depth}
              onChangeText={onDepthChange}
              keyboardType="numeric"
            />
            <Ruler 
              size={20} 
              color={COLORS.TEXT_TERTIARY} 
              style={styles.depthIcon} 
            />
          </View>
        </View>
      </View>

      <SelectionModal
        visible={showDiveTypeModal}
        title="Select Dive Type"
        options={diveTypes}
        selectedValue={diveType}
        onClose={() => setShowDiveTypeModal(false)}
        onSelection={onDiveTypeChange}
        showClearOption={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  label: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  diveTypeDepthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DIMENSIONS.SPACE_LG,
  },
  diveTypeContainer: {
    flex: 1,
  },
  depthContainer: {
    flex: 1,
  },
  depthInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    backgroundColor: COLORS.SURFACE,
    padding: DIMENSIONS.SPACE_LG,
  },
  textInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
    padding: 0,
  },
  depthIcon: {
    marginLeft: DIMENSIONS.SPACE_SM,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    backgroundColor: COLORS.SURFACE,
    padding: 14,
    justifyContent: 'center',    
    paddingHorizontal: DIMENSIONS.SPACE_MD,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  pickerText: {
    color: COLORS.TEXT_TERTIARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
});

export default DiveTypeDepthSection;