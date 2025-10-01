import { useObservable } from '@legendapp/state/react';
import { 
  categories$, 
  creatures$, 
  diveSites$, 
  sightings$, 
  wishlists$, 
  profile$,
  createSighting,
  createWishlistItem,
  removeWishlistItem
} from '../stores/syncedObservables';
import { Creature, Category, DiveSite, Sighting, Wishlist, Profile } from '../stores/syncedObservables';
import { supabase } from '../services/supabase';

/**
 * React hook for accessing synced data from Legend-State observables
 */

// Hook for accessing categories
export const useCategories = () => {
  const categories = useObservable(categories$);
  return categories;
};

// Hook for accessing creatures
export const useCreatures = () => {
  const creatures = useObservable(creatures$);
  return creatures;
};

// Hook for accessing dive sites
export const useDiveSites = () => {
  const diveSites = useObservable(diveSites$);
  return diveSites;
};

// Hook for accessing sightings
export const useSightings = () => {
  const sightings = useObservable(sightings$);
  return sightings;
};

// Hook for accessing wishlists
export const useWishlists = () => {
  const wishlists = useObservable(wishlists$);
  return wishlists;
};

// Hook for accessing profile
export const useProfile = () => {
  const profile = useObservable(profile$);
  return profile;
};

// Hook that provides all data and mutation functions
export const useSyncedData = () => {
  const categories = useObservable(categories$);
  const creatures = useObservable(creatures$);
  const diveSites = useObservable(diveSites$);
  const sightings = useObservable(sightings$);
  const wishlists = useObservable(wishlists$);
  const profile = useObservable(profile$);

  return {
    // Data
    categories,
    creatures,
    diveSites,
    sightings,
    wishlists,
    profile,
    
    // Mutation functions
    createSighting,
    createWishlistItem,
    removeWishlistItem,
  };
};

// Hook for checking if data is loading
export const useDataLoading = () => {
  // In a real implementation, we would check the loading status from Legend State
  // For now, we'll return a simple implementation
  return {
    categoriesLoading: false,
    creaturesLoading: false,
    diveSitesLoading: false,
    sightingsLoading: false,
    wishlistsLoading: false,
    profileLoading: false,
  };
};

// Hook for checking sync errors
export const useSyncErrors = () => {
  // In a real implementation, we would check for sync errors from Legend State
  // For now, we'll return a simple implementation
  return {
    categoriesError: null,
    creaturesError: null,
    diveSitesError: null,
    sightingsError: null,
    wishlistsError: null,
    profileError: null,
  };
};

export default useSyncedData;