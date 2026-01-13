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
  allAchievements: Achievement[], // Added achievements
  friendIds?: string[] // Optional: Filter by specific user IDs (e.g. friends)
): LeaderboardEntry[] => {
  const userStats: Record<string, { points: number; creatures: Set<string>; profile: Profile | null }> = {};

  // Initialize user stats with profile data
  Object.values(allProfiles).forEach(profile => {
    // If filtering by friends, only include if in friendIds
    if (friendIds && !friendIds.includes(profile.id)) {
      return;
    }
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
    // If filtering by friends, skip if user not in friendIds AND user not already in userStats (which respects the filter above)
    // However, userStats only contains profiles that matched.
    // If a user has no profile but has sightings, we might create an entry below.
    // We should check the filter there too.
    
    if (friendIds && !friendIds.includes(sighting.user_id)) {
      return;
    }

    if (!sighting.creature_id) return;

    const creature = creatureMap.get(sighting.creature_id);
    if (!userStats[sighting.user_id]) {
       userStats[sighting.user_id] = {
         points: 0,
         creatures: new Set<string>(),
         profile: null
       };
    }

    if (creature) {
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
    if (friendIds && !friendIds.includes(userAchievement.user_id)) {
      return;
    }

    const achievement = achievementMap.get(userAchievement.achievement_id);
    
    if (!userStats[userAchievement.user_id]) {
       userStats[userAchievement.user_id] = {
         points: 0,
         creatures: new Set<string>(),
         profile: null
       };
    }

    if (achievement) {
      userStats[userAchievement.user_id].points += achievement.points || 0;
    }
  });

  // Convert to leaderboard entries and sort
  const leaderboard: LeaderboardEntry[] = Object.entries(userStats)
    .map(([userId, stats]) => ({
      user_id: userId,
      name: stats.profile?.full_name || 'Anonymous Explorer',
      avatar: stats.profile?.avatar_url || null,
      creatures: stats.creatures.size,
      points: stats.points,
      created_at: stats.profile?.created_at || new Date().toISOString(),
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