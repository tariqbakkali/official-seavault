import { useWishlistStore } from '../store/store';
import { Database } from '../../../types/database';

// Export functional service functions for backward compatibility
export const toggleWishlistItem = (creatureId: string): Promise<boolean> => {
  return useWishlistStore.getState().toggleWishlistItem(creatureId);
};

export const addToWishlist = (wishlistItem: Database['public']['Tables']['wishlists']['Insert']): Promise<Database['public']['Tables']['wishlists']['Row'] | null> => {
  return useWishlistStore.getState().addToWishlist(wishlistItem);
};

export const removeFromWishlist = (id: string): Promise<void> => {
  return useWishlistStore.getState().removeFromWishlist(id);
};

export const isCreatureInWishlist = (userId: string, creatureId: string): Promise<boolean> => {
  return useWishlistStore.getState().isCreatureInWishlist(userId, creatureId);
};