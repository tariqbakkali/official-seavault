import { useCallback } from 'react';
import { useDiveSitesStore } from '@/stores/diveSites/store/store';
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
    error,
    fetchDiveSites,
    getDiveSiteById,
    createDiveSite,
    createSighting,
    createWishlistItem,
    removeWishlistItem,
    reset
  } = useDiveSitesStore();

  /**
   * Fetch all dive sites with proper error handling
   * Data is automatically loaded by observables in the new implementation
   */
  const loadDiveSites = useCallback(async () => {
    try {
      return await fetchDiveSites();
    } catch (err) {
      console.error('Failed to load dive sites:', err);
      return [];
    }
  }, [fetchDiveSites]);

  /**
   * Get a dive site by ID with proper error handling
   */
  const fetchDiveSiteById = useCallback(async (id: string) => {
    try {
      return await getDiveSiteById(id);
    } catch (err) {
      console.error(`Failed to fetch dive site with id ${id}:`, err);
      return null;
    }
  }, [getDiveSiteById]);

  /**
   * Create a new dive site with proper error handling
   */
  const addDiveSite = useCallback(async (
    diveSite: Database['public']['Tables']['dive_sites']['Insert']
  ) => {
    try {
      return await createDiveSite(diveSite);
    } catch (err) {
      console.error('Failed to create dive site:', err);
      return null;
    }
  }, [createDiveSite]);

  return {
    // Data
    diveSites,
    isLoading,
    error,
    
    // Actions
    loadDiveSites,
    fetchDiveSiteById,
    addDiveSite,
    
    // Local-first actions
    createSighting,
    createWishlistItem,
    removeWishlistItem,
    
    reset,
  };
};