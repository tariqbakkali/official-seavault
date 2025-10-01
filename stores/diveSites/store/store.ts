import { useObservable } from '@legendapp/state/react';
import { 
  diveSites$,
  getDiveSites,
  createSighting,
  createWishlistItem,
  removeWishlistItem
} from '../../syncedObservables';
import { supabase } from '../../../services/supabase';
import { DiveSitesState, DiveSitesActions } from '../types/types';
import * as queries from '../queries/queries';
import { Database } from '../../../types/database';

// Utility function to extract actual values from observable objects
const extractObservableValues = (obj: any): any => {
  if (!obj) return obj;
  
  // If it's an observable with a get method, return its value
  if (typeof obj === 'object' && obj.get && typeof obj.get === 'function') {
    return obj.get();
  }
  
  // If it's an object, recursively extract values
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = extractObservableValues(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
};

export type DiveSitesStore = DiveSitesState & DiveSitesActions;

// Hook for accessing dive sites data from observables
export const useDiveSitesObservable = () => {
  const diveSites = useObservable(diveSites$);
  return diveSites;
};

// Updated store that uses observables for data
export const useDiveSitesStore = () => {
  // Get dive sites from observables
  const diveSites = useDiveSitesObservable();
  
  // Convert dive sites object to array with actual values
  const diveSitesArray = diveSites ? 
    Object.values(diveSites).map(site => extractObservableValues(site)) : [];
  
  return {
    // Data from observables
    diveSites: diveSitesArray,
    isLoading: false, // Observables handle loading state internally
    error: null, // Observables handle error state internally
    
    // Actions that work with observables
    fetchDiveSites: async (): Promise<Database['public']['Tables']['dive_sites']['Row'][]> => {
      // Data is automatically loaded by observables
      // We can trigger a refresh by accessing the observable
      getDiveSites();
      return diveSitesArray;
    },

    getDiveSiteById: async (id: string): Promise<Database['public']['Tables']['dive_sites']['Row'] | null> => {
      try {
        // Access the specific dive site from the observable
        if (diveSites && diveSites[id]) {
          return extractObservableValues(diveSites[id]);
        }
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
        // For dive sites, we still use the existing query since they're read-only catalog data
        const newDiveSite = await queries.createDiveSite(diveSiteData);
        return newDiveSite;
      } catch (error) {
        console.error('Error creating dive site:', error);
        return null;
      }
    },

    // Utility functions for working with user data
    createSighting: (sightingData: any) => {
      return createSighting(sightingData);
    },
    
    createWishlistItem: (creatureId: string) => {
      return createWishlistItem(creatureId);
    },
    
    removeWishlistItem: (wishlistId: string) => {
      return removeWishlistItem(wishlistId);
    },

    reset: () => {
      // Reset is handled by the observable system
    },
  };
};