import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useSyncedData } from '@/hooks/useSyncedData';
import { showAlert } from '@/utils/alertUtils';
import { ROUTES } from '@/constants/routes';
import { Database } from '@/types/database';

// Types
// Removed SelectedImage interface as it's no longer needed

// New interface for creature sighting data
interface CreatureSighting {
  creatureId: string | null;
  notes: string | null;
  imageUrl: string | null;
}

interface FormData {
  diveSiteId: string | null;
  date: Date;
  timeOfDay: string;
  diveType: string;
  depth: string;
  diveNotes: string;
  creatureSightings: CreatureSighting[];
  // New fields
  duration: string;
  weather: string | null;
  visibility: string | null;
  current: string | null;
}

export const useLogDive = () => {
  const { selectedCategory, selectedCreature, source } = useLocalSearchParams();
  
  const [formData, setFormData] = useState<FormData>({
    diveSiteId: null,
    date: new Date(),
    timeOfDay: '',
    diveType: '',
    depth: '',
    diveNotes: '',
    creatureSightings: [],
    // New fields initial state
    duration: '',
    weather: null,
    visibility: null,
    current: null,
  });

  // Removed selectedImage state as it's no longer needed
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { creatures: allCreatures, categories: allCategories, diveSites: allDiveSites, createSighting, isLoading, errors } = useSyncedData();

  // Determine if we should show back button based on navigation source
  const shouldShowBackButton = source === 'creature';

  // Extract data from observables
  const creaturesArray = allCreatures ? Object.values(allCreatures) : [];
  const categoriesArray = allCategories ? Object.values(allCategories) : [];

  const diveSitesArray = allDiveSites ? Object.values(allDiveSites) as unknown as Database['public']['Tables']['dive_sites']['Row'][] : [];
  
  // Create mock catalog object to match the expected format
  const catalog = {
    creatures: creaturesArray as any[],
    categories: categoriesArray as any[],
    achievements: [] // We don't have achievements in observables
  };

  // Set selected category and creature if passed from navigation
  useEffect(() => {
    if (selectedCategory && typeof selectedCategory === 'string') {
      setSelectedCategories([selectedCategory]);
    }
    
    if (selectedCreature && typeof selectedCreature === 'string') {
      setFormData(prev => ({
        ...prev,
        creatureSightings: [{ creatureId: selectedCreature, notes: null, imageUrl: null }],
      }));
    }
  }, [selectedCategory, selectedCreature]);

  // Clear selected categories when component unmounts
  useEffect(() => {
    return () => {
      setSelectedCategories([]);
    };
  }, []);

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

  const handleDiveSiteSelect = (siteId: string) => {
    setFormData({
      ...formData,
      diveSiteId: siteId,
    });
  };

  const handleDeselectDiveSite = () => {
    setFormData({
      ...formData,
      diveSiteId: null,
    });
  };

  const handleSubmit = async () => {
    try {
      // Format time of day from the time picker
      const timeOfDay = formData.timeOfDay;
      
      // Create sightings for all selected creatures
      const sightingPromises = formData.creatureSightings.map(async (sighting) => {
        const sightingData = {
          dive_site_id: formData.diveSiteId,
          dive_type: formData.diveType || null,
          date: formData.date.toISOString().split('T')[0],
          dive_notes: formData.diveNotes || null,
          depth: formData.depth || null,
          creature_id: sighting.creatureId || null,
          image_url: sighting.imageUrl || null,
          time_of_day: timeOfDay || null,
          creature_notes: sighting.notes || null,
          // New fields mapped to Sighting
          duration: formData.duration ? parseInt(formData.duration, 10) : null,
          weather: formData.weather,
          visibility: formData.visibility,
          current: formData.current,
        };
        
        return createSighting(sightingData as any); // Cast to any to avoid TypeScript issues
      });
      
      // Create all sightings
      await Promise.all(sightingPromises);
      
      // Check network status to determine if saved offline or online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable !== false;
      
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
        creatureSightings: [],
        duration: '',
        weather: null,
        visibility: null,
        current: null,
      });
      
      // Removed setSelectedImage reset
      setSelectedCategories([]); // Clear category selections
    } catch (error) {
      console.error('Error submitting dive log:', error);
      showAlert('Error', 'Error submitting dive log. Please try again.');
    }
  };

  return {
    // State
    formData,
    setFormData,
    // Removed selectedImage and setSelectedImage
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
  };
};