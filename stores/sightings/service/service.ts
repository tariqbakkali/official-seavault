import { useSightingsStore } from '../store/store';
import { Database } from '../../../types/database';

// Export functional service functions for backward compatibility
export const createSighting = (
  sighting: Omit<Database['public']['Tables']['sightings']['Insert'], 'user_id'>
): Promise<Database['public']['Tables']['sightings']['Row'] | null> => {
  return useSightingsStore.getState().createSighting(sighting);
};

export const updateSighting = (
  id: string,
  updates: Database['public']['Tables']['sightings']['Update']
): Promise<Database['public']['Tables']['sightings']['Row'] | null> => {
  return useSightingsStore.getState().updateSighting(id, updates);
};

export const deleteSighting = (id: string): Promise<void> => {
  return useSightingsStore.getState().deleteSighting(id);
};