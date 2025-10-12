import { supabase } from '@/services/supabase';
import { UserAchievement } from '@/types/database';
import { userAchievements$ } from '@/stores/syncedObservables';

/**
 * Check if a user has already unlocked an achievement
 */
export const hasUserUnlockedAchievement = async (userId: string, achievementId: string): Promise<boolean> => {
  
  const { data, error } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .maybeSingle();

  if (error) {
    console.error('Error checking user achievement:', error);
    return false;
  }

  const result = !!data;
  return result;
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

  // Award the achievement
  const { data, error } = await supabase
    .from('user_achievements')
    .insert([{
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString()
    }] as any)
    .select();

  if (error) {
    console.error('Error awarding achievement:', error);
    return null;
  }

  
  // Force refresh the user achievements observable
  userAchievements$.get();
  
  return data && data.length > 0 ? data[0] : null;
};

/**
 * Get all achievements for a user
 */
export const getUserAchievements = async (userId: string): Promise<UserAchievement[]> => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }

  return data || [];
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
    
    // Get the achievement by code
    const { data: achievement, error } = await supabase
      .from('achievements')
      .select('id')
      .eq('code', threshold.code)
      .maybeSingle();

    if (error || !achievement) {
      console.error('Error fetching achievement:', error);
      continue;
    }

    
    // Award the achievement
    const result = await awardAchievement(userId, (achievement as any).id);
  }
};
