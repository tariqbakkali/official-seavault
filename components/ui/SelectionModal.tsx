import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface SelectionOption {
  value: string;
  label: string;
}

interface SelectionModalProps {
  visible: boolean;
  title: string;
  options: SelectionOption[];
  selectedValue: string;
  onClose: () => void;
  onSelection: (value: string) => void;
  showClearOption?: boolean;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelection,
  showClearOption = false,
}) => {
  const insets = useSafeAreaInsets();

  const handleClear = () => {
    onSelection('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.content, { 
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right
        }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.optionsContainer}
            // Allow maps to handle gestures by not intercepting them
            onStartShouldSetResponderCapture={() => false}
            onMoveShouldSetResponderCapture={() => false}
            onResponderTerminationRequest={() => false}
          >
            {showClearOption && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={handleClear}
              >
                <Text style={[
                  styles.optionText, 
                  { color: !selectedValue ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY }
                ]}>
                  Clear Selection
                </Text>
              </TouchableOpacity>
            )}
            
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionItem}
                onPress={() => {
                  onSelection(option.value);
                  onClose();
                }}
              >
                <Text style={[
                  styles.optionText, 
                  { color: selectedValue === option.value ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DIMENSIONS.PADDING_HORIZONTAL,
    paddingTop: DIMENSIONS.SPACE_XXXL,
    paddingBottom: DIMENSIONS.SPACE_LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  title: {
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
  optionsContainer: {
    flex: 1,
  },
  optionItem: {
    paddingVertical: DIMENSIONS.SPACE_LG,
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  optionText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: COLORS.TEXT_PRIMARY,
  },
});

export default SelectionModal;