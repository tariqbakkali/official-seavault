import { Creature, Category, UserAchievement, Achievement, Sighting } from '@/types/database';

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
    achievements: Achievement[];
  },
  userAchievements?: UserAchievement[],
  allCreatures?: Creature[]
): UserStats => {

  
  // Handle case where catalog is not yet loaded
  if (!catalog || !catalog.categories) {
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
  
  // Create a map of creature ID to creature for quick lookup from the loaded catalog
  const creatureMap = new Map<string, Creature>();
  if (catalog.creatures) {
    catalog.creatures.forEach((creature: Creature) => {
      creatureMap.set(creature.id, creature);
    });
  }
  
  // Create a map of creatureId -> categoryId to helper with stats
  const creatureCategoryMap = new Map<string, string>();
  if (catalog.creatures) {
    catalog.creatures.forEach(c => creatureCategoryMap.set(c.id, c.category_id));
  }

  // Calculate points from sightings and populate maps/sets
  if (userData.sightings && Array.isArray(userData.sightings)) {
    userData.sightings.forEach((sighting: any) => {
      // Make sure sighting has a creature_id
      if (sighting && sighting.creature_id) {
        // Try to find creature in catalog, or use joined data
        const creature = creatureMap.get(sighting.creature_id) || sighting.creatures;
        
        if (creature) {
          // console.log(`[StatsDebug] Found creature for sighting: ${sighting.creature_id} -> ${creature.name} (${creature.points} pts)`);
          totalPoints += creature.points || 0;
          seenCreatureIds.add(sighting.creature_id);
          
          // If we have category info in the joined data or map, ensure it's in our category map
          if (creature.category_id) {
             creatureCategoryMap.set(sighting.creature_id, creature.category_id);
          }
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
  // Note: If catalog.creatures is empty (lazy loaded), totals will be 0 initially unless we have counts
  // For now we rely on catalog.creatures for TOTALS. 
  // TODO: Use category.creatures_count if available for totals.
  if (catalog.creatures) {
    catalog.creatures.forEach((creature: Creature) => {
      if (categoryStats[creature.category_id]) {
        categoryStats[creature.category_id].total += 1;
        // Add creature points to category total if the creature has been seen
        if (seenCreatureIds.has(creature.id)) {
          categoryStats[creature.category_id].points += creature.points || 0;
        }
      }
    });
  }
  
  // Count seen creatures per category using the enhanced map
  seenCreatureIds.forEach((creatureId: string) => {
    const categoryId = creatureCategoryMap.get(creatureId);
    if (categoryId && categoryStats[categoryId]) {
      categoryStats[categoryId].seen += 1;
    }
  });
  
  // Calculate completion percentages
  Object.keys(categoryStats).forEach((categoryId: string) => {
    const stats = categoryStats[categoryId];
    // Use creature count from category if available (embedded count) as fallback for total
    // But here we don't have it easily accessible in this loop unless we map it.
    
    if (stats.total > 0) {
      stats.completion = Math.round((stats.seen / stats.total) * 100);
    }
  });
  
  
  // Calculate overall completion
  const totalCreatures = catalog.creatures ? catalog.creatures.length : 0;
  const uniqueCreatures = seenCreatureIds.size;
  const overallCompletion = totalCreatures > 0 ? Math.round((uniqueCreatures / totalCreatures) * 100) : 0;

  
  // Calculate achievements unlocked dynamically
  let dynamicallyUnlockedAchievementsCount = 0;
  if (catalog.achievements && allCreatures) {
    const creaturesMapForDynamic = new Map<string, Creature>(
      allCreatures.map((creature: Creature) => [creature.id, creature])
    );

    // Create sets of normalized creature names and classes for exact matching
    const sightedCreatureNames = new Set<string>();
    const sightedCreatureClasses = new Set<string>();
    seenCreatureIds.forEach(creatureId => {
      const creature = creaturesMapForDynamic.get(creatureId);
      if (creature && creature.name) {
        // Store normalized (lowercase) names for case-insensitive exact matching
        sightedCreatureNames.add(creature.name.toLowerCase());
        if (creature.class) {
          sightedCreatureClasses.add(creature.class);
        }
      }
    });

    catalog.achievements.forEach((achievement: Achievement) => {
      let progress = 0;
      let total = 0;

      if (achievement.category === 'collection' || achievement.category === 'beginner') {
        progress = uniqueCreatures; // uniqueCreatures is already calculated
        if (achievement.code === 'first_catch') {
          total = 1;
        } else {
          const match = achievement.description?.match(/Log (\d+) different species/);
          total = match ? parseInt(match[1], 10) : 0;
        }
      } else if (achievement.category === 'rare') {
        total = 1;
        switch (achievement.code) {
          case 'whale_watcher':
            // Check if user has sighted ANY creature with "whale" in the name (case-insensitive)
            progress = Array.from(sightedCreatureNames).some(name => name.includes('whale')) ? 1 : 0;
            break;
          case 'dolphin_friend':
            // Check if user has sighted ANY creature with "dolphin" in the name (case-insensitive)
            progress = Array.from(sightedCreatureNames).some(name => name.includes('dolphin')) ? 1 : 0;
            break;
          case 'manta_mania':
            // Check if user has sighted ANY creature with "manta" in the name (case-insensitive)
            // Note: Using "manta" instead of "manta ray" to catch variations like "Manta Ray", "Giant Manta", etc.
            progress = Array.from(sightedCreatureNames).some(name => name.includes('manta')) ? 1 : 0;
            break;
          case 'shark_whisperer':
            // Check if user has sighted ANY creature with "shark" in the name (case-insensitive)
            progress = Array.from(sightedCreatureNames).some(name => name.includes('shark')) ? 1 : 0;
            break;
          case 'elusive_spotter':
            progress = sightedCreatureClasses.has('Rare') ? 1 : 0;
            break;
          default:
            break;
        }
      }

      const isAlreadyUnlocked = userAchievements ? userAchievements.some(ua => ua.achievement_id === achievement.id) : false;
      const isCurrentlyMeetingCriteria = (total > 0 && progress >= total);

      // DYNAMIC LOCKING: Only count as unlocked if user CURRENTLY meets criteria
      // This means achievements can be locked if creatures are deleted or criteria change
      if (isCurrentlyMeetingCriteria) {
        dynamicallyUnlockedAchievementsCount++;
        
        // If user meets criteria but hasn't unlocked yet, unlock it
        if (!isAlreadyUnlocked) {
          console.log(`[statsService] User should unlock achievement: ${achievement.code}`);
          // Note: Actual unlocking happens in the UI/sync layer
        }
      } else if (isAlreadyUnlocked) {
        // User previously unlocked but no longer meets criteria - LOCK IT
        console.log(`[statsService] User no longer meets criteria for achievement: ${achievement.code} - will be locked`);
        // Note: Actual locking (deletion from user_achievements) should happen in sync layer
      }
    });
  }
  const achievementsUnlocked = dynamicallyUnlockedAchievementsCount;
  
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
    uniqueCreatures,
    overallCompletion,
    categoryStats,
    achievementsUnlocked,
    totalPoints,
    categoryNames,
    recentAchievements
  };
};

/**
 * Syncs user achievements with database based on current criteria
 * Unlocks new achievements and LOCKS (deletes) achievements where user no longer meets criteria
 */
export async function syncAchievements(
  userId: string,
  catalog: { achievements?: Achievement[] },
  allCreatures: Creature[],
  userSightings: Sighting[],
  userAchievements: UserAchievement[]
): Promise<{ toUnlock: string[], toLock: string[] }> {
  const toUnlock: string[] = [];
  const toLock: string[] = [];
  
  if (!catalog.achievements || !allCreatures) {
    return { toUnlock, toLock };
  }

  const seenCreatureIds = new Set(userSightings.map(s => s.creature_id));
  const creaturesMap = new Map(allCreatures.map(c => [c.id, c]));
  
  const sightedCreatureNames = new Set<string>();
  const sightedCreatureClasses = new Set<string>();
  seenCreatureIds.forEach(creatureId => {
    const creature = creaturesMap.get(creatureId);
    if (creature && creature.name) {
      sightedCreatureNames.add(creature.name.toLowerCase());
      if (creature.class) {
        sightedCreatureClasses.add(creature.class);
      }
    }
  });

  const uniqueCreatures = seenCreatureIds.size;

  catalog.achievements.forEach((achievement: Achievement) => {
    let progress = 0;
    let total = 0;

    // Calculate progress (same logic as calculateUserStats)
    if (achievement.category === 'collection' || achievement.category === 'beginner') {
      progress = uniqueCreatures;
      if (achievement.code === 'first_catch') {
        total = 1;
      } else {
        const match = achievement.description?.match(/Log (\d+) different species/);
        total = match ? parseInt(match[1], 10) : 0;
      }
    } else if (achievement.category === 'rare') {
      total = 1;
      switch (achievement.code) {
        case 'whale_watcher':
          progress = Array.from(sightedCreatureNames).some(name => name.includes('whale')) ? 1 : 0;
          break;
        case 'dolphin_friend':
          progress = Array.from(sightedCreatureNames).some(name => name.includes('dolphin')) ? 1 : 0;
          break;
        case 'manta_mania':
          progress = Array.from(sightedCreatureNames).some(name => name.includes('manta')) ? 1 : 0;
          break;
        case 'shark_whisperer':
          progress = Array.from(sightedCreatureNames).some(name => name.includes('shark')) ? 1 : 0;
          break;
        case 'elusive_spotter':
          progress = sightedCreatureClasses.has('Rare') ? 1 : 0;
          break;
      }
    }

    const isAlreadyUnlocked = userAchievements.some(ua => ua.achievement_id === achievement.id);
    const isCurrentlyMeetingCriteria = (total > 0 && progress >= total);

    if (isCurrentlyMeetingCriteria && !isAlreadyUnlocked) {
      toUnlock.push(achievement.id);
    } else if (!isCurrentlyMeetingCriteria && isAlreadyUnlocked) {
      toLock.push(achievement.id);
    }
  });

  return { toUnlock, toLock };
}