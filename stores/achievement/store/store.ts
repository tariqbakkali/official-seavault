import { create } from 'zustand';
import { supabase } from '../../../services/supabase';
import { AchievementState, AchievementActions } from '../types/types';
import { Database } from '../../../types/database';
// Import query functions
import * as queries from '../queries/queries';

export type AchievementStore = AchievementState & AchievementActions;

export const useAchievementStore = create<AchievementStore>((set, get) => ({
  // Initial state
  unlockedAchievements: null,
  isLoading: false,
  error: null,

  // Actions
  checkAchievements: async (actionType: string, payload?: any): Promise<void> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      // This is a simplified implementation
      // In a real app, you would check for specific achievements based on the actionType and payload
      console.log('Checking achievements for action:', actionType, payload);
      
      // Fetch unlocked achievements
      await get().getUnlockedAchievements();
      
      set((state) => ({ ...state, isLoading: false }));
    } catch (error) {
      console.error('Error checking achievements:', error);
      set((state) => ({ ...state, error: 'Failed to check achievements', isLoading: false }));
    }
  },

  getUnlockedAchievements: async (): Promise<Database['public']['Tables']['achievements']['Row'][] | null> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      // For now, we'll just return all achievements
      // In a real app, you would filter based on user progress
      const achievements = await queries.getAllAchievements();

      set((state) => ({ ...state, unlockedAchievements: achievements || null, isLoading: false }));
      return achievements || null;
    } catch (error) {
      console.error('Error fetching unlocked achievements:', error);
      set((state) => ({ ...state, error: 'Failed to fetch unlocked achievements', isLoading: false }));
      return null;
    }
  },

  getAchievementProgress: async (achievementCode: string): Promise<number> => {
    try {
      // For now, we'll just return 0
      // In a real app, you would check user progress for the specific achievement
      return 0;
    } catch (error) {
      console.error('Error fetching achievement progress:', error);
      return 0;
    }
  },

  resetAchievements: () => set({
    unlockedAchievements: null,
    isLoading: false,
    error: null,
  }),
}));