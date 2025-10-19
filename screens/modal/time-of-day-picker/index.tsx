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
import { ROUTES } from '@/constants/routes';
import ScreenHeader from '@/components/ui/ScreenHeader';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const timeOfDayOptions = [
  { value: 'morning', label: 'Morning (6am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 6pm)' },
  { value: 'evening', label: 'Evening (6pm - 10pm)' },
  { value: 'night', label: 'Night (10pm - 6am)' },
];

const TimeOfDayPickerModal = () => {
  const router = useRouter();
  const { currentTimeOfDay } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [selectedTimeOfDay, setSelectedTimeOfDay] = React.useState<string>(
    (currentTimeOfDay as string) || ''
  );

  const handleTimeOfDaySelect = (timeOfDay: string) => {
    setSelectedTimeOfDay(timeOfDay);
  };

  const handleConfirm = () => {
    // Navigate back with the selected time of day
    router.push({
      pathname: ROUTES.TABS.LOG_DIVE,
      params: {
        selectedTimeOfDay: selectedTimeOfDay
      }
    });
  };

  const handleClear = () => {
    setSelectedTimeOfDay('');
  };

  const handleCancel = () => {
    router.push(ROUTES.TABS.LOG_DIVE);
  };

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top + 10, 
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      <ScreenHeader 
        title="Select Time of Day" 
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
            { color: !selectedTimeOfDay ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY }
          ]}>
            Clear Selection
          </Text>
        </TouchableOpacity>
        
        {timeOfDayOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.optionItem}
            onPress={() => handleTimeOfDaySelect(option.value)}
          >
            <Text style={[
              styles.optionText, 
              { color: selectedTimeOfDay === option.value ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY }
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.confirmButton]}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: DIMENSIONS.SPACE_XL,
  },
  button: {
    flex: 1,
    paddingVertical: DIMENSIONS.SPACE_LG,
    borderRadius: DIMENSIONS.RADIUS_MD,
    alignItems: 'center',
    marginHorizontal: DIMENSIONS.SPACE_SM,
  },
  cancelButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  confirmButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  cancelButtonText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  confirmButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
});

export default TimeOfDayPickerModal;