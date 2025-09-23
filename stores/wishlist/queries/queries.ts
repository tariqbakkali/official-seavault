import { supabase } from '../../../services/supabase';
import { Database } from '../../../types/database';

// Wishlist queries
export const getWishlistByUserId = async (userId: string): Promise<Database['public']['Tables']['wishlists']['Row'][]> => {
  const { data, error } = await supabase
    .from('wishlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const addToWishlist = async (wishlistItem: Database['public']['Tables']['wishlists']['Insert']): Promise<Database['public']['Tables']['wishlists']['Row'] | null> => {
  const { data, error } = await (supabase as any)
    .from('wishlists')
    .insert([wishlistItem])
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};

export const removeFromWishlist = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const isCreatureInWishlist = async (userId: string, creatureId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('creature_id', creatureId)
    .maybeSingle();
  
  if (error) throw error;
  return !!data;
};