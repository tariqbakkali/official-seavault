import { observable } from '@legendapp/state';
import { supabase } from '../services/supabase';
import { Database } from '../types/database';
import { v4 as uuidv4 } from 'uuid';
import { customSynced } from '@/services/legendStateConfig';
import { checkAndAwardSightingAchievements } from '@/services/achievementService';

// Types for our observables
export type Creature = Database['public']['Tables']['creatures']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type DiveSite = Database['public']['Tables']['dive_sites']['Row'];
export type Sighting = Database['public']['Tables']['sightings']['Row'];
export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];

// User ID tracking - using an observable to make it reactive
export const currentUserID$ = observable<string | null>(null);

export const setCurrentUserID = (userId: string | null) => {
  currentUserID$.set(userId);
};

// Helper function to get current user ID
export const getCurrentUserID = () => currentUserID$.get();

// Synced observables for read-only data (catalog)
export const categories$ = observable(customSynced({
  supabase,
  collection: 'categories',
  actions: ['read'],
  persist: { name: 'categories' },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
}));

export const creatures$ = observable(customSynced({
  supabase,
  collection: 'creatures',
  actions: ['read'],
  persist: { name: 'creatures' },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
}));

export const achievements$ = observable(customSynced({
  supabase,
  collection: 'achievements',
  actions: ['read'],
  persist: { name: 'achievements' },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
}));

export const userAchievements$ = observable(customSynced({
  supabase,
  collection: 'user_achievements',
  filter: (select: any) => {
    const userId = currentUserID$.get();
    if (!userId) return select.eq('user_id', 'no-auth-user-id'); // Return empty result for unauthenticated users
    return select.eq('user_id', userId);
  },
  actions: ['read'],
  persist: { name: 'user_achievements' },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: true,
}));

export const diveSites$ = observable(customSynced({
  supabase,
  collection: 'dive_sites',
  actions: ['read', 'update'],
  persist: { name: 'dive_sites' },
  changesSince: 'last-sync',
  update: async (input: any) => {
    const { data, error } = await supabase
      .from('dive_sites')
      .insert(input)
      .select()
      .single();
      if (error) {
        throw new Error(`Failed to update dive site: ${error.message}`);
      } 
  return { data, error: null };
  },
}));

// Synced observables for user-specific data
// These will be initialized with user ID filter when user logs in

// Current user sightings observable - user-specific
export const currentUserSightings$ = observable(customSynced({
  supabase,
  collection: 'sightings',
  filter: (select: any) => {
    const userId = currentUserID$.get();
    if (!userId)  return select.eq('id', 'no auth'); 
    return select.eq('user_id', userId);
  },
  actions: ['read', 'create', 'update', 'delete'],
  persist: { name: 'sightings', retrySync: true },
  changesSince: 'last-sync',
  update: async (input: any) => {
    // Custom Supabase update function for sightings
    const { data, error } = await supabase
      .from('sightings')
      .insert(input)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update sighting: ${error.message}`);
    }
    return { data, error: null };
  },
  fieldCreatedAt: 'created_at',
  realtime: true, // Enable realtime for all, filtering will be done by Supabase
}));

// All users sightings observable - for leaderboard and community features
export const allUsersSightings$ = observable(customSynced({
  supabase,
  collection: 'sightings',
  actions: ['read'],
  persist: { name: 'all_sightings' },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
}));

// All users achievements observable - for leaderboard and community features
export const allUsersAchievements$ = observable(customSynced({
  supabase,
  collection: 'user_achievements',
  actions: ['read'],
  persist: { name: 'all_user_achievements' },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
}));

// Wishlists observable - user-specific
export const wishlists$ = observable(customSynced({
  supabase,
  collection: 'wishlists',
  filter: (select: any) => {
    const userId = currentUserID$.get();
    if (!userId)  return select.eq('id', 'no auth'); 
    return select.eq('user_id', userId);
  },
  actions: ['read', 'update', 'delete'],
  update: async (input: any) => {

    if (input.deleted ) {
      const { data, error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', input.id)
      .select()
      .single();
      if (error) {
        throw new Error(`Failed to delete wishlist item: ${error.message}`);
      }
      return { data, error: null };
    }

    // Custom Supabase create function for wishlists
    const { data, error } = await supabase
      .from('wishlists')
      .insert(input)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create wishlist item: ${error.message}`);
    }
    
    return { data, error: null };
  },
  persist: { name: 'wishlists', retrySync: true },
  retry:{infinite: true},
  // changesSince: 'last-sync',
  // fieldCreatedAt: 'created_at',
  realtime: true, // Enable realtime for all, filtering will be done by Supabase
}));

// Profile observable - user-specific
export const profile$ = observable(customSynced({
  supabase,
  collection: 'profiles',
  filter: (select: any) => {
    const userId = currentUserID$.get();
    if (!userId)  return select.eq('id', 'no auth'); 
    return select.eq('id', userId);
  },
  actions: ['read', 'update'],
  persist: { name: 'profile', retrySync: true },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: true, // Enable realtime for all, filtering will be done by Supabase
}))

