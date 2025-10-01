import { useObservable } from '@legendapp/state/react';
import { 
  categories$,
  creatures$,
  getCategories,
  getCreatures
} from '../../syncedObservables';
// Import all query functions
import * as queries from '../queries/queries';
import { CatalogState, CatalogActions, CatalogData } from '../types/types';

// Utility function to extract actual values from observable objects
const extractObservableValues = (obj: any): any => {
  if (!obj) return obj;
  
  // If it's an observable with a get method, return its value
  if (typeof obj === 'object' && obj.get && typeof obj.get === 'function') {
    return obj.get();
  }
  
  // If it's an object, recursively extract values
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = extractObservableValues(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
};

export type CatalogStore = CatalogState & CatalogActions;

// Hook for accessing catalog data from observables
export const useCatalogObservable = () => {
  const categories = useObservable(categories$);
  const creatures = useObservable(creatures$);
  
  return {
    categories,
    creatures
  };
};

// Updated store that uses observables for data
export const useCatalogStore = () => {
  // Get catalog data from observables
  const { categories, creatures } = useCatalogObservable();
  
  // Convert to arrays with actual values
  const categoriesArray = categories ? 
    Object.values(categories).map(item => extractObservableValues(item)) : [];
  const creaturesArray = creatures ? 
    Object.values(creatures).map(item => extractObservableValues(item)) : [];
  
  return {
    // Data from observables
    catalog: {
      categories: categoriesArray,
      creatures: creaturesArray,
      achievements: [], // Keep using queries for achievements as they may not be in observables
    },
    isLoading: false, // Observables handle loading state internally
    error: null, // Observables handle error state internally
    
    // Actions that work with observables
    fetchCatalog: async (): Promise<CatalogData> => {
      // Data is automatically loaded by observables
      // We can trigger a refresh by accessing the observables
      getCategories();
      getCreatures();
      
      const achievements = await queries.getAchievements();
      
      const catalogData: CatalogData = {
        categories: categoriesArray,
        creatures: creaturesArray,
        achievements: achievements || [],
      };
      
      return catalogData;
    },

    getCategories: async (): Promise<any[]> => {
      // Data is automatically loaded by observables
      getCategories();
      return categoriesArray;
    },

    getCreatures: async (): Promise<any[]> => {
      // Data is automatically loaded by observables
      getCreatures();
      return creaturesArray;
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
        // Filter creatures by category ID
        const filteredCreatures = creaturesArray.filter(
          creature => creature.category_id === categoryId
        );
        return filteredCreatures;
      } catch (error) {
        console.error('Error fetching creatures by category:', error);
        return [];
      }
    },

    reset: () => {
      // Reset is handled by the observable system
    },
  };
};