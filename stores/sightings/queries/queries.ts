import { supabase } from '../../../services/supabase';
import { Database } from '../../../types/database';

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