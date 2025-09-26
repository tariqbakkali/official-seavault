import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useCatalogStore } from '../../../stores/catalog/store/store';
import { useSightingsStore } from '../../../stores/sightings/store/store';
import { useDiveSitesStore } from '../../../stores/diveSites/store/store';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { COLORS } from '@/constants';
import MainLogDiveForm from './components/MainLogDiveForm';

// Types
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

const LogDiveScreen = () => {
  const insets = useSafeAreaInsets();
  const { selectedCategory, selectedCreature, source } = useLocalSearchParams();
  
  const [formData, setFormData] = useState<FormData>({
    diveSiteId: null,
    date: new Date(),
    timeOfDay: '',
    diveType: '',
    depth: '',
    diveNotes: '',
    imageUrl: '',
    creatureId: null,
  });

  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showDiveSiteSearch, setShowDiveSiteSearch] = useState(false);
  const [diveSiteSearchQuery, setDiveSiteSearchQuery] = useState('');

  const { catalog, fetchCatalog } = useCatalogStore();
  const { createSighting } = useSightingsStore();
  const { diveSites, fetchDiveSites } = useDiveSitesStore();

  // Fetch catalog data and dive sites on component mount
  useEffect(() => {
    fetchCatalog();
    fetchDiveSites();
  }, []);

  // Set selected category and creature if passed from navigation
  useEffect(() => {
    if (selectedCategory && typeof selectedCategory === 'string') {
      setSelectedCategories([selectedCategory]);
    }
    
    if (selectedCreature && typeof selectedCreature === 'string') {
      setFormData(prev => ({
        ...prev,
        creatureId: selectedCreature
      }));
    }
  }, [selectedCategory, selectedCreature]);

  // Clear selected categories when component unmounts
  useEffect(() => {
    return () => {
      setSelectedCategories([]);
    };
  }, []);

  const handleSubmit = async () => {
    try {
      // Format time of day from the time picker
      const timeOfDay = formData.timeOfDay;
      
      // Create sighting for the main creature only
      const sightingData = {
        dive_site_id: formData.diveSiteId,
        dive_type: formData.diveType || null,
        date: formData.date.toISOString().split('T')[0],
        dive_notes: formData.diveNotes || null,
        depth: formData.depth || null,
        creature_id: formData.creatureId || null, // Use the main creature ID
        image_url: formData.imageUrl || null,
        time_of_day: timeOfDay || null,
        creature_notes: null, // No creature notes for main creature selection
      };
      
      // Create the sighting
      const result = await createSighting(sightingData as any); // Cast to any to avoid TypeScript issues
      
      // Reset form
      setFormData({
        diveSiteId: null,
        date: new Date(),
        timeOfDay: '',
        diveType: '',
        depth: '',
        diveNotes: '',
        imageUrl: '',
        creatureId: null,
      });
      
      // Reset image selection
      setSelectedImage(null);
      setSelectedCategories([]); // Clear category selections
    } catch (error) {
      alert('Error submitting dive log. Please try again.');
    }
  };

  // Determine if we should show back button based on navigation source
  const shouldShowBackButton = source === 'creature';

  const handleBackPress = () => {
    // Clear selected categories before navigating back
    setSelectedCategories([]);
    
    if (shouldShowBackButton && selectedCreature) {
      // Navigate back to the specific creature details screen
      router.push(`/creatures/${selectedCreature}`);
    } else {
      // Default back navigation for other cases
      router.back();
    }
  };

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top, 
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      <ScreenHeader 
        title="Log Dive" 
        onBackPress={handleBackPress}
        showBackButton={shouldShowBackButton}
      />
      <MainLogDiveForm
        formData={formData}
        setFormData={setFormData}
        diveSites={diveSites}
        catalog={catalog}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        handleSubmit={handleSubmit}
        diveSiteSearchQuery={diveSiteSearchQuery}
        setDiveSiteSearchQuery={setDiveSiteSearchQuery}
        showDiveSiteSearch={showDiveSiteSearch}
        setShowDiveSiteSearch={setShowDiveSiteSearch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
});

export default LogDiveScreen;