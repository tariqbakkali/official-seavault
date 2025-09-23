import { supabase } from '../../../services/supabase';
import { Database } from '../../../types/database';

// Achievement queries
export const getAllAchievements = async (): Promise<Database['public']['Tables']['achievements']['Row'][] | null> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || null;
};

export const getAchievementById = async (id: string): Promise<Database['public']['Tables']['achievements']['Row'] | null> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
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