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
  allUsersProfiles$, // Added profiles$
  achievements$,
  userAchievements$,
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
  // For profile, we need to handle it specially to ensure we get the current user's profile
  const profile = use$(currentUserProfile$);
  const allProfiles = use$(allUsersProfiles$); // Added allProfiles
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
  const profileSyncState = useObservable(syncState(currentUserProfile$));
  const achievementsSyncState = useObservable(syncState(achievements$));
  const userAchievementsSyncState = useObservable(syncState(userAchievements$));
  const profilesSyncState = useObservable(syncState(allUsersProfiles$)); // Added profilesSyncState

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
      allUsersProfiles$.get();
    }
  };

  // Fetch functions for user data
  const fetchUserData = async () => {
    // Trigger loading of user data if not already loaded
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
    // Trigger loading of dive sites if not already loaded
    if (!diveSitesSyncState.isLoaded.get()) {
      diveSites$.get();
    }
  };

  // Ensure user profile exists, creating it if necessary
  const ensureUserProfile = async (): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      console.log('[ensureUserProfile] Starting profile check');
      
      // Try to get user from profile observable first
      const existingProfile = currentUserProfile$.get();
      console.log('[ensureUserProfile] Existing profile from observable:', { 
        hasExistingProfile: !!existingProfile,
        profileKeys: existingProfile ? Object.keys(existingProfile) : null,
        profileValues: existingProfile ? Object.values(existingProfile) : null
      });
      
      let user: { id: string; email: string | null } | null = null;

      if (existingProfile && Object.keys(existingProfile).length > 0) {
        // Extract the actual profile object from the observable structure
        const profileObj = Object.values(existingProfile)[0];
        console.log('[ensureUserProfile] Profile object from observable:', profileObj);
        
        if (profileObj && profileObj.id) {
          // If profile observable has an ID, assume user is authenticated and use that ID
          user = { id: profileObj.id, email: profileObj.email };
          console.log('[ensureUserProfile] Using user from profile observable:', user);
        }
      } else {
        // Fallback to direct Supabase auth if profile observable is not yet populated
        console.log('[ensureUserProfile] Falling back to Supabase auth');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser ? { id: authUser.id, email: authUser.email || null } : null;
        console.log('[ensureUserProfile] User from Supabase auth:', user);
      }

      if (!user) {
        console.log('[ensureUserProfile] No authenticated user found');
        return null;
      }

      // Try to fetch existing profile by loading the profile observable
      const currentProfile = currentUserProfile$.get();
      console.log('[ensureUserProfile] Current profile state:', currentProfile);
      
      // Extract the actual profile object from the observable structure
      const userProfile = currentProfile ? Object.values(currentProfile)[0] : undefined;
      console.log('[ensureUserProfile] Extracted user profile:', userProfile);

      if (userProfile && userProfile.id) {
        console.log('[ensureUserProfile] Profile already exists, returning it');
        return userProfile;
      }

      // Create new profile if it doesn't exist
      console.log('[ensureUserProfile] Creating new profile');
      
      // Use email username as default full name
      const defaultFullName = user.email ? user.email.split('@')[0] : null;
      const newProfile: Database['public']['Tables']['profiles']['Insert'] = {
        id: user.id,
        email: user.email || null,
        full_name: defaultFullName, // Use email username as default full name
        avatar_url: null, // We don't have user metadata here
        membership_tier: null,
        is_premium: null,
        has_seen_onboarding: null,
      };

      console.log('[ensureUserProfile] New profile data:', newProfile);
      
      // Set the profile in the observable using the correct structure
      currentUserProfile$.assign!({
        [user.id]: newProfile as Database['public']['Tables']['profiles']['Row']
      });
      
      console.log('[ensureUserProfile] Profile assigned to observable');
      
      const updatedProfile = currentUserProfile$.get();
      const result = updatedProfile ? Object.values(updatedProfile)[0] : null;
      console.log('[ensureUserProfile] Final profile result:', result);
      
      return result;
    } catch (error) {
      console.error('[ensureUserProfile] Error ensuring user profile:', error);
      return null;
    }
  };

  // Create profile for current user
  const createProfileForCurrentUser = async (
    profileData: Partial<Database['public']['Tables']['profiles']['Insert']>
  ): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
    try {
      console.log('[createProfileForCurrentUser] Starting profile creation process', { profileData });
      
      // Try to get user from profile observable first
      const existingProfile = currentUserProfile$.get();
      console.log('[createProfileForCurrentUser] Existing profile from observable:', { 
        hasExistingProfile: !!existingProfile,
        profileKeys: existingProfile ? Object.keys(existingProfile) : null
      });
      
      let user: { id: string; email: string | null } | null = null;

      if (existingProfile && Object.keys(existingProfile).length > 0) {
        // Extract the actual profile object from the observable structure
        const profileObj = Object.values(existingProfile)[0];
        console.log('[createProfileForCurrentUser] Profile object from observable:', profileObj);
      
        if (profileObj && profileObj.id) {
          // If profile observable has an ID, assume user is authenticated and use that ID
          user = { id: profileObj.id, email: profileObj.email };
          console.log('[createProfileForCurrentUser] Using user from profile observable:', user);
        }
      } else {
        // Fallback to direct Supabase auth if profile observable is not yet populated
        console.log('[createProfileForCurrentUser] Falling back to Supabase auth');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser ? { id: authUser.id, email: authUser.email || null } : null;
        console.log('[createProfileForCurrentUser] User from Supabase auth:', user);
      }

      if (!user) {
        console.error('[createProfileForCurrentUser] No authenticated user found');
        throw new Error('No authenticated user');
      }
    
      console.log('[createProfileForCurrentUser] Found user:', { userId: user.id, email: user.email });
    
      // Directly fetch the profile from the database to ensure we have the latest data
      console.log('[createProfileForCurrentUser] Directly fetching profile from database');
      const { data: dbProfileData, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Type the database profile properly
      const dbProfile = dbProfileData as Database['public']['Tables']['profiles']['Row'] | null;
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('[createProfileForCurrentUser] Error fetching profile from database:', fetchError);
      }
    
      console.log('[createProfileForCurrentUser] Profile from database:', { 
        hasProfile: !!dbProfile,
        fullName: dbProfile?.full_name,
        email: dbProfile?.email,
        id: dbProfile?.id
      });
    
      // Use email username as default full name if not provided
      const defaultFullName = user.email ? user.email.split('@')[0] : null;
      let finalFullName = profileData.full_name || defaultFullName;
    
      // Log the name comparison for debugging
      console.log('[createProfileForCurrentUser] Name comparison:', {
        defaultFullName,
        providedName: profileData.full_name,
        databaseName: dbProfile?.full_name,
        isCustomName: dbProfile?.full_name && dbProfile.full_name !== defaultFullName
      });
    
      // If we're not explicitly setting a new name and profile already exists with custom name, preserve it
      if (!profileData.full_name && dbProfile && dbProfile.full_name && dbProfile.full_name !== defaultFullName) {
        console.log('[createProfileForCurrentUser] Preserving existing custom profile name from database:', dbProfile.full_name);
        finalFullName = dbProfile.full_name;
      }
    
      // Log all profile data fields for debugging
      console.log('[createProfileForCurrentUser] Profile data fields:', {
        id: user.id,
        email: user.email || null,
        full_name: finalFullName,
        avatar_url: profileData.avatar_url || dbProfile?.avatar_url || null,
        membership_tier: profileData.membership_tier || dbProfile?.membership_tier || null,
        is_premium: profileData.is_premium || dbProfile?.is_premium || null,
        has_seen_onboarding: profileData.has_seen_onboarding || dbProfile?.has_seen_onboarding || null,
        created_at: dbProfile?.created_at || new Date().toISOString(),
      });
    
      const fullProfileData: Database['public']['Tables']['profiles']['Row'] = {
        id: user.id,
        email: user.email || null,
        full_name: finalFullName, // Use preserved name, provided name, or email username
        avatar_url: profileData.avatar_url || dbProfile?.avatar_url || null,
        membership_tier: profileData.membership_tier || dbProfile?.membership_tier || null,
        is_premium: profileData.is_premium || dbProfile?.is_premium || null,
        has_seen_onboarding: profileData.has_seen_onboarding || dbProfile?.has_seen_onboarding || null,
        created_at: dbProfile?.created_at || new Date().toISOString(),
      };
    
      console.log('[createProfileForCurrentUser] Creating profile with full_name:', fullProfileData.full_name, { 
        defaultFullName, 
        providedName: profileData.full_name,
        preservedName: dbProfile?.full_name
      });
    
      // Set the profile in the observable using the correct structure
      currentUserProfile$.assign!({
        [user.id]: fullProfileData
      });
    
      console.log('[createProfileForCurrentUser] Profile assigned to observable, forcing sync');
    
      // Force sync and fetch to ensure data consistency
      await forceSyncAll();
      await fetchUserData();
    
      const updatedProfile = currentUserProfile$.get();
      const result = updatedProfile ? Object.values(updatedProfile)[0] : null;
      console.log('[createProfileForCurrentUser] Profile creation complete', { 
        hasResult: !!result,
        resultFullName: result?.full_name,
        resultId: result?.id
      });
    
      return result;
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