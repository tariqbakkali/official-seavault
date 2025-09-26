import { supabase } from '../../../services/supabase';
import { Database } from '../../../types/database';

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

// Add function to create a new dive site
export const createDiveSite = async (
  diveSite: Database['public']['Tables']['dive_sites']['Insert']
): Promise<Database['public']['Tables']['dive_sites']['Row'] | null> => {
  const { data, error } = await (supabase as any)
    .from('dive_sites')
    .insert([diveSite])
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
};