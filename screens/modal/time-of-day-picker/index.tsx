import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { ROUTES } from '@/constants/routes';
import ScreenHeader from '@/components/ui/ScreenHeader';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TimeOfDayPickerModal = () => {
  const router = useRouter();
  const { currentTimeOfDay } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // Parse the passed time or use current time
  const initialTime = currentTimeOfDay 
    ? parseTimeString(Array.isArray(currentTimeOfDay) ? currentTimeOfDay[0] : currentTimeOfDay)
    : new Date();
    
  const [selectedTime, setSelectedTime] = useState<Date>(initialTime);

  // Parse time string in HH:MM:SS format
  function parseTimeString(timeString: string): Date {
    if (!timeString) return new Date();
    
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours || 0, minutes || 0, seconds || 0, 0);
    return timeDate;
  }

  // Format time as HH:MM:SS
  const formatTime = (date: Date): string => {
    return date.toTimeString().slice(0, 8);
  };

  const handleTimeChange = (event: any, time?: Date) => {
    if (time) {
      setSelectedTime(time);
    }
  };

  const handleConfirm = () => {
    // Navigate back with the selected time in HH:MM:SS format
    router.push({
      pathname: ROUTES.TABS.LOG_DIVE,
      params: {
        selectedTimeOfDay: formatTime(selectedTime)
      }
    });
  };

  const handleClear = () => {
    setSelectedTime(new Date());
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
        title="Select Time" 
        onBackPress={handleCancel}
        showBackButton={true}
      />
      
      <View style={styles.content}>
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
          textColor={COLORS.TEXT_PRIMARY}
          style={styles.dateTimePicker}
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={handleClear}
          >
            <Text style={styles.cancelButtonText}>Clear</Text>
          </TouchableOpacity>
          
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

export default TimeOfDayPickerModal;