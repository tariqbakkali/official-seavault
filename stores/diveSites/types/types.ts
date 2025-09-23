import { Database } from '../../../types/database';

export interface DiveSitesState {
  diveSites: Database['public']['Tables']['dive_sites']['Row'][] | null;
  isLoading: boolean;
  error: string | null;
}

export interface DiveSitesActions {
  fetchDiveSites: () => Promise<Database['public']['Tables']['dive_sites']['Row'][]>;
  getDiveSiteById: (id: string) => Promise<Database['public']['Tables']['dive_sites']['Row'] | null>;
  reset: () => void;
}