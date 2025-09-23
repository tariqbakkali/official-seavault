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

export const createSightingQuery = async (sighting: Database['public']['Tables']['sightings']['Insert']): Promise<Database['public']['Tables']['sightings']['Row'] | null> => {
  const { data, error } = await (supabase as any)
    .from('sightings')
    .insert([sighting])
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};

export const updateSighting = async (id: string, updates: Database['public']['Tables']['sightings']['Update']): Promise<Database['public']['Tables']['sightings']['Row'] | null> => {
  const { data, error } = await (supabase as any)
    .from('sightings')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};

export const deleteSighting = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('sightings')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
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

// Category queries
export const getCategories = async (): Promise<Database['public']['Tables']['categories']['Row'][]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const getCategoryById = async (id: string): Promise<Database['public']['Tables']['categories']['Row'] | null> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};

// Creature queries
export const getCreatures = async (): Promise<Database['public']['Tables']['creatures']['Row'][]> => {
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const getCreatureById = async (id: string): Promise<Database['public']['Tables']['creatures']['Row'] | null> => {
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};

export const getCreaturesByCategoryId = async (categoryId: string): Promise<Database['public']['Tables']['creatures']['Row'][]> => {
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .eq('category_id', categoryId)
    .order('name');
  
  if (error) throw error;
  return data || [];
};

// Dive site queries
export const getDiveSites = async (): Promise<Database['public']['Tables']['dive_sites']['Row'][]> => {
  const { data, error } = await supabase
    .from('dive_sites')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const getDiveSiteById = async (id: string): Promise<Database['public']['Tables']['dive_sites']['Row'] | null> => {
  const { data, error } = await supabase
    .from('dive_sites')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};

// Achievement queries
export const getAchievements = async (): Promise<Database['public']['Tables']['achievements']['Row'][]> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const getAchievementByCode = async (code: string): Promise<Database['public']['Tables']['achievements']['Row'] | null> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};