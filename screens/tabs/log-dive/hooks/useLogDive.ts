import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useSyncedData } from '@/hooks/useSyncedData';
import { showAlert } from '@/utils/alertUtils';
import { feetToMeters, metersToFeet } from '@/utils/format';
import { ROUTES } from '@/constants/routes';
import { Database, Sighting } from '@/types/database';
import { saveDiveSession, getDiveSession } from '@/services/diveService';
import { currentUserSightings$ } from '@/stores/syncedObservables';
import { useSelector } from '@legendapp/state/react';
import { v4 as uuidv4 } from 'uuid';

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
  id: string; // tempId for linking
  creatureId: string | null;
  notes: string | null;
  imageUrl: string | null;
  thumbnailUrl?: string | null;
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
  media: Array<{
    uri: string;
    type: 'image' | 'video';
    id?: string; // Existing media ID
    sightingId?: string;
    thumbnailUrl?: string;
  }>;
}

export const useLogDive = () => {
  const { selectedCategory, selectedCreature, source, editId } = useLocalSearchParams<{
    selectedCategory?: string;
    selectedCreature?: string;
    source?: string;
    editId?: string;
  }>();
  const router = useRouter();
  
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
    media: [],
  });

  // Removed selectedImage state as it's no longer needed
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { creatures: allCreatures, categories: allCategories, diveSites: allDiveSites, createSighting, isLoading: isSyncLoading, errors } = useSyncedData();

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
      // If coming from creature details, pre-fill sighting
      setFormData(prev => ({
        ...prev,
        creatureSightings: [{ 
          id: uuidv4(), // Ensure ID is always present
          creatureId: selectedCreature, 
          notes: null, 
          imageUrl: null 
        }],
      }));
    }
  }, [selectedCategory, selectedCreature]);

  // Load existing dive data if editing
  useEffect(() => {
    if (editId) {
      const session = getDiveSession(editId);
      if (session) {
        const { dive, sightings, media } = session;
        
        // Map sightings back to form format
        const creatureSightings = sightings.map(s => ({
          id: s.id,
          creatureId: s.creature_id,
          notes: s.creature_notes,
          imageUrl: s.image_url,
          thumbnailUrl: s.thumbnail_url,
        }));

        setFormData({
          diveSiteId: dive.dive_site_id,
          date: new Date(dive.date),
          timeOfDay: sightings[0]?.time_of_day || '',
          diveMode: dive.dive_mode || 'leisure',
          diveType: dive.dive_type,
          depth: dive.max_depth ? dive.max_depth.toString() : '',
          diveNotes: dive.dive_notes || '',
          creatureSightings,
          duration: dive.duration ? dive.duration.toString() : '',
          weather: dive.weather,
          visibility: dive.visibility,
          current: dive.current,
          timeIn: dive.time_in || '',
          timeOut: dive.time_out || '',
          airIn: dive.air_in ? dive.air_in.toString() : '',
          airOut: dive.air_out ? dive.air_out.toString() : '',
          airUnit: dive.air_unit || 'bar',
          depthUnit: dive.depth_unit || 'meters',
          courseType: dive.course_type || 'open_water',
          completedSkills: (dive.skills_completed || []).reduce((acc: any, skill: string) => {
            acc[skill] = true;
            return acc;
          }, {}),
          waterway: dive.waterway,
          instructorName: dive.instructor_name || '',
          instructorId: dive.instructor_id,
          media: media.map(m => ({
            uri: m.url,
            type: m.type as 'image' | 'video',
            id: (m as any).id,
            sightingId: m.sighting_id || undefined,
            thumbnailUrl: m.thumbnail_url || undefined,
          })),
        });
      }
    }
  }, [editId]);

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
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
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

      const sessionData: any = {
        dive: {
          dive_site_id: formData.diveSiteId,
          date: formData.date.toISOString().split('T')[0],
          time_in: formData.timeIn || null,
          time_out: formData.timeOut || null,
          duration: formData.duration ? parseInt(formData.duration, 10) : null,
          max_depth: formData.depth ? parseFloat(formData.depth) : null,
          air_in: formData.airIn ? parseInt(formData.airIn, 10) : null,
          air_out: formData.airOut ? parseInt(formData.airOut, 10) : null,
          air_unit: formData.airUnit,
          depth_unit: formData.depthUnit,
          dive_type: formData.diveType,
          course_type: formData.diveMode === 'training' ? (formData.courseType || null) : null,
          skills_completed: formData.diveMode === 'training' ? Object.keys(formData.completedSkills).filter(skill => formData.completedSkills[skill]) : [],
          dive_notes: formData.diveNotes || null,
          weather: formData.weather || null,
          visibility: formData.visibility || null,
          current: formData.current || null,
          instructor_id: formData.instructorId || null,
          instructor_name: formData.instructorName || null,
          waterway: formData.waterway || null,
        },
        sightings: formData.creatureSightings.map(s => ({
          creature_id: s.creatureId,
          creature_notes: s.notes,
          image_url: s.imageUrl,
          thumbnail_url: s.thumbnailUrl,
          date: formData.date.toISOString().split('T')[0],
          // Duplicate dive info into sightings for backward compat
          dive_site_id: formData.diveSiteId,
          dive_type: formData.diveType,
          time_in: formData.timeIn || null,
          time_of_day: formData.timeOfDay || null,
          depth: formData.depth || null,
          duration: formData.duration ? parseInt(formData.duration, 10) : null,
          waterway: formData.waterway || null,
          dive_mode: formData.diveMode,
        })),
        media: formData.media,
      };

      await saveDiveSession(sessionData, editId);
      
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable !== false;
      
      if (isOnline) {
        showAlert(
          editId ? 'Dive Updated' : 'Dive Log Saved',
          editId ? 'Your dive log has been updated successfully.' : 'Your dive log has been saved successfully and synchronized with the cloud.'
        );
      } else {
        showAlert(
          editId ? 'Dive Updated Offline' : 'Dive Log Saved Offline',
          'Your changes have been saved locally and will sync when you\'re online.'
        );
      }
      
      if (editId) {
        router.back();
      } else {
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
          instructorName: '',
          instructorId: null,
          media: [],
        });
        setSelectedCategories([]);
      }
    } catch (error) {
      console.error('Error submitting dive log:', error);
      showAlert('Error', 'Error saving dive log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // State
    formData,
    setFormData,
    // Removed selectedImage and setSelectedImage
    selectedCategories,
    setSelectedCategories,
    isLoading: isSubmitting,
    
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