import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '@/components/ui/ScreenHeader';
import ErrorDisplay from '@/components/ErrorDisplay';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import DiveSitePicker from './components/DiveSitePicker';
import DateTimePickerSection from './components/DateTimePickerSection';
import DiveTypeDepthSection from './components/DiveTypeDepthSection';
import DiveNotesSection from './components/DiveNotesSection';
import MultipleCreatureSelector from './components/MultipleCreatureSelector';
import { useLogDive } from './hooks/useLogDive';

const LogDiveScreen = () => {
  const insets = useSafeAreaInsets();
  const { selectedDiveSiteId } = useLocalSearchParams();

  // State to control ScrollView scrolling
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    // State
    formData,
    setFormData,
    selectedCategories,
    setSelectedCategories,
    isLoading,

    // Data
    diveSitesArray,
    catalog,

    // Handlers
    handleBackPress,
    handleDiveSiteSelect,
    handleDeselectDiveSite,
    handleSubmit,
    shouldShowBackButton,
    errors,
  } = useLogDive();

  // Update form data if a dive site was selected from the modal
  React.useEffect(() => {
    if (selectedDiveSiteId && typeof selectedDiveSiteId === 'string') {
      handleDiveSiteSelect(selectedDiveSiteId);
    }
  }, [selectedDiveSiteId]);

  // Function to safely enable scroll
  const enableScroll = () => {
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set a timeout to ensure the scroll is enabled
    scrollTimeoutRef.current = setTimeout(() => {
      setScrollEnabled(true);
    }, 100); // Small delay to ensure proper cleanup
  };

  if (isLoading.diveSites) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <ScreenHeader
          title="Log Dive"
          onBackPress={handleBackPress}
          showBackButton={shouldShowBackButton}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: DIMENSIONS.MARGIN_XL }}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text
            style={{
              color: COLORS.TEXT_PRIMARY,
              textAlign: 'center',
              marginTop: DIMENSIONS.MARGIN_MD,
            }}
          >
            Loading dive sites...
          </Text>
        </View>
      </View>
    );
  }

  // Convert error observable to string if needed
  const errorObj = errors?.diveSites;
  const hasError = errorObj && (typeof errorObj !== 'object' || Object.keys(errorObj).length > 0);
  
  const errorMessage = hasError ? 
    (typeof errorObj === 'object' ? JSON.stringify(errorObj) : String(errorObj)) : 
    null;

  if (errorMessage) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <ScreenHeader
          title="Log Dive"
          onBackPress={handleBackPress}
          showBackButton={shouldShowBackButton}
        />
        <ErrorDisplay 
          message={String(errorMessage)} 
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <ScreenHeader
        title="Log Dive"
        onBackPress={handleBackPress}
        showBackButton={shouldShowBackButton}
      />
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        scrollEnabled={scrollEnabled} // Control scroll behavior
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <DiveSitePicker
            diveSites={diveSitesArray}
            selectedDiveSiteId={formData.diveSiteId}
            onDeselectDiveSite={handleDeselectDiveSite}
            onDiveSiteSelect={handleDiveSiteSelect}
            // Pass scroll control functions to disable/enable parent scroll
            onMapGestureBegin={() => setScrollEnabled(false)}
            onMapGestureEnd={enableScroll}
          />

          <DateTimePickerSection
            date={formData.date}
            timeOfDay={formData.timeOfDay}
            onDateChange={(date) => setFormData({ ...formData, date })}
            onTimeOfDayChange={(timeOfDay) =>
              setFormData({ ...formData, timeOfDay })
            }
          />

          <DiveTypeDepthSection
            diveType={formData.diveType}
            depth={formData.depth}
            onDiveTypeChange={(diveType) =>
              setFormData({ ...formData, diveType })
            }
            onDepthChange={(depth) => setFormData({ ...formData, depth })}
          />

          <DiveNotesSection
            diveNotes={formData.diveNotes}
            onDiveNotesChange={(diveNotes) =>
              setFormData({ ...formData, diveNotes })
            }
          />

          <MultipleCreatureSelector
            catalog={catalog}
            selectedCategories={selectedCategories}
            creatureSightings={formData.creatureSightings}
            onCategoryChange={setSelectedCategories}
            onCreatureSightingsChange={(creatureSightings) =>
              setFormData({ ...formData, creatureSightings })
            }
          />

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Log Dive</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    padding: DIMENSIONS.PADDING_HORIZONTAL,
    backgroundColor: COLORS.SURFACE,
    paddingTop: DIMENSIONS.SPACE_LG,
    paddingBottom: DIMENSIONS.SPACE_LG,
  },
  headerText: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  content: {
    padding: DIMENSIONS.PADDING_HORIZONTAL,
    paddingTop: DIMENSIONS.SPACE_LG,
    paddingBottom: DIMENSIONS.SPACE_LG,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACE_LG,
    marginBottom: DIMENSIONS.SPACE_LG,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
  },
  submitButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
});

export default LogDiveScreen;
