import { Creature, Category, UserAchievement, Achievement } from '@/types/database';

export interface UserStats {
  totalPoints: number;
  uniqueCreatures: number;
  overallCompletion: number;
  categoryStats: Record<string, {
    seen: number;
    total: number;
    completion: number;
    points: number; // Add points to category stats
  }>;
  categoryNames: Record<string, string>;
  achievementsUnlocked: number; // Add achievements unlocked count
  recentAchievements?: any[]; // Add recent achievements
}

// Updated function signature to accept observable data directly
export const calculateUserStats = (
  userData: {
    sightings: any[];
    wishlists: any[];
    profile: any;
  },
  catalog: {
    creatures: Creature[];
    categories: Category[];
    achievements: Achievement[]; // Updated type
  },
  userAchievements?: UserAchievement[] // Updated type
): UserStats => {
  
  // Handle case where catalog is not yet loaded
  if (!catalog || !catalog.creatures || !catalog.categories) {
    return {
      totalPoints: 0,
      uniqueCreatures: 0,
      overallCompletion: 0,
      categoryStats: {},
      categoryNames: {},
      achievementsUnlocked: 0,
      recentAchievements: []
    };
  }

  // Calculate total points from sightings
  let totalPoints = 0;
  const seenCreatureIds = new Set<string>();
  
  // Create a map of creature ID to creature for quick lookup
  const creatureMap = new Map<string, Creature>();
  catalog.creatures.forEach((creature: Creature) => {
    creatureMap.set(creature.id, creature);
  });
  
  // Calculate points from sightings
  if (userData.sightings && Array.isArray(userData.sightings)) {
    userData.sightings.forEach((sighting: any) => {
      // Make sure sighting has a creature_id
      if (sighting && sighting.creature_id) {
        const creature = creatureMap.get(sighting.creature_id);
        if (creature) {
          totalPoints += creature.points || 0;
          seenCreatureIds.add(sighting.creature_id);
        }
      }
    });
  }
  
  // Create category stats
  const categoryStats: Record<string, { seen: number; total: number; completion: number; points: number }> = {};
  const categoryNames: Record<string, string> = {};
  
  // Initialize category stats with zeros
  catalog.categories.forEach((category: Category) => {
    categoryNames[category.id] = category.name;
    categoryStats[category.id] = {
      seen: 0,
      total: 0,
      completion: 0,
      points: 0 // Initialize points to 0
    };
  });
  
  // Count total creatures per category and calculate category points
  catalog.creatures.forEach((creature: Creature) => {
    if (categoryStats[creature.category_id]) {
      categoryStats[creature.category_id].total += 1;
      // Add creature points to category total if the creature has been seen
      if (seenCreatureIds.has(creature.id)) {
        categoryStats[creature.category_id].points += creature.points || 0;
      }
    }
  });
  
  // Count seen creatures per category
  seenCreatureIds.forEach((creatureId: string) => {
    const creature = creatureMap.get(creatureId);
    if (creature && categoryStats[creature.category_id]) {
      categoryStats[creature.category_id].seen += 1;
    }
  });
  
  // Calculate completion percentages
  Object.keys(categoryStats).forEach((categoryId: string) => {
    const stats = categoryStats[categoryId];
    if (stats.total > 0) {
      stats.completion = Math.round((stats.seen / stats.total) * 100);
    }
  });
  
  // Calculate overall completion
  const totalCreatures = catalog.creatures.length;
  const uniqueCreatures = seenCreatureIds.size;
  const overallCompletion = totalCreatures > 0 ? Math.round((uniqueCreatures / totalCreatures) * 100) : 0;
  
  // Calculate achievements unlocked
  const achievementsUnlocked = userAchievements ? userAchievements.length : 0;
  
  // Add achievement points to total points
  if (userAchievements && catalog.achievements) {
    // Create a map of achievement IDs to achievement objects for quick lookup
    const achievementMap = new Map<string, Achievement>();
    catalog.achievements.forEach((achievement: Achievement) => {
      achievementMap.set(achievement.id, achievement);
    });
    
    // Add points from unlocked achievements
    userAchievements.forEach((userAchievement: UserAchievement) => {
      const achievement = achievementMap.get(userAchievement.achievement_id);
      if (achievement && achievement.points) {
        totalPoints += achievement.points;
      }
    });
  }
  
  // Get recent achievements (last 5 unlocked)
  let recentAchievements: any[] = [];
  if (userAchievements && catalog.achievements) {
    // Create a map of achievement IDs to achievement objects
    const achievementMap = new Map<string, any>();
    catalog.achievements.forEach((achievement: any) => {
      achievementMap.set(achievement.id, achievement);
    });
    
    // Get the most recently unlocked achievements
    recentAchievements = userAchievements
      .slice(-5) // Get last 5 achievements
      .map((userAchievement: any) => {
        // Make sure userAchievement has an achievement_id
        if (userAchievement && userAchievement.achievement_id) {
          const achievement = achievementMap.get(userAchievement.achievement_id);
          return achievement ? { ...achievement, unlocked: true } : null;
        }
        return null;
      })
      .filter(Boolean) // Remove null values
      .reverse(); // Show most recent first
  }
  
  
  return {
    totalPoints,
    uniqueCreatures,
    overallCompletion,
    categoryStats,
    categoryNames,
    achievementsUnlocked,
    recentAchievements
  };
};