import { useDiveSitesStore } from '../store/store';
import { Database } from '../../../types/database';

/**
 * Service functions for dive sites operations
 * Provides a clean interface between UI components and the store
 */

/**
 * Fetch all dive sites from the database
 * @returns Promise resolving to array of dive sites
 */
export const fetchDiveSites = (): Promise<Database['public']['Tables']['dive_sites']['Row'][]> => {
  return useDiveSitesStore.getState().fetchDiveSites();
};

/**
 * Get a specific dive site by ID
 * @param id - The ID of the dive site to retrieve
 * @returns Promise resolving to the dive site or null if not found
 */
export const getDiveSiteById = (id: string): Promise<Database['public']['Tables']['dive_sites']['Row'] | null> => {
  return useDiveSitesStore.getState().getDiveSiteById(id);
};

/**
 * Create a new dive site
 * @param diveSite - The dive site data to create
 * @returns Promise resolving to the created dive site or null if failed
 */
export const createDiveSite = (
  diveSite: Database['public']['Tables']['dive_sites']['Insert']
): Promise<Database['public']['Tables']['dive_sites']['Row'] | null> => {
  return useDiveSitesStore.getState().createDiveSite(diveSite);
};

/**
 * Reset the dive sites store to initial state
 */
export const resetDiveSites = (): void => {
  useDiveSitesStore.getState().reset();
};

/**
 * Get the current loading state
 * @returns Boolean indicating if data is being loaded
 */
export const isLoadingDiveSites = (): boolean => {
  return useDiveSitesStore.getState().isLoading;
};

/**
 * Get any error that occurred during operations
 * @returns String with error message or null if no error
 */
export const getDiveSitesError = (): string | null => {
  return useDiveSitesStore.getState().error;
};