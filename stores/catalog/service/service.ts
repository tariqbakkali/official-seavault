import { useCatalogStore } from '../store/store';
import { CatalogData } from '../types/types';
import { Database } from '@/types/database';

// Export functional service functions for backward compatibility
export const fetchCatalog = (): Promise<CatalogData> => {
  return useCatalogStore.getState().fetchCatalog();
};

export const getCategories = (): Promise<Database['public']['Tables']['categories']['Row'][]> => {
  return useCatalogStore.getState().getCategories();
};

export const getCreatures = (): Promise<Database['public']['Tables']['creatures']['Row'][]> => {
  return useCatalogStore.getState().getCreatures();
};

export const getAchievements = (): Promise<Database['public']['Tables']['achievements']['Row'][]> => {
  return useCatalogStore.getState().getAchievements();
};

export const getCreaturesByCategoryId = (categoryId: string): Promise<Database['public']['Tables']['creatures']['Row'][]> => {
  return useCatalogStore.getState().getCreaturesByCategoryId(categoryId);
};