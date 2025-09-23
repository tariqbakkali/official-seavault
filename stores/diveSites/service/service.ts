import { useDiveSitesStore } from '../store/store';
import { Database } from '../../../types/database';

// Export functional service functions for backward compatibility
export const fetchDiveSites = (): Promise<Database['public']['Tables']['dive_sites']['Row'][]> => {
  return useDiveSitesStore.getState().fetchDiveSites();
};

export const getDiveSiteById = (id: string): Promise<Database['public']['Tables']['dive_sites']['Row'] | null> => {
  return useDiveSitesStore.getState().getDiveSiteById(id);
};