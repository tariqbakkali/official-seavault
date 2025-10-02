import { useCallback } from 'react';
import { useSyncedData } from '@/hooks/useSyncedData';
import { Database } from '@/types/database';

/**
 * Custom hook for accessing dive sites data and actions
 * Separates business logic from UI components
 * Updated to use Legend-State observables for local-first functionality
 */
export const useDiveSites = () => {
  const {
    diveSites,
    isLoading,
    errors,
    createSighting,
    createWishlistItem,
    createDiveSite,
    removeWishlistItem,
  } = useSyncedData();

  /**
   * Fetch all dive sites with proper error handling
   * Data is automatically loaded by observables in the new implementation
   */
  const loadDiveSites = useCallback(async () => {
    try {
      // In the new implementation, data is automatically loaded by observables
      // We just return the current data
      return diveSites.get() || [];
    } catch (err) {
      console.error('Failed to load dive sites:', err);
      return [];
    }
  }, [diveSites]);

  /**
   * Get a dive site by ID with proper error handling
   */
  const fetchDiveSiteById = useCallback(async (id: string) => {
    try {
      const allDiveSites = diveSites.get() || [];
      return allDiveSites.find((site: any) => site.id === id) || null;
    } catch (err) {
      console.error(`Failed to fetch dive site with id ${id}:`, err);
      return null;
    }
  }, [diveSites]);

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

  return {
    // Data
    diveSites,
    isLoading: isLoading.diveSites,
    error: errors.diveSites,
    
    // Actions
    loadDiveSites,
    fetchDiveSiteById,
    addDiveSite,
    
    // Local-first actions
    createSighting,
    createWishlistItem,
    removeWishlistItem,
  };
};