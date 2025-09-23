import { useAchievementStore } from '../store/store';
import { Database } from '../../../types/database';

// Export functional service functions for backward compatibility
export const checkAchievements = (actionType: string, payload?: any): Promise<void> => {
  return useAchievementStore.getState().checkAchievements(actionType, payload);
};

export const getUnlockedAchievements = (): Promise<Database['public']['Tables']['achievements']['Row'][] | null> => {
  return useAchievementStore.getState().getUnlockedAchievements();
};

export const getAchievementProgress = (achievementCode: string): Promise<number> => {
  return useAchievementStore.getState().getAchievementProgress(achievementCode);
};