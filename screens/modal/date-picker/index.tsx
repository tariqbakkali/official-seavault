import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { ROUTES } from '@/constants/routes';
import ScreenHeader from '@/components/ui/ScreenHeader';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DatePickerModal = () => {
  const router = useRouter();
  const { currentDate } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // Parse the passed date or use today's date
  const initialDate = currentDate 
    ? new Date(currentDate as string) 
    : new Date();
    
  // Get today's date with time set to end of day to allow today's date
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleConfirm = () => {
    // Navigate back with the selected date
    router.push({
      pathname: ROUTES.TABS.LOG_DIVE,
      params: {
        selectedDate: selectedDate.toISOString()
      }
    });
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
        title="Select Date" 
        onBackPress={handleCancel}
        showBackButton={true}
      />
      
      <View style={styles.content}>
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner" // Using spinner to avoid the black dropdown issue
          maximumDate={today}
          onChange={handleDateChange}
          textColor={COLORS.TEXT_PRIMARY} // Explicitly setting text color
          style={styles.dateTimePicker}
        />
        
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
    padding: DIMENSIONS.PADDING_HORIZONTAL,
    justifyContent: 'center',
  },
  dateTimePicker: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    // Explicitly setting text colors to ensure visibility
    color: COLORS.TEXT_PRIMARY,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DIMENSIONS.SPACE_XL,
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

export default DatePickerModal;