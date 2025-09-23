import { Database } from '../../../types/database';

export interface WishlistState {
  isLoading: boolean;
  error: string | null;
}

export interface WishlistActions {
  toggleWishlistItem: (creatureId: string) => Promise<boolean>;
  addToWishlist: (wishlistItem: Database['public']['Tables']['wishlists']['Insert']) => Promise<Database['public']['Tables']['wishlists']['Row'] | null>;
  removeFromWishlist: (id: string) => Promise<void>;
  isCreatureInWishlist: (userId: string, creatureId: string) => Promise<boolean>;
  reset: () => void;
}