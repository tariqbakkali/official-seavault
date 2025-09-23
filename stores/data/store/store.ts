import { create } from 'zustand';
import { supabase } from '../../../services/supabase';
import { uploadImage } from '../../../services/supabase';
import { DataState, DataActions, CatalogData, UserData } from '../types/types';
import { Database } from '../../../types/database';
// Import all query functions
import * as queries from '../queries/queries';

export type DataStore = DataState & DataActions;

export const useDataStore = create<DataStore>((set, get) => ({
  // Initial state
  catalog: null,
  userData: null,
  diveSites: null,
  isLoading: false,
  error: null,

  // Actions
  fetchCatalog: async (): Promise<CatalogData> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      // Fetch categories
      const categories = await queries.getCategories();

      // Fetch creatures
      const creatures = await queries.getCreatures();

      // Fetch achievements
      const achievements = await queries.getAchievements();

      const catalogData: CatalogData = {
        categories: categories || [],
        creatures: creatures || [],
        achievements: achievements || [],
      };

      set((state) => ({ ...state, catalog: catalogData, isLoading: false }));
      return catalogData;
    } catch (error) {
      console.error('Error fetching catalog:', error);
      const emptyCatalog: CatalogData = {
        categories: [],
        creatures: [],
        achievements: [],
      };
      set((state) => ({ ...state, error: 'Failed to fetch catalog data', isLoading: false }));
      return emptyCatalog;
    }
  },

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
      if (result) {
        await get().fetchUserData();
      }
      
      set((state) => ({ ...state, isLoading: false }));
      return result;
    } catch (error) {
      console.error('Error creating sighting:', error);
      set((state) => ({ ...state, error: 'Failed to create sighting', isLoading: false }));
      return null;
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

  toggleWishlistItem: async (creatureId: string): Promise<boolean> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Check if item is already wishlisted
      const isInWishlist = await queries.isCreatureInWishlist(user.id, creatureId);

      if (isInWishlist) {
        // For now, we'll need to find the wishlist item ID to remove it
        // This is a limitation of the current query structure
        const wishlists = await queries.getWishlistByUserId(user.id);
        const wishlistItem = wishlists.find(item => item.creature_id === creatureId);
        
        if (wishlistItem) {
          await queries.removeFromWishlist(wishlistItem.id);
        }
        set((state) => ({ ...state, isLoading: false }));
        return false; // Item removed
      } else {
        // Add to wishlist
        const wishlistData: Database['public']['Tables']['wishlists']['Insert'] = {
          user_id: user.id,
          creature_id: creatureId,
          // Note: id and created_at are auto-generated by the database
        };

        await queries.addToWishlist(wishlistData);
        
        // Refresh user data after toggling wishlist
        await get().fetchUserData();
        
        set((state) => ({ ...state, isLoading: false }));
        return true; // Item added
      }
    } catch (error) {
      console.error('Error toggling wishlist item:', error);
      set((state) => ({ ...state, error: 'Failed to toggle wishlist item', isLoading: false }));
      return false;
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
    catalog: null,
    userData: null,
    diveSites: null,
    isLoading: false,
    error: null,
  }),
}));