import { supabase } from '../../../services/supabase';
import { Database } from '../../../types/database';

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