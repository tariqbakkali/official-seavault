import { create } from 'zustand';
import { supabase } from '../../../services/supabase';
import { SightingsState, SightingsActions } from '../types/types';
import { Database } from '../../../types/database';
// Import all query functions
import * as queries from '../queries/queries';

export type SightingsStore = SightingsState & SightingsActions;

export const useSightingsStore = create<SightingsStore>((set, get) => ({
  // Initial state
  isLoading: false,
  error: null,

  // Actions
  createSighting: async (
    sighting: Omit<Database['public']['Tables']['sightings']['Insert'], 'user_id'>
  ): Promise<Database['public']['Tables']['sightings']['Row'] | null> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const sightingData: Database['public']['Tables']['sightings']['Insert'] = {
        ...sighting,
        user_id: user.id,
      };

      const result = await queries.createSightingQuery(sightingData);
      
      // Refresh user data after creating sighting
      // Note: We would need to import useUserStore here, but to avoid circular dependencies,
      // the component using this function should handle refreshing user data if needed
      
      set((state) => ({ ...state, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Error creating sighting:', error);
      set((state) => ({ ...state, error: 'Failed to create sighting', isLoading: false }));
      return null;
    }
  },

  updateSighting: async (
    id: string,
    updates: Database['public']['Tables']['sightings']['Update']
  ): Promise<Database['public']['Tables']['sightings']['Row'] | null> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const result = await queries.updateSighting(id, updates);
      
      set((state) => ({ ...state, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Error updating sighting:', error);
      set((state) => ({ ...state, error: 'Failed to update sighting', isLoading: false }));
      return null;
    }
  },

  deleteSighting: async (id: string): Promise<void> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      await queries.deleteSighting(id);
      
      set((state) => ({ ...state, isLoading: false }));
    } catch (error) {
      console.error('Error deleting sighting:', error);
      set((state) => ({ ...state, error: 'Failed to delete sighting', isLoading: false }));
      throw error;
    }
  },

  reset: () => set({
    isLoading: false,
    error: null,
  }),
}));