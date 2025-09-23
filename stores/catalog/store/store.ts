import { create } from 'zustand';
import { CatalogState, CatalogActions, CatalogData } from '../types/types';
// Import all query functions
import * as queries from '../queries/queries';

export type CatalogStore = CatalogState & CatalogActions;

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  // Initial state
  catalog: null,
  isLoading: false,
  error: null,

  // Actions
  fetchCatalog: async (): Promise<CatalogData> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      // Fetch categories
      const categories = await queries.getCategories();

      // Fetch creatures
      const creatures = await queries.getCreatures();

      // Fetch achievements
      const achievements = await queries.getAchievements();

      const catalogData: CatalogData = {
        categories: categories || [],
        creatures: creatures || [],
        achievements: achievements || [],
      };

      set((state) => ({ ...state, catalog: catalogData, isLoading: false }));
      return catalogData;
    } catch (error) {
      console.error('Error fetching catalog:', error);
      const emptyCatalog: CatalogData = {
        categories: [],
        creatures: [],
        achievements: [],
      };
      set((state) => ({ ...state, error: 'Failed to fetch catalog data', isLoading: false }));
      return emptyCatalog;
    }
  },

  getCategories: async (): Promise<any[]> => {
    try {
      return await queries.getCategories();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  getCreatures: async (): Promise<any[]> => {
    try {
      return await queries.getCreatures();
    } catch (error) {
      console.error('Error fetching creatures:', error);
      return [];
    }
  },

  getAchievements: async (): Promise<any[]> => {
    try {
      return await queries.getAchievements();
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  },

  getCreaturesByCategoryId: async (categoryId: string): Promise<any[]> => {
    try {
      return await queries.getCreaturesByCategoryId(categoryId);
    } catch (error) {
      console.error('Error fetching creatures by category:', error);
      return [];
    }
  },

  reset: () => set({
    catalog: null,
    isLoading: false,
    error: null,
  }),
}));