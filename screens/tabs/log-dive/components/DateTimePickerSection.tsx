import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import SelectionModal from '@/components/ui/SelectionModal';

interface DateTimePickerSectionProps {
  date: Date;
  timeOfDay: string;
  onDateChange: (date: Date) => void;
  onTimeOfDayChange: (timeOfDay: string) => void;
}

// Define time of day options with display labels and selection labels
const timeOfDayOptions = [
  { value: 'morning', label: 'Morning (6am - 12pm)', displayLabel: 'Morning' },
  { value: 'afternoon', label: 'Afternoon (12pm - 6pm)', displayLabel: 'Afternoon' },
  { value: 'evening', label: 'Evening (6pm - 10pm)', displayLabel: 'Evening' },
  { value: 'night', label: 'Night (10pm - 6am)', displayLabel: 'Night' },
];

const DateTimePickerSection: React.FC<DateTimePickerSectionProps> = ({
  date,
  timeOfDay,
  onDateChange,
  onTimeOfDayChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeOfDayModal, setShowTimeOfDayModal] = useState(false);

  // Get today's date with time set to end of day to allow today's date
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Function to get the display label for the selected time of day
  const getTimeOfDayDisplayLabel = (value: string) => {
    const option = timeOfDayOptions.find(opt => opt.value === value);
    return option ? option.displayLabel : value;
  };

  // Function to get the full label for the modal
  const getTimeOfDayFullLabel = (value: string) => {
    const option = timeOfDayOptions.find(opt => opt.value === value);
    return option ? option.label : value;
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
        <Text style={styles.label}>Time of Day</Text>
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={() => setShowTimeOfDayModal(true)}
        >
          <Text style={styles.dateText}>
            {timeOfDay ? getTimeOfDayDisplayLabel(timeOfDay) : 'Select time'}
          </Text>
          <Text style={styles.datePickerIcon}>⏰</Text>
        </TouchableOpacity>
      </View>

      <SelectionModal
        visible={showTimeOfDayModal}
        title="Select Time of Day"
        options={timeOfDayOptions.map(opt => ({ value: opt.value, label: opt.label }))}
        selectedValue={timeOfDay}
        onClose={() => setShowTimeOfDayModal(false)}
        onSelection={onTimeOfDayChange}
        showClearOption={true}
      />
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
    padding: DIMENSIONS.SPACE_MD,
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