import { supabase } from '../../../services/supabase';
import { Database } from '../../../types/database';

// Profile queries
export const getProfileByUserId = async (userId: string): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};

export const createProfile = async (profile: Database['public']['Tables']['profiles']['Insert']): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .insert([profile])
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};

export const updateProfile = async (userId: string, updates: Database['public']['Tables']['profiles']['Update']): Promise<Database['public']['Tables']['profiles']['Row'] | null> => {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};

// Sighting queries
export const getSightingsByUserId = async (userId: string): Promise<Database['public']['Tables']['sightings']['Row'][]> => {
  const { data, error } = await supabase
    .from('sightings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

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