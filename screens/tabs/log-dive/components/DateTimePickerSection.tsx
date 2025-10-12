import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface DateTimePickerSectionProps {
  date: Date;
  timeOfDay: string;
  onDateChange: (date: Date) => void;
  onTimeOfDayChange: (timeOfDay: string) => void;
}

const timeOfDayOptions = [
  { value: 'morning', label: 'Morning (6am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 6pm)' },
  { value: 'evening', label: 'Evening (6pm - 10pm)' },
  { value: 'night', label: 'Night (10pm - 6am)' },
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
            {timeOfDay || 'Time of day'}
          </Text>
          <Text style={styles.datePickerIcon}>⏰</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Time of Day Selection */}
      <Modal
        visible={showTimeOfDayModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowTimeOfDayModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Time of Day</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowTimeOfDayModal(false)}
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
                onTimeOfDayChange('');
                setShowTimeOfDayModal(false);
              }}
            >
              <Text style={[styles.modalItemText, { color: !timeOfDay ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY }]}>
                Select time of day
              </Text>
            </TouchableOpacity>
            
            {timeOfDayOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalItem}
                onPress={() => {
                  onTimeOfDayChange(option.value);
                  setShowTimeOfDayModal(false);
                }}
              >
                <Text style={[styles.modalItemText, { color: timeOfDay === option.value ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY }]}>
                  {option.label}
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

export default DateTimePickerSection;