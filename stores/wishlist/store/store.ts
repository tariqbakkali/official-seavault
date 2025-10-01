import { useObservable } from '@legendapp/state/react';
import { 
  wishlists$,
  createWishlistItem as createWishlistItemObservable,
  removeWishlistItem as removeWishlistItemObservable
} from '../../syncedObservables';
import { supabase } from '../../../services/supabase';
import { WishlistState, WishlistActions } from '../types/types';
import { Database } from '../../../types/database';
// Import all query functions
import * as queries from '../queries/queries';

// Utility function to extract actual values from observable objects
const extractObservableValues = (obj: any): any => {
  if (!obj) return obj;
  
  // If it's an observable with a get method, return its value
  if (typeof obj === 'object' && obj.get && typeof obj.get === 'function') {
    return obj.get();
  }
  
  // If it's an object, recursively extract values
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = extractObservableValues(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
};

export type WishlistStore = WishlistState & WishlistActions;

// Hook for accessing wishlist data from observables
export const useWishlistObservable = () => {
  const wishlists = useObservable(wishlists$);
  return wishlists;
};

// Updated store that uses observables for wishlist data
export const useWishlistStore = () => {
  // Get wishlist from observables
  const wishlists = useWishlistObservable();
  
  // Convert to array with actual values
  const wishlistsArray = wishlists ? 
    Object.values(wishlists).map(item => extractObservableValues(item)) : [];
  
  return {
    // State
    isLoading: false, // Observables handle loading state internally
    error: null, // Observables handle error state internally
    
    // Actions that work with observables
    toggleWishlistItem: async (creatureId: string): Promise<boolean> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        // Check if item is already wishlisted using observables
        const isInWishlist = wishlistsArray.some(item => item.creature_id === creatureId);

        if (isInWishlist) {
          // Find the wishlist item to remove
          const wishlistItem = wishlistsArray.find(item => item.creature_id === creatureId);
          
          if (wishlistItem) {
            // Use the observable-based remove function for local-first functionality
            removeWishlistItemObservable(wishlistItem.id);
            
            // For immediate feedback, we can still use the existing query
            await queries.removeFromWishlist(wishlistItem.id);
          }
          return false; // Item removed
        } else {
          // Use the observable-based create function for local-first functionality
          createWishlistItemObservable(creatureId);
          
          // For immediate feedback, we can still use the existing query
          const wishlistData: Database['public']['Tables']['wishlists']['Insert'] = {
            user_id: user.id,
            creature_id: creatureId,
          };

          await queries.addToWishlist(wishlistData);
          return true; // Item added
        }
      } catch (error) {
        console.error('Error toggling wishlist item:', error);
        return false;
      }
    },

    addToWishlist: async (wishlistItem: Database['public']['Tables']['wishlists']['Insert']): Promise<Database['public']['Tables']['wishlists']['Row'] | null> => {
      try {
        // Use the observable-based create function for local-first functionality
        createWishlistItemObservable(wishlistItem.creature_id);
        
        // For immediate feedback, we can still use the existing query
        const result = await queries.addToWishlist(wishlistItem);
        return result;
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        return null;
      }
    },

    removeFromWishlist: async (id: string): Promise<void> => {
      try {
        // Use the observable-based remove function for local-first functionality
        removeWishlistItemObservable(id);
        
        // For immediate feedback, we can still use the existing query
        await queries.removeFromWishlist(id);
      } catch (error) {
        console.error('Error removing from wishlist:', error);
        throw error;
      }
    },

    isCreatureInWishlist: async (userId: string, creatureId: string): Promise<boolean> => {
      try {
        // Check using observables
        return wishlistsArray.some(item => item.creature_id === creatureId);
      } catch (error) {
        console.error('Error checking wishlist status:', error);
        return false;
      }
    },

    reset: () => {
      // Reset is handled by the observable system
    },
  };
};