export const profiles$ = observable(customSynced({
  supabase,
  collection: 'profiles',
  actions: ['read'],
  persist: { name: 'profiles' },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
}));

// Utility functions for working with the observables
export const getCategories = () => categories$.get();
export const getCreatures = () => creatures$.get();
export const getAchievements = () => achievements$.get();
export const getUserAchievements = () => {
  const achievements = userAchievements$.get();
  return achievements;
};
export const getAllUsersAchievements = () => allUsersAchievements$.get();
export const getDiveSites = () => diveSites$.get();
export const getCurrentUserSightings = () => currentUserSightings$.get();
export const getAllUsersSightings = () => allUsersSightings$.get();
export const getWishlists = () => wishlists$.get();
export const getProfile = () => profile$.get();

// Utility functions for creating new records
export const createSighting = async (sightingData: Omit<Sighting, 'id' | 'created_at' | 'user_id'>) => {
  const userId = currentUserID$.get();
  if (!userId) {
    throw new Error('User must be logged in to create sightings');
  }
  
  
  const id = uuidv4();
  
  const newSighting = {
    ...sightingData,
    id,
    user_id: userId,
    created_at: new Date().toISOString(),
  } as Sighting;

  (currentUserSightings$ as any)[id].set(newSighting);

  // Check for achievements after creating the sighting
  try {
    // Get all current sightings to determine the count of unique creatures
    const allSightings = currentUserSightings$.get() || {};
    const sightingsArray = Object.values(allSightings);
    
    // Count unique creatures
    const uniqueCreatures = new Set(sightingsArray.map((s: any) => s.creature_id)).size;
    
    // Check and award achievements based on the count
    await checkAndAwardSightingAchievements(userId, uniqueCreatures);
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
  
  return newSighting;
};

export const createWishlistItem = async (creatureId: string) => {
  const userId = currentUserID$.get();
  if (!userId) {
    throw new Error('User must be logged in to create wishlist items');
  }
  
  const id = uuidv4();
  
  // Create the wishlist item data for insert
  const wishlistItemData = {
    id,
    user_id: userId,
    creature_id: creatureId,
    created_at: new Date().toISOString(),
  };
  
  try {
    // Set the data in the observable which will trigger the create action
    (wishlists$ as any)[id].set(wishlistItemData);
    
    return wishlistItemData;
  } catch (error: any) {
    console.error('Error creating wishlist item:', error);
    throw error;
  }
};

export const createDiveSite = (diveSiteData: Omit<DiveSite, 'id' | 'created_at'>) => {
  const userId = currentUserID$.get();
  if (!userId) {
    throw new Error('User must be logged in to create dive sites');
  }
  
  const id = uuidv4();
  
  (diveSites$ as any)[id].set({
    ...diveSiteData,
    id,
    created_at: new Date().toISOString(),
  } as DiveSite);
};

export const removeWishlistItem = (wishlistId: string) => {
  // Use Legend State's delete method instead of direct deletion
  (wishlists$ as any)[wishlistId].delete();
};

// Toggle wishlist item - adds if not in wishlist, removes if already in wishlist
export const toggleWishlistItem = async (creatureId: string): Promise<boolean> => {
  const userId = currentUserID$.get();

  if (!userId) {
    throw new Error('User must be logged in to toggle wishlist items');
  }
  
  // Get current wishlist items
  const currentWishlists = wishlists$.get() || {};
  
  // Check if item is already wishlisted by looking for an item with this creatureId
  const wishlistEntries = Object.values(currentWishlists);
  const existingWishlistItem = wishlistEntries.find((item: any) => 
    item && item.creature_id === creatureId
  ) as Wishlist | undefined;
  
  if (existingWishlistItem && existingWishlistItem.id) {
    // Remove from wishlist
    removeWishlistItem(existingWishlistItem.id);
    return false; // Item removed
  } else {
    // Add to wishlist
    createWishlistItem(creatureId);
    // We can't easily wait for the creation to complete, so we assume it works
    return true; // Item added
  }
};

// Function to update user profile
export const updateUserProfile = async (updates: Partial<Profile>) => {
  const userId = currentUserID$.get();
  if (!userId) {
    throw new Error('User must be logged in to update profile');
  }
  
  // Get the current profile data
  const currentProfile = profile$.get();
  
  // Get the existing profile object for this user, or create a default one
  const existingUserProfile = currentProfile?.[userId];
  
  // Create the updated profile object
  const updatedProfile = {
    id: userId,
    email: existingUserProfile?.email ?? null,
    full_name: existingUserProfile?.full_name ?? null,
    avatar_url: existingUserProfile?.avatar_url ?? null,
    membership_tier: existingUserProfile?.membership_tier ?? null,
    created_at: existingUserProfile?.created_at ?? new Date().toISOString(),
    is_premium: existingUserProfile?.is_premium ?? null,
    has_seen_onboarding: existingUserProfile?.has_seen_onboarding ?? null,
    ...updates,
  } as Profile;
  
  // Update the profile observable with the new data
  profile$.assign!({
    [userId]: updatedProfile
  });
};

export const getSightings = getCurrentUserSightings;

