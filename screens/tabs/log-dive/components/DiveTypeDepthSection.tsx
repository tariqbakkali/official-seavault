import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [showDiveTypeDropdown, setShowDiveTypeDropdown] = useState(false);
  const diveTypes = ['Recreational', 'Technical', 'Night', 'Drift', 'Wreck', 'Cave'];
  const insets  =  useSafeAreaInsets();
  
  return (
    <View style={styles.section}>
      <View style={styles.diveTypeDepthContainer}>
        <View style={styles.diveTypeContainer}>
          <Text style={styles.label}>Dive Type</Text>
          <TouchableOpacity 
            style={styles.pickerContainer}
            onPress={() => setShowDiveTypeDropdown(true)}
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
          <TextInput
            style={styles.textInput}
            placeholder="Depth"
            placeholderTextColor={COLORS.TEXT_TERTIARY}
            value={depth}
            onChangeText={onDepthChange}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Modal for Dive Type Selection */}
      <Modal
        visible={showDiveTypeDropdown}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowDiveTypeDropdown(false)}
      >
        <View style={[styles.modalContainer,{paddingTop: insets.top}]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Dive Type</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDiveTypeDropdown(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            // Allow maps to handle gestures by not intercepting them
            onStartShouldSetResponderCapture={() => false}
            onMoveShouldSetResponderCapture={() => false}
            onResponderTerminationRequest={() => false}
          >
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                onDiveTypeChange('');
                setShowDiveTypeDropdown(false);
              }}
            >
              <Text style={[styles.modalItemText, { color: !diveType ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY }]}>
                Select dive type
              </Text>
            </TouchableOpacity>
            
            {diveTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalItem}
                onPress={() => {
                  onDiveTypeChange(type);
                  setShowDiveTypeDropdown(false);
                }}
              >
                <Text style={[styles.modalItemText, { color: diveType === type ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
    gap: DIMENSIONS.SPACE_MD,
  },
  diveTypeContainer: {
    flex: 2,
  },
  depthContainer: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    backgroundColor: COLORS.SURFACE,
    minHeight: DIMENSIONS.BUTTON_HEIGHT_MD,
    justifyContent: 'center',
    paddingHorizontal: DIMENSIONS.SPACE_MD,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  pickerText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_MD,
    backgroundColor: COLORS.SURFACE,
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DIMENSIONS.PADDING_HORIZONTAL,
    paddingTop: DIMENSIONS.SPACE_XXXL,
    paddingBottom: DIMENSIONS.SPACE_LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    padding: DIMENSIONS.SPACE_SM,
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  modalContent: {
    flex: 1,
  },
  modalItem: {
    paddingVertical: DIMENSIONS.SPACE_LG,
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  modalItemText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: COLORS.TEXT_PRIMARY,
  },
});

export default DiveTypeDepthSection;