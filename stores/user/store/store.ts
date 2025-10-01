import { useObservable } from '@legendapp/state/react';
import { 
  sightings$,
  wishlists$,
  profile$,
  getSightings,
  getWishlists,
  getProfile
} from '../../syncedObservables';
import { supabase } from '../../../services/supabase';
import { UserState, UserActions, UserData } from '../types/types';
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

export type UserStore = UserState & UserActions;

// Hook for accessing user data from observables
export const useUserObservable = () => {
  const sightings = useObservable(sightings$);
  const wishlists = useObservable(wishlists$);
  const profile = useObservable(profile$);
  
  return {
    sightings,
    wishlists,
    profile
  };
};

// Updated store that uses observables for user-specific data
export const useUserStore = () => {
  // Get user data from observables
  const { sightings, wishlists, profile } = useUserObservable();
  
  // Convert to arrays with actual values
  const sightingsArray = sightings ? 
    Object.values(sightings).map(item => extractObservableValues(item)) : [];
  const wishlistsArray = wishlists ? 
    Object.values(wishlists).map(item => extractObservableValues(item)) : [];
  const profileData = profile ? extractObservableValues(profile) : null;
  
  return {
    // Data from observables
    userData: {
      profile: profileData,
      sightings: sightingsArray,
      wishlists: wishlistsArray,
    },
    isLoading: false, // Observables handle loading state internally
    error: null, // Observables handle error state internally
    
    // Actions that work with observables
    fetchUserData: async (): Promise<UserData> => {
      // Data is automatically loaded by observables
      // We can trigger a refresh by accessing the observables
      getSightings();
      getWishlists();
      getProfile();
      
      const userData: UserData = {
        profile: profileData,
        sightings: sightingsArray,
        wishlists: wishlistsArray,
      };
      
      return userData;
    },

    updateUserProfile: async (
      profileUpdate: Omit<Database['public']['Tables']['profiles']['Update'], 'id'>
    ): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
      try {
        // For profile updates, we still use the existing query for now
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const result = await queries.updateProfile(user.id, profileUpdate);
        return result;
      } catch (error) {
        console.error('Error updating profile:', error);
        return null;
      }
    },

    ensureUserProfile: async (): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
      try {
        // Profile is automatically loaded by observables
        getProfile();
        return profileData;
      } catch (error) {
        console.error('Error ensuring user profile:', error);
        return null;
      }
    },

    createProfileForCurrentUser: async (
      profileData: Partial<Database['public']['Tables']['profiles']['Insert']>
    ): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        // For creating a profile, we still use the existing query since it's a one-time operation
        const fullProfileData: Database['public']['Tables']['profiles']['Insert'] = {
          id: user.id,
          email: user.email || null,
          full_name: profileData.full_name || null,
          avatar_url: profileData.avatar_url || null,
          membership_tier: profileData.membership_tier || null,
          is_premium: profileData.is_premium || null,
          has_seen_onboarding: profileData.has_seen_onboarding || null,
        };

        const result = await queries.createProfile(fullProfileData);
        return result;
      } catch (error) {
        console.error('Error creating profile:', error);
        return null;
      }
    },

    reset: () => {
      // Reset is handled by the observable system
    },
  };
};