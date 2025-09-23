import { Database } from '../../../types/database';

export interface AchievementState {
  unlockedAchievements: Database['public']['Tables']['achievements']['Row'][] | null;
  isLoading: boolean;
  error: string | null;
}

export interface AchievementActions {
  checkAchievements: (actionType: string, payload?: any) => Promise<void>;
  getUnlockedAchievements: () => Promise<Database['public']['Tables']['achievements']['Row'][] | null>;
  getAchievementProgress: (achievementCode: string) => Promise<number>;
  resetAchievements: () => void;
}