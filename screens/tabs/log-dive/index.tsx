import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useSyncedData } from '@/hooks/useSyncedData';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { COLORS } from '@/constants';
import { showAlert } from '@/utils/alertUtils';
import MainLogDiveForm from './components/MainLogDiveForm';
import { Database } from '@/types/database';

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

  const { creatures: allCreatures, categories: allCategories, diveSites: allDiveSites, createSighting, isLoading } = useSyncedData();

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

  // Extract data from observables
  const creaturesArray = allCreatures ? Object.values(allCreatures) : [];
  const categoriesArray = allCategories ? Object.values(allCategories) : [];

  const diveSitesArray = allDiveSites ? Object.values(allDiveSites) as Database['public']['Tables']['dive_sites']['Row'][] : [];
  
  // Create mock catalog object to match the expected format
  const catalog = {
    creatures: creaturesArray as any[],
    categories: categoriesArray as any[],
    achievements: [] // We don't have achievements in observables
  };

  // Fetch catalog data and dive sites on component mount
  useEffect(() => {
    // Data is automatically available from observables
    // Just mark loading as complete
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
      await createSighting(sightingData as any); // Cast to any to avoid TypeScript issues
      
      // Check network status to determine if saved offline or online
      const networkState = await NetInfo.fetch();
      console.log('Network state:', networkState); // Debug log
      const isOnline = networkState.isConnected && networkState.isInternetReachable !== false;
      
      console.log('Is online:', isOnline); // Debug log
      
      // Show appropriate success message
      if (isOnline) {
        showAlert(
          'Dive Log Saved',
          'Your dive log has been saved successfully and synchronized with the cloud.'
        );
      } else {
        showAlert(
          'Dive Log Saved Offline',
          'Your dive log has been saved locally and will be synchronized when you\'re back online.'
        );
      }
      
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
      console.error('Error submitting dive log:', error);
      showAlert('Error', 'Error submitting dive log. Please try again.');
    }
  };

  if (isLoading.diveSites) {
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
        <Text style={{ color: COLORS.TEXT_PRIMARY, textAlign: 'center', marginTop: 20 }}>Loading dive sites...</Text>
      </View>
    );
  }

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
        diveSites={diveSitesArray}
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