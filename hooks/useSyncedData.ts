import { use$, useObservable } from '@legendapp/state/react';
import { syncState } from '@legendapp/state';
import { 
  categories$, 
  creatures$, 
  diveSites$, 
  currentUserSightings$,
  allUsersSightings$,
  allUsersAchievements$,
  wishlists$, 
  profile$,
  achievements$,
  userAchievements$,
  profiles$, // Added profiles$
  createSighting,
  createWishlistItem,
  createDiveSite,
  toggleWishlistItem, // Added toggleWishlistItem
  removeWishlistItem,
  updateUserProfile,
  getCurrentUserSightings,
  getAllUsersSightings,
  getAllUsersAchievements
} from '../stores/syncedObservables';
import { supabase } from '../services/supabase';
import { Database } from '../types/database';

// Hook that provides all data and mutation functions with loading and error states
export const useSyncedData = () => {
  const categories = use$(categories$);
  const creatures = use$(creatures$);
  const diveSites = use$(diveSites$);
  const currentUserSightings = use$(currentUserSightings$);
  const allUsersSightings = use$(allUsersSightings$);
  const allUsersAchievements = use$(allUsersAchievements$);
  const wishlists = use$(wishlists$);
  // For profile, we need to handle it specially to ensure we get the current user's profile
  const profile = use$(profile$);
  const allProfiles = use$(profiles$); // Added allProfiles
  const achievements = use$(achievements$);
  const userAchievements = use$(userAchievements$);

  // Get sync states for each observable
  // For sync states, we need to use useObservable because we need the observable objects
  // to access their properties like isLoaded
  const categoriesSyncState = useObservable(syncState(categories$));
  const creaturesSyncState = useObservable(syncState(creatures$));
  const diveSitesSyncState = useObservable(syncState(diveSites$));
  const currentUserSightingsSyncState = useObservable(syncState(currentUserSightings$));
  const allUsersSightingsSyncState = useObservable(syncState(allUsersSightings$));
  const allUsersAchievementsSyncState = useObservable(syncState(allUsersAchievements$));
  const wishlistsSyncState = useObservable(syncState(wishlists$));
  const profileSyncState = useObservable(syncState(profile$));
  const achievementsSyncState = useObservable(syncState(achievements$));
  const userAchievementsSyncState = useObservable(syncState(userAchievements$));
  const profilesSyncState = useObservable(syncState(profiles$)); // Added profilesSyncState

  // Loading states
  const isLoading = {
    categories: !categoriesSyncState.isLoaded,
    creatures: !creaturesSyncState.isLoaded,
    diveSites: !diveSitesSyncState.isLoaded,
    currentUserSightings: !currentUserSightingsSyncState.isLoaded,
    allUsersSightings: !allUsersSightingsSyncState.isLoaded,
    allUsersAchievements: !allUsersAchievementsSyncState.isLoaded,
    wishlists: !wishlistsSyncState.isLoaded,
    profile: !profileSyncState.isLoaded,
    achievements: !achievementsSyncState.isLoaded,
    userAchievements: !userAchievementsSyncState.isLoaded,
    allProfiles: !profilesSyncState.isLoaded, // Added allProfiles loading state
  };

  // Error states
  const errors = {
    categories: categoriesSyncState.error,
    creatures: creaturesSyncState.error,
    diveSites: diveSitesSyncState.error,
    currentUserSightings: currentUserSightingsSyncState.error,
    allUsersSightings: allUsersSightingsSyncState.error,
    allUsersAchievements: allUsersAchievementsSyncState.error,
    wishlists: wishlistsSyncState.error,
    profile: profileSyncState.error,
    achievements: achievementsSyncState.error,
    userAchievements: userAchievementsSyncState.error,
    allProfiles: profilesSyncState.error, // Added allProfiles error state
  };

  // Fetch functions for catalog data
  const fetchCatalog = async () => {
    // Trigger loading of catalog data if not already loaded
    if (!categoriesSyncState.isLoaded.get()) {
      // For synced observables, accessing the value triggers sync
      categories$.get();
    }
    if (!creaturesSyncState.isLoaded.get()) {
      creatures$.get();
    }
    if (!achievementsSyncState.isLoaded.get()) {
      achievements$.get();
    }
    if (!profilesSyncState.isLoaded.get()) {
      profiles$.get();
    }
  };

  // Fetch functions for user data
  const fetchUserData = async () => {
    // Trigger loading of user data if not already loaded
    if (!profileSyncState.isLoaded.get()) {
      profile$.get();
    }
    if (!currentUserSightingsSyncState.isLoaded.get()) {
      currentUserSightings$.get();
    }
    if (!wishlistsSyncState.isLoaded.get()) {
      wishlists$.get();
    }
  };

  // Fetch functions for dive sites
  const fetchDiveSites = async () => {
    // Trigger loading of dive sites if not already loaded
    if (!diveSitesSyncState.isLoaded.get()) {
      diveSites$.get();
    }
  };

  // Ensure user profile exists, creating it if necessary
  const ensureUserProfile = async (): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      // Try to get user from profile observable first
      const existingProfile = profile$.get();
      let user: { id: string; email: string | null } | null = null;

      if (existingProfile && Object.keys(existingProfile).length > 0) {
        // Extract the actual profile object from the observable structure
        const profileObj = Object.values(existingProfile)[0];
        if (profileObj && profileObj.id) {
          // If profile observable has an ID, assume user is authenticated and use that ID
          user = { id: profileObj.id, email: profileObj.email };
        }
      } else {
        // Fallback to direct Supabase auth if profile observable is not yet populated
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser ? { id: authUser.id, email: authUser.email || null } : null;
      }

      if (!user) return null;

      // Try to fetch existing profile by loading the profile observable
      const currentProfile = profile$.get();
      // Extract the actual profile object from the observable structure
      const userProfile = currentProfile ? Object.values(currentProfile)[0] : undefined;

      if (userProfile && userProfile.id) {
        return userProfile;
      }

      // Create new profile if it doesn't exist
      const newProfile: Database['public']['Tables']['profiles']['Insert'] = {
        id: user.id,
        email: user.email || null,
        full_name: null, // We don't have user metadata here
        avatar_url: null, // We don't have user metadata here
        membership_tier: null,
        is_premium: null,
        has_seen_onboarding: null,
      };

      // Set the profile in the observable using the correct structure
      profile$.assign!({
        [user.id]: newProfile as Database['public']['Tables']['profiles']['Row']
      });
      
      const updatedProfile = profile$.get();
      return updatedProfile ? Object.values(updatedProfile)[0] : null;
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
      let user: { id: string; email: string | null } | null = null;

      if (existingProfile && Object.keys(existingProfile).length > 0) {
        // Extract the actual profile object from the observable structure
        const profileObj = Object.values(existingProfile)[0];
        if (profileObj && profileObj.id) {
          // If profile observable has an ID, assume user is authenticated and use that ID
          user = { id: profileObj.id, email: profileObj.email };
        }
      } else {
        // Fallback to direct Supabase auth if profile observable is not yet populated
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser ? { id: authUser.id, email: authUser.email || null } : null;
      }

      if (!user) throw new Error('No authenticated user');

      // Create the profile data with the correct structure
      const fullProfileData: Database['public']['Tables']['profiles']['Row'] = {
        id: user.id,
        email: user.email || null,
        full_name: profileData.full_name || null,
        avatar_url: profileData.avatar_url || null,
        membership_tier: profileData.membership_tier || null,
        is_premium: profileData.is_premium || null,
        has_seen_onboarding: profileData.has_seen_onboarding || null,
        created_at: new Date().toISOString(),
      };

      // Set the profile in the observable using the correct structure
      profile$.assign!({
        [user.id]: fullProfileData
      });
      
      // Refresh user data after creating profile
      await fetchUserData();
      
      const updatedProfile = profile$.get();
      return updatedProfile ? Object.values(updatedProfile)[0] : null;
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
    currentUserSightings,
    allUsersSightings,
    allUsersAchievements,
    wishlists,
    profile,
    achievements,
    userAchievements,
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