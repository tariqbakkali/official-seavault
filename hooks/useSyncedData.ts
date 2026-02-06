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
  currentUserProfile$,
  allUsersProfiles$,
  achievements$,
  userAchievements$,
  createSighting,
  createWishlistItem,
  createDiveSite,
  toggleWishlistItem,
  removeWishlistItem,
  updateUserProfile,
  friends$,
  updateSighting,
  deleteSighting,
} from '../stores/syncedObservables';
import { supabase } from '../services/supabase';
import { Database } from '../types/database';
import { forceSyncAll } from '@/utils/syncUtils';

// Hook that provides all data and mutation functions with loading and error states
export const useSyncedData = () => {
  const categories = use$(categories$);
  const creatures = use$(creatures$);
  const diveSites = use$(diveSites$);
  const currentUserSightings = use$(currentUserSightings$);
  const allUsersSightings = use$(allUsersSightings$);
  const allUsersAchievements = use$(allUsersAchievements$);
  const wishlists = use$(wishlists$);
  const profile = use$(currentUserProfile$);
  const allProfiles = use$(allUsersProfiles$);
  const achievements = use$(achievements$);
  const userAchievements = use$(userAchievements$);
  const friends = use$(friends$);

  const categoriesSyncState = useObservable(syncState(categories$));
  const creaturesSyncState = useObservable(syncState(creatures$));
  const diveSitesSyncState = useObservable(syncState(diveSites$));
  const currentUserSightingsSyncState = useObservable(syncState(currentUserSightings$));
  const allUsersSightingsSyncState = useObservable(syncState(allUsersSightings$));
  const allUsersAchievementsSyncState = useObservable(syncState(allUsersAchievements$));
  const wishlistsSyncState = useObservable(syncState(wishlists$));
  const profileSyncState = useObservable(syncState(currentUserProfile$));
  const achievementsSyncState = useObservable(syncState(achievements$));
  const userAchievementsSyncState = useObservable(syncState(userAchievements$));
  const profilesSyncState = useObservable(syncState(allUsersProfiles$));
  const friendsSyncState = useObservable(syncState(friends$)); 

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
    allProfiles: !profilesSyncState.isLoaded,
    friends: !friendsSyncState.isLoaded,
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
    allProfiles: profilesSyncState.error,
    friends: friendsSyncState.error,
  };

  // Fetch functions for catalog data
  const fetchCatalog = async () => {
    if (!categoriesSyncState.isLoaded.get()) {
      categories$.get();
    }
    if (!creaturesSyncState.isLoaded.get()) {
      creatures$.get();
    }
    if (!achievementsSyncState.isLoaded.get()) {
      achievements$.get();
    }
    if (!profilesSyncState.isLoaded.get()) {
      allUsersProfiles$.get();
    }
    if (!friendsSyncState.isLoaded.get()) {
      friends$.get();
    }
  };

  // Fetch functions for user data
  const fetchUserData = async () => {
    if (!profileSyncState.isLoaded.get()) {
      currentUserProfile$.get();
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
    if (!diveSitesSyncState.isLoaded.get()) {
      diveSites$.get();
    }
  };

  // Ensure user profile exists, creating it if necessary
  const ensureUserProfile = async (): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      const existingProfile = currentUserProfile$.get();
      let user: { id: string; email: string | null } | null = null;

      if (existingProfile && Object.keys(existingProfile).length > 0) {
        const values = Object.values(existingProfile);
        if (values.length > 0) {
          const profileObj = values[0] as Database['public']['Tables']['profiles']['Row'];
          if (profileObj && typeof profileObj === 'object' && 'id' in profileObj) {
            user = { id: profileObj.id, email: profileObj.email };
          }
        }
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser ? { id: authUser.id, email: authUser.email || null } : null;
      }

      if (!user) return null;

      const currentProfile = currentUserProfile$.get();
      const currentProfileVal = currentProfile ? Object.values(currentProfile) : [];
      const userProfile = currentProfileVal.length > 0 ? (currentProfileVal[0] as Database['public']['Tables']['profiles']['Row']) : undefined;

      if (userProfile && userProfile.id) return userProfile;

      const defaultFullName = user.email ? user.email.split('@')[0] : null;
      const newProfile: Database['public']['Tables']['profiles']['Insert'] = {
        id: user.id,
        email: user.email || null,
        full_name: defaultFullName,
        avatar_url: null,
        membership_tier: null,
        is_premium: null,
        has_seen_onboarding: null,
        updated_at: new Date().toISOString(),
      };
      
      // @ts-ignore - Legend State typing issue
      currentUserProfile$.assign({
        [user.id]: newProfile as Database['public']['Tables']['profiles']['Row']
      });
      
      const updatedProfile = currentUserProfile$.get();
      return updatedProfile ? Object.values(updatedProfile)[0] : null;
    } catch (error) {
      return null;
    }
  };

  // Create profile for current user
  const createProfileForCurrentUser = async (
    profileData: Partial<Database['public']['Tables']['profiles']['Insert']>
  ): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      const existingProfile = currentUserProfile$.get();
      let user: { id: string; email: string | null } | null = null;

      if (existingProfile && Object.keys(existingProfile).length > 0) {
        const profileObj = Object.values(existingProfile)[0];
        if (profileObj && profileObj.id) {
          user = { id: profileObj.id, email: profileObj.email };
        }
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser ? { id: authUser.id, email: authUser.email || null } : null;
      }

      if (!user) throw new Error('No authenticated user');
    
      const { data: dbProfileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      const dbProfile = dbProfileData as Database['public']['Tables']['profiles']['Row'] | null;
      const defaultFullName = user.email ? user.email.split('@')[0] : null;
      let finalFullName = profileData.full_name || defaultFullName;
    
      if (!profileData.full_name && dbProfile && dbProfile.full_name && dbProfile.full_name !== defaultFullName) {
        finalFullName = dbProfile.full_name;
      }
    
      const fullProfileData: Database['public']['Tables']['profiles']['Row'] = {
        id: user.id,
        email: user.email || null,
        full_name: finalFullName,
        avatar_url: profileData.avatar_url || dbProfile?.avatar_url || null,
        membership_tier: profileData.membership_tier || dbProfile?.membership_tier || null,
        is_premium: profileData.is_premium || dbProfile?.is_premium || null,
        has_seen_onboarding: profileData.has_seen_onboarding || dbProfile?.has_seen_onboarding || null,
        created_at: dbProfile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    
      // @ts-ignore - Legend State typing issue
      currentUserProfile$.assign({
        [user.id]: fullProfileData
      });
    
      await forceSyncAll();
      await fetchUserData();
    
      const updatedProfile = currentUserProfile$.get();
      return updatedProfile ? Object.values(updatedProfile)[0] : null;
    } catch (error) {
      console.error('[createProfileForCurrentUser] Error creating profile:', error);
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
    friends,
    
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
    updateSighting,
    deleteSighting,
    createWishlistItem,
    createDiveSite,
    removeWishlistItem,
    toggleWishlistItem,
    updateUserProfile,
  };
};