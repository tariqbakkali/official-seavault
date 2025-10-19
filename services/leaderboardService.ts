import { Profile, Sighting, Creature, UserAchievement, Achievement } from '@/types/database';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar: string | null;
  creatures: number;
  points: number;
  created_at: string;
}

// Updated function to accept arrays instead of Records for sightings and creatures
export const getLeaderboardData = (
  allProfiles: Record<string, Profile>, 
  allSightings: Sighting[], // Changed from Record<string, Sighting> to Sighting[]
  allCreatures: Creature[],  // Changed from Record<string, Creature> to Creature[]
  allUserAchievements: UserAchievement[], // Added user achievements
  allAchievements: Achievement[] // Added achievements
): LeaderboardEntry[] => {
  const userStats: Record<string, { points: number; creatures: Set<string>; profile: Profile }> = {};

  // Initialize user stats with profile data
  Object.values(allProfiles).forEach(profile => {
    userStats[profile.id] = {
      points: 0,
      creatures: new Set<string>(),
      profile,
    };
  });

  // Convert creatures array to a map for quick lookup
  const creatureMap = new Map<string, Creature>();
  allCreatures.forEach(creature => {
    creatureMap.set(creature.id, creature);
  });

  // Calculate points and discovered creatures from sightings
  allSightings.forEach(sighting => {
    const creature = creatureMap.get(sighting.creature_id);
    if (creature && userStats[sighting.user_id]) {
      userStats[sighting.user_id].points += creature.points || 0;
      userStats[sighting.user_id].creatures.add(sighting.creature_id);
    }
  });

  // Convert achievements array to a map for quick lookup
  const achievementMap = new Map<string, Achievement>();
  allAchievements.forEach(achievement => {
    achievementMap.set(achievement.id, achievement);
  });

  // Calculate points from achievements
  allUserAchievements.forEach(userAchievement => {
    const achievement = achievementMap.get(userAchievement.achievement_id);
    if (achievement && userStats[userAchievement.user_id]) {
      userStats[userAchievement.user_id].points += achievement.points || 0;
    }
  });

  // Convert to leaderboard entries and sort
  const leaderboard: LeaderboardEntry[] = Object.values(userStats)
    .map(stats => ({
      user_id: stats.profile.id,
      name: stats.profile.full_name || 'Anonymous',
      avatar: stats.profile.avatar_url,
      creatures: stats.creatures.size,
      points: stats.points,
      created_at: stats.profile.created_at,
    }))
    .sort((a, b) => {
      // Sort by points first (descending), then by creatures discovered (descending)
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.creatures - a.creatures;
    });

  return leaderboard;
};