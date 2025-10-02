import { observable } from '@legendapp/state';
import { createSyncedObservable } from '../services/legendStateConfig';
import { supabase } from '../services/supabase';
import { Database } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

// Types for our observables
export type Creature = Database['public']['Tables']['creatures']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type DiveSite = Database['public']['Tables']['dive_sites']['Row'];
export type Sighting = Database['public']['Tables']['sightings']['Row'];
export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];

// User ID tracking
let currentUserID: string | null = null;

export const setCurrentUserID = (userId: string | null) => {
  currentUserID = userId;
};

// Synced observables for read-only data (catalog)
export const categories$ = observable(createSyncedObservable({
  supabase,
  collection: 'categories',
  actions: ['read'],
  persist: { name: 'categories' },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
}));

export const creatures$ = observable(createSyncedObservable({
  supabase,
  collection: 'creatures',
  actions: ['read'],
  persist: { name: 'creatures' },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
}));

export const achievements$ = observable(createSyncedObservable({
  supabase,
  collection: 'achievements',
  actions: ['read'],
  persist: { name: 'achievements' },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
}));

export const diveSites$ = observable(createSyncedObservable({
  supabase,
  collection: 'dive_sites',
  actions: ['read'],
  persist: { name: 'dive_sites' },
  changesSince: 'last-sync',
}));

// Synced observables for user-specific data
// These will be initialized with user ID filter when user logs in

// Sightings observable - user-specific
export const sightings$ = observable(createSyncedObservable({
  supabase,
  collection: 'sightings',
  filter: (select: any) => currentUserID ? select.eq('user_id', currentUserID) : select,
  actions: ['read', 'create', 'update', 'delete'],
  persist: { name: 'sightings', retrySync: true },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: currentUserID ? { filter: `user_id=eq.${currentUserID}` } : false,
}));

// Wishlists observable - user-specific
export const wishlists$ = observable(createSyncedObservable({
  supabase,
  collection: 'wishlists',
  filter: (select: any) => currentUserID ? select.eq('user_id', currentUserID) : select,
  actions: ['read', 'create', 'delete'],
  persist: { name: 'wishlists', retrySync: true },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: currentUserID ? { filter: `user_id=eq.${currentUserID}` } : false,
}));

// Profile observable - user-specific
export const profile$ = observable(createSyncedObservable({
  supabase,
  collection: 'profiles',
  filter: (select: any) => currentUserID ? select.eq('id', currentUserID) : select,
  actions: ['read', 'update'],
  persist: { name: 'profile', retrySync: true },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: currentUserID ? { filter: `id=eq.${currentUserID}` } : false,
}));

export const profiles$ = observable(createSyncedObservable({
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
export const getDiveSites = () => diveSites$.get();
export const getSightings = () => sightings$.get();
export const getWishlists = () => wishlists$.get();
export const getProfile = () => profile$.get();

// Utility functions for creating new records
export const createSighting = (sightingData: Omit<Sighting, 'id' | 'created_at' | 'user_id'>) => {
  if (!currentUserID) {
    throw new Error('User must be logged in to create sightings');
  }
  
  const id = uuidv4();
  
  sightings$[id].set({
    ...sightingData,
    id,
    user_id: currentUserID,
    created_at: new Date().toISOString(),
  } as Sighting);
};

export const createWishlistItem = (creatureId: string) => {
  if (!currentUserID) {
    throw new Error('User must be logged in to create wishlist items');
  }
  
  const id = uuidv4();
  
  wishlists$[id].set({
    id,
    user_id: currentUserID,
    creature_id: creatureId,
    created_at: new Date().toISOString(),
  } as Wishlist);
};

export const createDiveSite = (diveSiteData: Omit<DiveSite, 'id' | 'created_at'>) => {
  if (!currentUserID) {
    throw new Error('User must be logged in to create dive sites');
  }
  
  const id = uuidv4();
  
  diveSites$[id].set({
    ...diveSiteData,
    id,
    created_at: new Date().toISOString(),
  } as DiveSite);
};

export const removeWishlistItem = (wishlistId: string) => {
  delete wishlists$[wishlistId];
};

// Toggle wishlist item - adds if not in wishlist, removes if already in wishlist
export const toggleWishlistItem = async (creatureId: string): Promise<boolean> => {
  if (!currentUserID) {
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
    return true; // Item added
  }
};

// Function to update user profile
export const updateUserProfile = async (updates: Partial<Profile>) => {
  if (!currentUserID) {
    throw new Error('User must be logged in to update profile');
  }
  
  // Get the current profile data
  const currentProfile = profile$.get() || {};
  
  // Update the profile observable with the new data
  profile$.set({
    ...currentProfile,
    ...updates,
    id: currentUserID, // Ensure the ID remains correct
  });
  
  // Sync the changes to Supabase
  await profile$.sync().save();
};
