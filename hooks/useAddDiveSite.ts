import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useDiveSitesStore } from '@/stores/diveSites/store/store';
import { router } from 'expo-router';

export interface UseAddDiveSiteReturn {
  diveSiteName: string;
  setDiveSiteName: (name: string) => void;
  latitude: string;
  setLatitude: (lat: string) => void;
  longitude: string;
  setLongitude: (lng: string) => void;
  isSelectingCoordinates: boolean;
  setIsSelectingCoordinates: (selecting: boolean) => void;
  handleCoordinateSelect: (event: any) => void;
  handleSubmit: () => Promise<void>;
  isValid: boolean;
  validationErrors: string[];
}

/**
 * Custom hook for managing add dive site functionality
 * Separates business logic from UI components
 */
export const useAddDiveSite = (): UseAddDiveSiteReturn => {
  const [diveSiteName, setDiveSiteName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isSelectingCoordinates, setIsSelectingCoordinates] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { createDiveSite } = useDiveSitesStore();

  /**
   * Handle coordinate selection from map tap
   */
  const handleCoordinateSelect = useCallback((event: any) => {
    if (isSelectingCoordinates) {
      const { coordinate } = event.nativeEvent;
      setLatitude(coordinate.latitude.toString());
      setLongitude(coordinate.longitude.toString());
      
      // Show confirmation
      Alert.alert(
        'Coordinates Selected', 
        `Latitude: ${coordinate.latitude.toFixed(6)}\nLongitude: ${coordinate.longitude.toFixed(6)}`,
        [{ text: 'OK' }]
      );
    }
  }, [isSelectingCoordinates]);

  /**
   * Validate form data
   */
  const validateForm = useCallback(() => {
    const errors: string[] = [];
    
    // Validate dive site name
    if (!diveSiteName.trim()) {
      errors.push('Dive site name is required');
    }
    
    // Validate coordinates
    if (!latitude.trim() || !longitude.trim()) {
      errors.push('Both latitude and longitude coordinates are required');
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      errors.push('Coordinates must be valid numbers');
    }
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90 degrees');
    }
    
    if (lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180 degrees');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [diveSiteName, latitude, longitude]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }
    
    try {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      // Create a new dive site
      const newDiveSite = await createDiveSite({
        name: diveSiteName,
        latitude: lat,
        longitude: lng,
        osm_id: null
      });
      
      if (newDiveSite) {
        Alert.alert(
          'Success', 
          'Dive site added successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error creating dive site:', error);
      Alert.alert('Error', 'Failed to add dive site. Please try again.');
    }
  }, [diveSiteName, latitude, longitude, validateForm, validationErrors]);

  // Check if form is valid
  const isValid = validationErrors.length === 0 && 
                 diveSiteName.trim() !== '' && 
                 latitude.trim() !== '' && 
                 longitude.trim() !== '';

  return {
    diveSiteName,
    setDiveSiteName,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    isSelectingCoordinates,
    setIsSelectingCoordinates,
    handleCoordinateSelect,
    handleSubmit,
    isValid,
    validationErrors
  };
};