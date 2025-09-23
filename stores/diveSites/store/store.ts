import { create } from 'zustand';
import { supabase } from '../../../services/supabase';
import { DiveSitesState, DiveSitesActions } from '../types/types';
// Import all query functions
import * as queries from '../queries/queries';

export type DiveSitesStore = DiveSitesState & DiveSitesActions;

export const useDiveSitesStore = create<DiveSitesStore>((set, get) => ({
  // Initial state
  diveSites: null,
  isLoading: false,
  error: null,

  // Actions
  fetchDiveSites: async (): Promise<any[]> => {
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

  getDiveSiteById: async (id: string): Promise<any | null> => {
    try {
      return await queries.getDiveSiteById(id);
    } catch (error) {
      console.error('Error fetching dive site:', error);
      return null;
    }
  },

  reset: () => set({
    diveSites: null,
    isLoading: false,
    error: null,
  }),
}));