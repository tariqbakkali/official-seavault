import { observable } from '@legendapp/state';
import { createSyncedObservable } from '../services/legendStateConfig';
import { supabase } from '../services/supabase';
import { Database } from '../types/database';
import { v4 as uuidv4 } from 'uuid';

// Initialize Legend-State configuration
import { configureLegendState } from '../services/legendStateConfig';
configureLegendState();

// Types for our observables
export type Creature = Database['public']['Tables']['creatures']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type DiveSite = Database['public']['Tables']['dive_sites']['Row'];
export type Sighting = Database['public']['Tables']['sightings']['Row'];
export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

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
  filter: (select) => currentUserID ? select.eq('user_id', currentUserID) : select,
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
  filter: (select) => currentUserID ? select.eq('user_id', currentUserID) : select,
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
  filter: (select) => currentUserID ? select.eq('id', currentUserID) : select,
  actions: ['read', 'update'],
  persist: { name: 'profile', retrySync: true },
  changesSince: 'last-sync',
  fieldCreatedAt: 'created_at',
  realtime: currentUserID ? { filter: `id=eq.${currentUserID}` } : false,
}));

// Utility functions for working with the observables
export const getCategories = () => categories$.get();
export const getCreatures = () => creatures$.get();
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

export const removeWishlistItem = (wishlistId: string) => {
  delete wishlists$[wishlistId];
};