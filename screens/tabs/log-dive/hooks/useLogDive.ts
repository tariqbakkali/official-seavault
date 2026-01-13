import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useSyncedData } from '@/hooks/useSyncedData';
import { showAlert } from '@/utils/alertUtils';
import { feetToMeters, metersToFeet } from '@/utils/format';
import { ROUTES } from '@/constants/routes';
import { Database } from '@/types/database';

// Helper to calculate duration in minutes
const calculateDuration = (start: string, end: string): string => {
  if (!start || !end || !start.includes(':') || !end.includes(':')) return '';
  
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return '';
  
  const startDate = new Date();
  startDate.setHours(startH, startM, 0, 0);
  
  const endDate = new Date();
  endDate.setHours(endH, endM, 0, 0);
  
  // Handle crossing midnight
  if (endDate < startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMins = Math.round(diffMs / 60000);
  
  return diffMins > 0 ? diffMins.toString() : '';
};

// Interface for form data
// Removed SelectedImage as it's no longer needed

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
  diveMode: 'leisure' | 'training';
  diveType: string | null;
  depth: string;
  diveNotes: string;
  creatureSightings: CreatureSighting[];
  // New fields
  duration: string;
  weather: string | null;
  visibility: string | null;
  current: string | null;
  instructorName: string | null;
  instructorId: string | null;
  // Dive specific fields
  timeIn: string;
  timeOut: string;
  airIn: string;
  airOut: string;
  airUnit: 'bar' | 'psi';
  depthUnit: 'meters' | 'feet';
  courseType: string;
  completedSkills: Record<string, boolean>;
  waterway: string | null;
}

export const useLogDive = () => {
  const { selectedCategory, selectedCreature, source } = useLocalSearchParams();
  
  const [formData, setFormData] = useState<FormData>({
    diveSiteId: null,
    date: new Date(),
    timeOfDay: '',
    diveMode: 'leisure',
    diveType: null,
    depth: '',
    diveNotes: '',
    creatureSightings: [],
    // New fields initial state
    duration: '',
    weather: null,
    visibility: null,
    current: null,
    timeIn: '',
    timeOut: '',
    airIn: '',
    airOut: '',
    airUnit: 'bar',
    depthUnit: 'meters',
    courseType: 'open_water',
    completedSkills: {},
    waterway: null,
    instructorName: '',
    instructorId: null,
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

  // Auto-calculate duration when Time In or Time Out changes
  useEffect(() => {
    const { timeIn, timeOut } = formData;
    const calcDuration = calculateDuration(timeIn, timeOut);
    
    // Only update if we have a valid calculated duration
    if (calcDuration) {
      setFormData(prev => ({
        ...prev,
        duration: calcDuration
      }));
    }
  }, [formData.timeIn, formData.timeOut]);

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

  const handleDepthUnitChange = (unit: 'meters' | 'feet') => {
    // If changing unit, convert the current value if it exists
    let newDepth = formData.depth;
    
    if (formData.depth && !isNaN(parseFloat(formData.depth))) {
      const currentVal = parseFloat(formData.depth);
      if (unit === 'feet' && formData.depthUnit === 'meters') {
        // Meters to Feet
        newDepth = metersToFeet(currentVal).toFixed(1);
      } else if (unit === 'meters' && formData.depthUnit === 'feet') {
        // Feet to Meters
        newDepth = feetToMeters(currentVal).toFixed(1);
      }
    }

    setFormData({
      ...formData,
      depthUnit: unit,
      depth: newDepth
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate dive type requirements
      if (formData.diveMode === 'leisure' && formData.creatureSightings.length === 0) {
        showAlert('Missing Sightings', 'Leisure dives must have at least one creature sighting recorded.');
        return;
      }
      
      // Validate DB dive type
      if (!formData.diveType) {
         showAlert('Missing Type', 'Please select a dive type (Shore, Boat, etc).');
         return;
      }

      // Format time of day from the time picker
      const timeOfDay = formData.timeOfDay;
      
      let sightingsToCreate = [...formData.creatureSightings];
      
      // If no sightings but valid valid (training dive), create a placeholder sighting
      if (sightingsToCreate.length === 0) {
        sightingsToCreate.push({
            creatureId: null,
            notes: null,
            imageUrl: null
        });
      }
      
      // Create sightings with all dive data embedded
      const sightingPromises = sightingsToCreate.map(async (sighting) => {
        const sightingData = {
          // Dive-level data (stored in each sighting)
          dive_site_id: formData.diveSiteId,
          date: formData.date.toISOString().split('T')[0],
          time_in: formData.timeIn || null,
          time_out: formData.timeOut || null,
          duration: formData.duration ? parseInt(formData.duration, 10) : null,
   // Calculate depth in meters for storage
          depth: formData.depth ? (
            formData.depthUnit === 'feet' 
              ? feetToMeters(parseFloat(formData.depth)).toString() 
              : formData.depth
          ) : null,
          air_in: formData.airIn ? parseInt(formData.airIn, 10) : null,
          air_out: formData.airOut ? parseInt(formData.airOut, 10) : null,
          air_unit: formData.airUnit,
          depth_unit: formData.depthUnit,
          dive_type: formData.diveType, // Now storing real DB enum
          course_type: formData.diveMode === 'training' ? (formData.courseType || null) : null,
          skills_completed: formData.diveMode === 'training' ? Object.keys(formData.completedSkills).filter(skill => formData.completedSkills[skill]) : [],
          dive_notes: formData.diveNotes || null,
          weather: formData.weather || null,
          visibility: formData.visibility || null,
          current: formData.current || null,
          time_of_day: timeOfDay || null,
          instructor_id: formData.instructorId || null,
          instructor_name: formData.instructorName || null,
          waterway: formData.waterway || null,
          dive_mode: formData.diveMode,
          
          // Sighting-specific data
          creature_id: sighting.creatureId || null,
          image_url: sighting.imageUrl || null,
          creature_notes: sighting.notes || null,
        };
        
        return createSighting(sightingData as any); 
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
        diveMode: 'leisure',
        diveType: null,
        depth: '',
        diveNotes: '',
        creatureSightings: [],
        duration: '',
        weather: null,
        visibility: null,
        current: null,
        timeIn: '',
        timeOut: '',
        airIn: '',
        airOut: '',
        airUnit: 'bar',
        depthUnit: 'meters',
        courseType: 'open_water',
        completedSkills: {},
        waterway: null,
        instructorName: '', // Reset to match initial state
        instructorId: null,
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
    handleDepthUnitChange,
    handleSubmit,
    shouldShowBackButton,
    errors,
  };
};