import { Database } from '../../../types/database';

export interface SightingsState {
  isLoading: boolean;
  error: string | null;
}

export interface SightingsActions {
  createSighting: (
    sighting: Omit<Database['public']['Tables']['sightings']['Insert'], 'user_id'>
  ) => Promise<Database['public']['Tables']['sightings']['Row'] | null>;
  updateSighting: (
    id: string,
    updates: Database['public']['Tables']['sightings']['Update']
  ) => Promise<Database['public']['Tables']['sightings']['Row'] | null>;
  deleteSighting: (id: string) => Promise<void>;
  reset: () => void;
}