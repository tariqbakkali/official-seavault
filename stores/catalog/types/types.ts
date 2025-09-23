import { Database } from '../../../types/database';

export interface CatalogData {
  categories: Database['public']['Tables']['categories']['Row'][];
  creatures: Database['public']['Tables']['creatures']['Row'][];
  achievements: Database['public']['Tables']['achievements']['Row'][];
}

export interface CatalogState {
  catalog: CatalogData | null;
  isLoading: boolean;
  error: string | null;
}

export interface CatalogActions {
  fetchCatalog: () => Promise<CatalogData>;
  getCategories: () => Promise<Database['public']['Tables']['categories']['Row'][]>;
  getCreatures: () => Promise<Database['public']['Tables']['creatures']['Row'][]>;
  getAchievements: () => Promise<Database['public']['Tables']['achievements']['Row'][]>;
  getCreaturesByCategoryId: (categoryId: string) => Promise<Database['public']['Tables']['creatures']['Row'][]>;
  reset: () => void;
}