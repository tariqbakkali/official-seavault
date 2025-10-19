import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import ScreenHeader from '@/components/ui/ScreenHeader';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const diveTypes = ['recreational', 'technical', 'night', 'drift', 'wreck', 'cave'];

const DiveTypePickerModal = () => {
  const router = useRouter();
  const { currentDiveType } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const handleDiveTypeSelect = (diveType: string) => {
    // Navigate back with the selected dive type
    router.push({
      pathname: '/(tabs)/log-dive',
      params: {
        selectedDiveType: diveType
      }
    });
  };

  const handleClear = () => {
    router.push({
      pathname: '/(tabs)/log-dive',
      params: {
        selectedDiveType: ''
      }
    });
  };

  const handleCancel = () => {
    router.push('/(tabs)/log-dive');
  };

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top + 10, 
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      <ScreenHeader 
        title="Select Dive Type" 
        onBackPress={handleCancel}
        showBackButton={true}
      />
      
      <ScrollView 
        style={styles.content}
        // Allow maps to handle gestures by not intercepting them
        onStartShouldSetResponderCapture={() => false}
        onMoveShouldSetResponderCapture={() => false}
        onResponderTerminationRequest={() => false}
      >
        <TouchableOpacity
          style={styles.optionItem}
          onPress={handleClear}
        >
          <Text style={[
            styles.optionText, 
            { color: !currentDiveType ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY }
          ]}>
            Clear Selection
          </Text>
        </TouchableOpacity>
        
        {diveTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={styles.optionItem}
            onPress={() => handleDiveTypeSelect(type)}
          >
            <Text style={[
              styles.optionText, 
              { color: currentDiveType === type ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY }
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    maxHeight: SCREEN_HEIGHT * 0.9, // 90% of screen height
  },
  content: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
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

export default DiveTypePickerModal;