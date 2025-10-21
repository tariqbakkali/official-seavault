import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface DateTimePickerSectionProps {
  date: Date;
  timeOfDay: string;
  onDateChange: (date: Date) => void;
  onTimeOfDayChange: (timeOfDay: string) => void;
}

const DateTimePickerSection: React.FC<DateTimePickerSectionProps> = ({
  date,
  timeOfDay,
  onDateChange,
  onTimeOfDayChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);


  // Get today's date with time set to end of day to allow today's date
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Parse timeOfDay string to create a Date object for the time picker
  const parseTimeOfDay = (timeString: string): Date => {
    if (!timeString) return new Date();
    
    // If it's already in HH:MM:SS format
    if (timeString.includes(':')) {
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      const timeDate = new Date();
      timeDate.setHours(hours || 0, minutes || 0, seconds || 0, 0);
      return timeDate;
    }
    
    // If it's in the old format (morning, afternoon, etc.), default to current time
    const timeDate = new Date();
    return timeDate;
  };

  // Format time as HH:MM:SS
  const formatTime = (date: Date): string => {
    return date.toTimeString().slice(0, 8);
  };

  return (
    <View style={styles.dateTimeContainer}>
      <View style={styles.dateContainer}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {date.toLocaleDateString()}
          </Text>
          <Text style={styles.datePickerIcon}>📅</Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            maximumDate={today}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                onDateChange(selectedDate);
              }
            }}
          />
        )}
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.label}>Time</Text>
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateText}>
            {timeOfDay || 'Select time'}
          </Text>
          <Text style={styles.datePickerIcon}>⏰</Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={parseTimeOfDay(timeOfDay)}
          mode="time"
          display="spinner"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              onTimeOfDayChange(formatTime(selectedTime));
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACE_XL,
  },
  dateContainer: {
    flex: 1,
    marginRight: DIMENSIONS.SPACE_XS,
  },
  timeContainer: {
    flex: 1,
    marginLeft: DIMENSIONS.SPACE_MD,
  },
  label: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    backgroundColor: COLORS.SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_TERTIARY,
  },
  datePickerIcon: {
    color: COLORS.PRIMARY,
  },
});

export default DateTimePickerSection;