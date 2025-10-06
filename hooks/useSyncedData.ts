import { useObservable } from '@legendapp/state/react';
import { syncState } from '@legendapp/state';
import { 
  categories$, 
  creatures$, 
  diveSites$, 
  sightings$, 
  wishlists$, 
  profile$,
  achievements$,
  profiles$, // Added profiles$
  createSighting,
  createWishlistItem,
  createDiveSite,
  removeWishlistItem,
  toggleWishlistItem,
  updateUserProfile
} from '../stores/syncedObservables';
import { supabase } from '../services/supabase';
import { Database } from '../types/database';

// Hook that provides all data and mutation functions with loading and error states
export const useSyncedData = () => {


  const categories = useObservable(categories$);
  const creatures = useObservable(creatures$);
  const diveSites = useObservable(diveSites$);
  const sightings = useObservable(sightings$);
  const wishlists = useObservable(wishlists$);
  const profile = useObservable(profile$);
  const allProfiles = useObservable(profiles$); // Added allProfiles
  const achievements = useObservable(achievements$);


  // Get sync states for each observable
  const categoriesSyncState = useObservable(syncState(categories$));
  const creaturesSyncState = useObservable(syncState(creatures$));
  const diveSitesSyncState = useObservable(syncState(diveSites$));
  const sightingsSyncState = useObservable(syncState(sightings$));
  const wishlistsSyncState = useObservable(syncState(wishlists$));
  const profileSyncState = useObservable(syncState(profile$));
  const achievementsSyncState = useObservable(syncState(achievements$));
  const profilesSyncState = useObservable(syncState(profiles$)); // Added profilesSyncState

  // Loading states
  const isLoading = {
    categories: !categoriesSyncState.isLoaded,
    creatures: !creaturesSyncState.isLoaded,
    diveSites: !diveSitesSyncState.isLoaded,
    sightings: !sightingsSyncState.isLoaded,
    wishlists: !wishlistsSyncState.isLoaded,
    profile: !profileSyncState.isLoaded,
    achievements: !achievementsSyncState.isLoaded,
    allProfiles: !profilesSyncState.isLoaded, // Added allProfiles loading state
  };

  // Error states
  const errors = {
    categories: categoriesSyncState.error,
    creatures: creaturesSyncState.error,
    diveSites: diveSitesSyncState.error,
    sightings: sightingsSyncState.error,
    wishlists: wishlistsSyncState.error,
    profile: profileSyncState.error,
    achievements: achievementsSyncState.error,
    allProfiles: profilesSyncState.error, // Added allProfiles error state
  };

  // Fetch functions for catalog data
  const fetchCatalog = async () => {
    // Trigger loading of catalog data if not already loaded
    if (!categoriesSyncState.isLoaded.get()) {
      await categories$.sync().load();
    }
    if (!creaturesSyncState.isLoaded.get()) {
      await creatures$.sync().load();
    }
    if (!achievementsSyncState.isLoaded.get()) {
      await achievements$.sync().load();
    }
    if (!profilesSyncState.isLoaded.get()) { // Added profiles$.sync().load()
      await profiles$.sync().load();
    }
  };

  // Fetch functions for user data
  const fetchUserData = async () => {
    // Trigger loading of user data if not already loaded
    if (!profileSyncState.isLoaded.get()) {
      await profile$.sync().load();
    }
    if (!sightingsSyncState.isLoaded.get()) {
      await sightings$.sync().load();
    }
    if (!wishlistsSyncState.isLoaded.get()) {
      await wishlists$.sync().load();
    }
  };

  // Fetch functions for dive sites
  const fetchDiveSites = async () => {
    // Trigger loading of dive sites if not already loaded
    if (!diveSitesSyncState.isLoaded.get()) {
      await diveSites$.sync().load();
    }
  };

  // Ensure user profile exists, creating it if necessary
  const ensureUserProfile = async (): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      // Try to get user from profile observable first
      const existingProfile = profile$.get();
      let user = null;

      if (existingProfile && existingProfile.id) {
        // If profile observable has an ID, assume user is authenticated and use that ID
        user = { id: existingProfile.id, email: existingProfile.email };
      } else {
        // Fallback to direct Supabase auth if profile observable is not yet populated
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
      }

      if (!user) return null;

      // Try to fetch existing profile by loading the profile observable
      await profile$.sync().load();
      const currentProfile = profile$.get();

      if (currentProfile && currentProfile.id) {
        return currentProfile;
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

      // Set the profile in the observable
      profile$.set(newProfile as Database['public']['Tables']['profiles']['Row']);
      
      // Sync to Supabase
      await profile$.sync().save();
      
      return profile$.get();
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      return null;
    }
  };

  // Create profile for current user
  const createProfileForCurrentUser = async (
    profileData: Partial<Database['public']['Tables']['profiles']['Insert']>
  ): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      // Try to get user from profile observable first
      const existingProfile = profile$.get();
      let user = null;

      if (existingProfile && existingProfile.id) {
        // If profile observable has an ID, assume user is authenticated and use that ID
        user = { id: existingProfile.id, email: existingProfile.email };
      } else {
        // Fallback to direct Supabase auth if profile observable is not yet populated
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
      }

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

      // Set the profile in the observable
      profile$.set(fullProfileData as Database['public']['Tables']['profiles']['Row']);
      
      // Sync to Supabase
      await profile$.sync().save();
      
      // Refresh user data after creating profile
      await fetchUserData();
      
      return profile$.get();
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  };

  return {
    // Data
    categories,
    creatures,
    diveSites,
    sightings,
    wishlists,
    profile,
    achievements,
    allProfiles,
    
    // Loading states
    isLoading,
    
    // Error states
    errors,
    
    // Fetch functions
    fetchCatalog,
    fetchUserData,
    fetchDiveSites,
    
    // Profile functions
    ensureUserProfile,
    createProfileForCurrentUser,
    
    // Mutation functions
    createSighting,
    createWishlistItem,
    createDiveSite,
    removeWishlistItem,
    toggleWishlistItem,
    updateUserProfile,
  };
};