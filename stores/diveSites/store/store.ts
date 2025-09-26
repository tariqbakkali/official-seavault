import { create } from 'zustand';
import { supabase } from '../../../services/supabase';
import { DiveSitesState, DiveSitesActions } from '../types/types';
import * as queries from '../queries/queries';
import { Database } from '../../../types/database';

export type DiveSitesStore = DiveSitesState & DiveSitesActions;

export const useDiveSitesStore = create<DiveSitesStore>((set, get) => ({
  // Initial state
  diveSites: null,
  isLoading: false,
  error: null,

  // Actions
  fetchDiveSites: async (): Promise<Database['public']['Tables']['dive_sites']['Row'][]> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const diveSites = await queries.getDiveSites();
      const sites = diveSites || [];
      
      set((state) => ({ ...state, diveSites: sites, isLoading: false }));
      return sites;
    } catch (error) {
      console.error('Error fetching dive sites:', error);
      set((state) => ({ ...state, error: 'Failed to fetch dive sites', isLoading: false }));
      return [];
    }
  },

  getDiveSiteById: async (id: string): Promise<Database['public']['Tables']['dive_sites']['Row'] | null> => {
    try {
      return await queries.getDiveSiteById(id);
    } catch (error) {
      console.error('Error fetching dive site:', error);
      return null;
    }
  },

  createDiveSite: async (
    diveSiteData: Database['public']['Tables']['dive_sites']['Insert']
  ): Promise<Database['public']['Tables']['dive_sites']['Row'] | null> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const newDiveSite = await queries.createDiveSite(diveSiteData);
      
      // Update the local state with the new dive site
      if (newDiveSite) {
        const currentDiveSites = get().diveSites || [];
        set((state) => ({ 
          ...state, 
          diveSites: [...currentDiveSites, newDiveSite],
          isLoading: false 
        }));
      } else {
        set((state) => ({ ...state, isLoading: false }));
      }
      
      return newDiveSite;
    } catch (error) {
      console.error('Error creating dive site:', error);
      set((state) => ({ ...state, error: 'Failed to create dive site', isLoading: false }));
      return null;
    }
  },

  reset: () => set({
    diveSites: null,
    isLoading: false,
    error: null,
  }),
}));