import { useCallback } from 'react';
import { useSyncedData } from '@/hooks/useSyncedData';
import { Database } from '@/types/database';

export const useDiveSites = () => {
  const {
    diveSites,
    isLoading,
    errors,
    createDiveSite,
    createSighting,
    createWishlistItem,
    removeWishlistItem,
    fetchDiveSites,
  } = useSyncedData();

  /**
   * Create a new dive site with proper error handling
   */
  const addDiveSite = useCallback(async (
    diveSite: Database['public']['Tables']['dive_sites']['Insert']
  ) => {
    try {
      // Create a new dive site using the new Legend-State implementation
      const newDiveSite = createDiveSite(diveSite);
      return newDiveSite;
    } catch (err) {
      console.error('Failed to create dive site:', err);
      return null;
    }
  }, [createDiveSite]);

  /**
   * Create a new sighting with proper error handling
   */
  const addSighting = useCallback(async (
    sightingData: Omit<Database['public']['Tables']['sightings']['Row'], 'id' | 'created_at' | 'user_id'>
  ) => {
    try {
      // Create a new sighting using the new Legend-State implementation
      const newSighting = await createSighting(sightingData);
      return newSighting;
    } catch (err) {
      console.error('Failed to create sighting:', err);
      return null;
    }
  }, [createSighting]);

  return {
    // Data
    diveSites,
    isLoading: isLoading.diveSites,
    error: errors.diveSites,
    
    // Actions
    loadDiveSites: fetchDiveSites,
    addDiveSite,
    addSighting,
    
    // Local-first actions
    createSighting,
    createWishlistItem,
    removeWishlistItem,
  };
};

export default useDiveSites;