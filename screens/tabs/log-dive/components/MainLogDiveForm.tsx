import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Database } from '@/types/database';
import DiveSiteSelector from './DiveSiteSelector';
import DiveSiteMap from './DiveSiteMap';
import DateTimePickerSection from './DateTimePickerSection';
import DiveTypeDepthSection from './DiveTypeDepthSection';
import DiveNotesSection from './DiveNotesSection';
import ImagePickerSection from './ImagePickerSection';
import CreatureSelector from './CreatureSelector';
import { ROUTES } from '@/constants/routes';
import { router } from 'expo-router';

interface SelectedImage {
  uri: string;
  type: string;
  fileName: string;
}

interface FormData {
  diveSiteId: string | null;
  date: Date;
  timeOfDay: string;
  diveType: string;
  depth: string;
  diveNotes: string;
  imageUrl: string;
  creatureId: string | null;
}

interface MainLogDiveFormProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  diveSites: Database['public']['Tables']['dive_sites']['Row'][] | null;
  catalog: any;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedImage: SelectedImage | null;
  setSelectedImage: (image: SelectedImage | null) => void;
  handleSubmit: () => void;
  diveSiteSearchQuery: string;
  setDiveSiteSearchQuery: (query: string) => void;
  showDiveSiteSearch: boolean;
  setShowDiveSiteSearch: (show: boolean) => void;
}

const MainLogDiveForm: React.FC<MainLogDiveFormProps> = ({
  formData,
  setFormData,
  diveSites,
  catalog,
  selectedCategories,
  setSelectedCategories,
  selectedImage,
  setSelectedImage,
  handleSubmit,
  diveSiteSearchQuery,
  setDiveSiteSearchQuery,
  showDiveSiteSearch,
  setShowDiveSiteSearch,
}) => {
  const handleDiveSiteSelect = (siteId: string) => {
    setFormData({
      ...formData,
      diveSiteId: siteId,
    });
    setShowDiveSiteSearch(false);
    setDiveSiteSearchQuery('');
  };

  const handleDeselectDiveSite = () => {
    setFormData({
      ...formData,
      diveSiteId: null,
    });
    setDiveSiteSearchQuery('');
  };

  const handleDateChange = (date: Date) => {
    setFormData({
      ...formData,
      date,
    });
  };

  const handleTimeOfDayChange = (timeOfDay: string) => {
    setFormData({
      ...formData,
      timeOfDay,
    });
  };

  const handleDiveTypeChange = (diveType: string) => {
    setFormData({
      ...formData,
      diveType,
    });
  };

  const handleDepthChange = (depth: string) => {
    setFormData({
      ...formData,
      depth,
    });
  };

  const handleDiveNotesChange = (diveNotes: string) => {
    setFormData({
      ...formData,
      diveNotes,
    });
  };

  const handleImageSelected = (image: SelectedImage) => {
    setSelectedImage(image);
    setFormData({
      ...formData,
      imageUrl: image.uri,
    });
  };

  const handleImageRemoved = () => {
    setSelectedImage(null);
    setFormData({
      ...formData,
      imageUrl: '',
    });
  };

  const handleCreatureChange = (creatureId: string | null) => {
    setFormData({
      ...formData,
      creatureId,
    });
  };

  return (
    <ScrollView 
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      // Allow maps to handle gestures by not intercepting them
      onStartShouldSetResponderCapture={() => false}
      onMoveShouldSetResponderCapture={() => false}
      onResponderTerminationRequest={() => false}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Record your dive detail and Creature spotted</Text>
      </View>

      <View style={styles.content}>
        <DiveSiteSelector
          diveSites={diveSites}
          selectedDiveSiteId={formData.diveSiteId}
          showDiveSiteSearch={showDiveSiteSearch}
          setShowDiveSiteSearch={setShowDiveSiteSearch}
          diveSiteSearchQuery={diveSiteSearchQuery}
          setDiveSiteSearchQuery={setDiveSiteSearchQuery}
          handleDiveSiteSelect={handleDiveSiteSelect}
          onAddNewDiveSite={() => router.push(ROUTES.DIVE_SITES.ADD)}
        />

        <DiveSiteMap
          diveSites={diveSites}
          selectedDiveSiteId={formData.diveSiteId}
          onDeselectDiveSite={handleDeselectDiveSite}
          onDiveSiteSelect={handleDiveSiteSelect}
        />

        <DateTimePickerSection
          date={formData.date}
          timeOfDay={formData.timeOfDay}
          onDateChange={handleDateChange}
          onTimeOfDayChange={handleTimeOfDayChange}
        />

        <DiveTypeDepthSection
          diveType={formData.diveType}
          depth={formData.depth}
          onDiveTypeChange={handleDiveTypeChange}
          onDepthChange={handleDepthChange}
        />

        <DiveNotesSection
          diveNotes={formData.diveNotes}
          onDiveNotesChange={handleDiveNotesChange}
        />

        <ImagePickerSection
          selectedImage={selectedImage}
          onImageSelected={handleImageSelected}
          onImageRemoved={handleImageRemoved}
        />

        <CreatureSelector
          catalog={catalog}
          selectedCategories={selectedCategories}
          creatureId={formData.creatureId}
          onCategoryChange={setSelectedCategories}
          onCreatureChange={handleCreatureChange}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Log Dive</Text>
      </TouchableOpacity>
    </ScrollView>
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

export default MainLogDiveForm;