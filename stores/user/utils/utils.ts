import { UserStats, UserData } from '../types/types';
import { Database } from '../../../types/database';

// Add calculateUserStats function
export const calculateUserStats = (userData: UserData, catalog: any): UserStats => {
  // Use the provided catalog
  
  if (!catalog) {
    return {
      totalPoints: 0,
      uniqueCreatures: 0,
      overallCompletion: 0,
      categoryStats: {},
      categoryNames: {}
    };
  }

  // Import Creature and Category types
  type Creature = Database['public']['Tables']['creatures']['Row'];
  type Category = Database['public']['Tables']['categories']['Row'];

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
  const categoryStats: Record<string, { seen: number; total: number; completion: number; points: number }> = {};
  const categoryNames: Record<string, string> = {};
  
  // Initialize category stats with zeros
  catalog.categories.forEach((category: Category) => {
    categoryNames[category.id] = category.name;
    categoryStats[category.id] = {
      seen: 0,
      total: 0,
      completion: 0,
      points: 0
    };
  });
  
  // Count total creatures per category
  catalog.creatures.forEach((creature: Creature) => {
    if (categoryStats[creature.category_id]) {
      categoryStats[creature.category_id].total += 1;
    }
  });
  
  // Count seen creatures per category and accumulate points (only once per unique creature)
  seenCreatureIds.forEach((creatureId: string) => {
    const creature = creatureMap.get(creatureId);
    if (creature && categoryStats[creature.category_id]) {
      categoryStats[creature.category_id].seen += 1;
      categoryStats[creature.category_id].points += creature.points || 0;
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