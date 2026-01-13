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
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import DiveSitePicker from './components/DiveSitePicker';
import DateTimePickerSection from './components/DateTimePickerSection';
import DiveMetricsSection from './components/DiveMetricsSection';
import TrainingSection from './components/TrainingSection';
import ModeSelection from './components/ModeSelection';
import DiveNotesSection from './components/DiveNotesSection';
import DiveConditionsSection from './components/DiveConditionsSection';
import MultipleCreatureSelector from './components/MultipleCreatureSelector';
import DiveTypeSelector from './components/DiveTypeSelector';
import InstructorPicker from './components/InstructorPicker';
import { useLogDive } from './hooks/useLogDive';
import { tempSelectionStore$, clearTempInstructor } from '@/stores/tempSelectionStore';
import { useSelector } from '@legendapp/state/react';

const LogDiveScreen = () => {
  const insets = useSafeAreaInsets();
  const { selectedDiveSiteId } = useLocalSearchParams();
  // Get temp selection from store
  const tempSelection = useSelector(() => tempSelectionStore$.get());

  // State to control ScrollView scrolling
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // New state for initial loading screen
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowInitialLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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
    handleDepthUnitChange,
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

  // Update form data if instructor was selected via store
  React.useEffect(() => {
    if (tempSelection.instructor) {
      setFormData(prev => ({
        ...prev,
        instructorId: tempSelection.instructor!.id,
        instructorName: tempSelection.instructor!.name,
      }));
      // Clear the store so it doesn't re-trigger unwantedly later (though likely fine if check changes)
      // Actually best to clear it after consuming?
      // Let's clear it
      setTimeout(() => clearTempInstructor(), 100);
    }
  }, [tempSelection.instructor]);

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

  // Show loading screen only during initial load (500ms)
  // Don't wait for data to load - show form even if categories are empty
  if (showInitialLoading) {
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
        <LoadingScreen message="Preparing dive log..." />
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
          {/* 1. Mode Selection */}
          <ModeSelection
            mode={formData.diveMode}
            onModeChange={(mode) => setFormData({ ...formData, diveMode: mode })}
          />

          <DiveTypeSelector
            selectedType={formData.diveType}
            onSelect={(type) => setFormData({ ...formData, diveType: type })}
          />

          {/* 2. Dive Site Picker */}
          <DiveSitePicker
            diveSites={diveSitesArray}
            selectedDiveSiteId={formData.diveSiteId}
            onDeselectDiveSite={handleDeselectDiveSite}
            onDiveSiteSelect={handleDiveSiteSelect}
            // Pass scroll control functions to disable/enable parent scroll
            onMapGestureBegin={() => setScrollEnabled(false)}
            onMapGestureEnd={enableScroll}
          />

          {/* 3. Date & Time */}
          <DateTimePickerSection
            date={formData.date}
            timeOfDay={formData.timeOfDay}
            onDateChange={(date) => setFormData({ ...formData, date })}
            onTimeOfDayChange={(timeOfDay) =>
              setFormData({ ...formData, timeOfDay })
            }
          />

          {/* 4. Dive Metrics (Deep, Time, Air) */}
          <DiveMetricsSection
            timeIn={formData.timeIn}
            timeOut={formData.timeOut}
            airIn={formData.airIn}
            airOut={formData.airOut}
            airUnit={formData.airUnit}
            depth={formData.depth}
            onTimeInChange={(timeIn) => setFormData({ ...formData, timeIn })}
            onTimeOutChange={(timeOut) => setFormData({ ...formData, timeOut })}
            onAirInChange={(airIn) => setFormData({ ...formData, airIn })}
            onAirOutChange={(airOut) => setFormData({ ...formData, airOut })}
            onAirUnitChange={(airUnit) => setFormData({ ...formData, airUnit })}
            onDepthChange={(depth) => setFormData({ ...formData, depth })}
            depthUnit={formData.depthUnit}
            onDepthUnitChange={handleDepthUnitChange}
          />

          {/* Instructor Section (Training Only) */}
          {formData.diveMode === 'training' && (
            <InstructorPicker
              instructorName={formData.instructorName}
              onClear={() => setFormData({ ...formData, instructorName: null, instructorId: null })}
            />
          )}

          {/* 5. Training Section (only if Training mode) */}
          {formData.diveMode === 'training' && (
            <TrainingSection
              courseType={formData.courseType}
              completedSkills={formData.completedSkills}
              onCourseTypeChange={(courseType) => setFormData({ ...formData, courseType })}
              onSkillToggle={(skillId) => {
                const newSkills = { ...formData.completedSkills };
                newSkills[skillId] = !newSkills[skillId];
                setFormData({ ...formData, completedSkills: newSkills });
              }}
            />
          )}

          {/* 6. Conditions (Duration, Weather, Vis, Current) */}
          <DiveConditionsSection
            duration={formData.duration}
            weather={formData.weather}
            visibility={formData.visibility}
            current={formData.current}
            waterway={formData.waterway}
            onDurationChange={(duration) => setFormData({ ...formData, duration })}
            onWeatherChange={(weather) => setFormData({ ...formData, weather })}
            onVisibilityChange={(visibility) => setFormData({ ...formData, visibility })}
            onCurrentChange={(current) => setFormData({ ...formData, current })}
            onWaterwayChange={(waterway) => setFormData({ ...formData, waterway })}
          />

          {/* 7. Notes */}
          <DiveNotesSection
            diveNotes={formData.diveNotes}
            onDiveNotesChange={(diveNotes) =>
              setFormData({ ...formData, diveNotes })
            }
          />

          {/* 8. Creatures (Sightings) */}
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
