import { create } from 'zustand';
import { supabase } from '../../../services/supabase';
import { UserState, UserActions, UserData } from '../types/types';
import { Database } from '../../../types/database';
// Import all query functions
import * as queries from '../queries/queries';

export type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>((set, get) => ({
  // Initial state
  userData: null,
  isLoading: false,
  error: null,

  // Actions
  fetchUserData: async (): Promise<UserData> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Fetch user profile
      const profile = await queries.getProfileByUserId(user.id);

      // Fetch user sightings
      const sightings = await queries.getSightingsByUserId(user.id);

      // Fetch user wishlists
      const wishlists = await queries.getWishlistByUserId(user.id);

      const userData: UserData = {
        profile: profile || null,
        sightings: sightings || [],
        wishlists: wishlists || [],
      };

      set((state) => ({ ...state, userData, isLoading: false }));
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      const emptyUserData: UserData = {
        profile: null,
        sightings: [],
        wishlists: [],
      };
      set((state) => ({ ...state, error: 'Failed to fetch user data', isLoading: false }));
      return emptyUserData;
    }
  },

  updateUserProfile: async (
    profile: Omit<Database['public']['Tables']['profiles']['Update'], 'id'>
  ): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const result = await queries.updateProfile(user.id, profile);
      
      // Refresh user data after updating profile
      if (result) {
        await get().fetchUserData();
      }
      
      set((state) => ({ ...state, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      set((state) => ({ ...state, error: 'Failed to update profile', isLoading: false }));
      return null;
    }
  },

  ensureUserProfile: async (): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Try to fetch existing profile
      const profile = await queries.getProfileByUserId(user.id);

      if (profile) {
        set((state) => ({ ...state, isLoading: false }));
        return profile;
      }

      // Create new profile if it doesn't exist
      const newProfile: Database['public']['Tables']['profiles']['Insert'] = {
        id: user.id,
        email: user.email || null,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        membership_tier: null,
        is_premium: null,
        has_seen_onboarding: null,
      };

      const result = await queries.createProfile(newProfile);
      set((state) => ({ ...state, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      set((state) => ({ ...state, error: 'Failed to ensure user profile', isLoading: false }));
      return null;
    }
  },

  createProfileForCurrentUser: async (
    profileData: Partial<Database['public']['Tables']['profiles']['Insert']>
  ): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

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
      
      // Refresh user data after creating profile
      if (result) {
        await get().fetchUserData();
      }
      
      set((state) => ({ ...state, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Error creating profile:', error);
      set((state) => ({ ...state, error: 'Failed to create profile', isLoading: false }));
      return null;
    }
  },

  reset: () => set({
    userData: null,
    isLoading: false,
    error: null,
  }),
}));