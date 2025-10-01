import { useObservable } from '@legendapp/state/react';
import { 
  sightings$,
  createSighting as createSightingObservable
} from '../../syncedObservables';
import { supabase } from '../../../services/supabase';
import { SightingsState, SightingsActions } from '../types/types';
import { Database } from '../../../types/database';
// Import all query functions
import * as queries from '../queries/queries';

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

export type SightingsStore = SightingsState & SightingsActions;

// Hook for accessing sightings data from observables
export const useSightingsObservable = () => {
  const sightings = useObservable(sightings$);
  return sightings;
};

// Updated store that uses observables for sightings data
export const useSightingsStore = () => {
  // Get sightings from observables
  const sightings = useSightingsObservable();
  
  // Convert to array with actual values
  const sightingsArray = sightings ? 
    Object.values(sightings).map(item => extractObservableValues(item)) : [];
  
  return {
    // State
    isLoading: false, // Observables handle loading state internally
    error: null, // Observables handle error state internally
    
    // Actions that work with observables
    createSighting: async (
      sighting: Omit<Database['public']['Tables']['sightings']['Insert'], 'user_id'>
    ): Promise<Database['public']['Tables']['sightings']['Row'] | null> => {
      try {
        // Use the observable-based create function for local-first functionality
        createSightingObservable(sighting);
        
        // For immediate feedback, we can still use the existing query
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const sightingData: Database['public']['Tables']['sightings']['Insert'] = {
          ...sighting,
          user_id: user.id,
        };

        const result = await queries.createSightingQuery(sightingData);
        return result;
      } catch (error) {
        console.error('Error creating sighting:', error);
        return null;
      }
    },

    updateSighting: async (
      id: string,
      updates: Database['public']['Tables']['sightings']['Update']
    ): Promise<Database['public']['Tables']['sightings']['Row'] | null> => {
      try {
        // For sightings updates, we still use the existing query for now
        const result = await queries.updateSighting(id, updates);
        return result;
      } catch (error) {
        console.error('Error updating sighting:', error);
        return null;
      }
    },

    deleteSighting: async (id: string): Promise<void> => {
      try {
        // For sightings deletion, we still use the existing query for now
        await queries.deleteSighting(id);
      } catch (error) {
        console.error('Error deleting sighting:', error);
        throw error;
      }
    },

    reset: () => {
      // Reset is handled by the observable system
    },
  };
};