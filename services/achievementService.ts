import { supabase } from '@/services/supabase';
import { UserAchievement } from '@/types/database';
import { userAchievements$, achievements$, allUsersAchievements$ } from '@/stores/syncedObservables';

/**
 * Check if a user has already unlocked an achievement
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * Check if a user has already unlocked an achievement
 */
export const hasUserUnlockedAchievement = async (userId: string, achievementId: string): Promise<boolean> => {
  const userAchievements = userAchievements$.get() || {};
  const achievementsArray = Object.values(userAchievements);
  
  return achievementsArray.some((ua: any) => 
    ua.user_id === userId && ua.achievement_id === achievementId
  );
};

/**
 * Award an achievement to a user
 */
export const awardAchievement = async (userId: string, achievementId: string): Promise<UserAchievement | null> => {
  
  // Check if user already has this achievement
  const alreadyUnlocked = await hasUserUnlockedAchievement(userId, achievementId);
  if (alreadyUnlocked) {
    return null;
  }

  const id = uuidv4();
  const newAchievement = {
    id,
    user_id: userId,
    achievement_id: achievementId,
    unlocked_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  try {
    // Award the achievement by updating the observable
    // This will trigger the sync to Supabase
    (userAchievements$ as any)[id].set(newAchievement);
    (allUsersAchievements$ as any)[id].set(newAchievement);
    
    return newAchievement as UserAchievement;
  } catch (error) {
    console.error('Error awarding achievement:', error);
    return null;
  }
};

/**
 * Get all achievements for a user
 */
export const getUserAchievements = async (userId: string): Promise<UserAchievement[]> => {
  const userAchievements = userAchievements$.get() || {};
  const achievementsArray = Object.values(userAchievements);
  
  return achievementsArray.filter((ua: any) => ua.user_id === userId) as UserAchievement[];
};

/**
 * Check and award achievements based on user sightings
 */
export const checkAndAwardSightingAchievements = async (userId: string, creatureCount: number) => {
  
  // Define achievement thresholds
  const achievementThresholds = [
    { count: 1, code: 'first_catch' },
    { count: 5, code: 'getting_feet_wet' },
    { count: 10, code: 'underwater_explorer' },
    { count: 25, code: 'marine_enthusiast' },
    { count: 50, code: 'ocean_archivist' },
    { count: 100, code: 'sea_vault_master' }
  ];

  // Get all thresholds that have been reached or exceeded
  const reachedThresholds = achievementThresholds.filter(t => creatureCount >= t.count);
  
  // Award all achievements for reached thresholds
  for (const threshold of reachedThresholds) {
    
    // Get the achievement by code from observable
    const allAchievements = achievements$.get() || {};
    const achievementsArray = Object.values(allAchievements);
    const achievement = achievementsArray.find((a: any) => a.code === threshold.code);

    if (!achievement) {
      console.error('Achievement not found:', threshold.code);
      continue;
    }

    
    // Award the achievement
    const result = await awardAchievement(userId, (achievement as any).id);
  }
};
