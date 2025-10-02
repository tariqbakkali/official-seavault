import { Creature, Category } from '@/types/database';

export interface UserStats {
  totalPoints: number;
  uniqueCreatures: number;
  overallCompletion: number;
  categoryStats: Record<string, {
    seen: number;
    total: number;
    completion: number;
  }>;
  categoryNames: Record<string, string>;
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
    achievements: any[];
  }
): UserStats => {
  // Handle case where catalog is not yet loaded
  if (!catalog || !catalog.creatures || !catalog.categories) {
    return {
      totalPoints: 0,
      uniqueCreatures: 0,
      overallCompletion: 0,
      categoryStats: {},
      categoryNames: {}
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
  userData.sightings.forEach((sighting: any) => {
    const creature = creatureMap.get(sighting.creature_id);
    if (creature) {
      totalPoints += creature.points || 0;
      seenCreatureIds.add(sighting.creature_id);
    }
  });
  
  // Create category stats
  const categoryStats: Record<string, { seen: number; total: number; completion: number }> = {};
  const categoryNames: Record<string, string> = {};
  
  // Initialize category stats with zeros
  catalog.categories.forEach((category: Category) => {
    categoryNames[category.id] = category.name;
    categoryStats[category.id] = {
      seen: 0,
      total: 0,
      completion: 0
    };
  });
  
  // Count total creatures per category
  catalog.creatures.forEach((creature: Creature) => {
    if (categoryStats[creature.category_id]) {
      categoryStats[creature.category_id].total += 1;
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
  
  return {
    totalPoints,
    uniqueCreatures,
    overallCompletion,
    categoryStats,
    categoryNames
  };
};