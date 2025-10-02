import { Profile, Sighting, Creature } from '@/stores/syncedObservables';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar: string | null;
  creatures: number;
  points: number;
}

// Updated function to accept arrays instead of Records for sightings and creatures
export const getLeaderboardData = (
  allProfiles: Record<string, Profile>, 
  allSightings: Sighting[], // Changed from Record<string, Sighting> to Sighting[]
  allCreatures: Creature[]  // Changed from Record<string, Creature> to Creature[]
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

  // Convert to leaderboard entries and sort
  const leaderboard: LeaderboardEntry[] = Object.values(userStats)
    .map(stats => ({
      user_id: stats.profile.id,
      name: stats.profile.full_name || 'Anonymous',
      avatar: stats.profile.avatar_url,
      creatures: stats.creatures.size,
      points: stats.points,
    }))
    .sort((a, b) => b.points - a.points);

  return leaderboard;
};