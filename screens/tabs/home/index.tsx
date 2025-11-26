import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Add proper import
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, Heart, Trophy } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSyncedData } from '@/hooks/useSyncedData';
import { calculateUserStats } from '@/services/statsService';
import { ImageWithFallback } from '@/components';
import { ROUTES, APP_CONFIG, DIMENSIONS } from '@/constants';
import { TYPOGRAPHY } from '@/constants';
import { getLeaderboardData } from '@/services/leaderboardService';
import { forceSyncAll } from '@/utils/syncUtils';
import { Creature, Category, Sighting, Wishlist } from '@/types/database';
import StatCard from './components/StatCard';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { allUsersProfiles$ } from '@/stores/syncedObservables';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar: string | null;
  creatures: number;
  points: number;
  isCurrentUser?: boolean;
  actualRank?: number;
}

export default function HomeScreen() {
  const [userStats, setUserStats] = React.useState<any | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();

  // Use the new specialized stores
  const {
    creatures: allCreatures,
    categories: allCategories,
    currentUserSightings,
    allUsersSightings,
    profile: userProfile,
    allProfiles,
    achievements: allAchievements,
    userAchievements: allUserAchievements,
    wishlists: allWishlists,
    allUsersAchievements,
    fetchUserData,
  } = useSyncedData();

  // Log allProfiles data
  // Log useSyncedData allProfiles

  const loadData = React.useCallback(async () => {
    try {
      // Fetching user data
      await fetchUserData();

      // Extract data from observables with proper typing
      const creaturesObj = allCreatures || {};
      const categoriesObj = allCategories || {};
      const sightingsObj = currentUserSightings || {};

      const creaturesArray = Object.values(creaturesObj) as Creature[];
      const categoriesArray = Object.values(categoriesObj) as Category[];
      const sightingsArray = Object.values(sightingsObj) as Sighting[];

      const profileData = userProfile
        ? Object.values(userProfile)[0]
        : undefined;
      const allProfilesData = allProfiles || {};

      // Create mock userData object to match the expected format
      const userData = {
        sightings: sightingsArray,
        wishlists: [], // Keep empty array for compatibility with statsService
        profile: profileData,
      };

      // Create mock catalog object to match the expected format
      const catalog = {
        creatures: creaturesArray,
        categories: categoriesArray,
        achievements: allAchievements ? Object.values(allAchievements) : [],
      };

      // Get user achievements
      const userAchievementsArray = allUserAchievements
        ? Object.values(allUserAchievements)
        : [];

      // Calculate user stats
      if (userData && catalog) {
        const stats = calculateUserStats(
          userData,
          catalog,
          userAchievementsArray,
          allCreatures ? Object.values(allCreatures) : []
        );
        setUserStats(stats);
      }

      // Populate leaderboard data using all users sightings
      const allSightingsArray = allUsersSightings
        ? Object.values(allUsersSightings)
        : [];
      const allUsersAchievementsArray = allUsersAchievements
        ? Object.values(allUsersAchievements)
        : [];
      const achievementsArray = allAchievements
        ? Object.values(allAchievements)
        : [];
      const generatedLeaderboard = getLeaderboardData(
        allProfilesData,
        allSightingsArray as Sighting[],
        creaturesArray,
        allUsersAchievementsArray,
        achievementsArray
      );

      const currentUserId = userProfile
        ? Object.values(userProfile)[0]?.id
        : undefined;

      // Sort the leaderboard by points in descending order, then by created_at in ascending order
      const sortedLeaderboard = [...generatedLeaderboard].sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        // If points are equal, sort by created_at (oldest first)
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      let top5Leaderboard: LeaderboardEntry[] = [];
      let currentUserEntry: LeaderboardEntry | undefined;
      let isCurrentUserInTop5 = false;

      if (currentUserId) {
        currentUserEntry = sortedLeaderboard.find(
          (entry) => entry.user_id === currentUserId
        );
      }

      // Take the top 5 explorers
      top5Leaderboard = sortedLeaderboard.slice(0, 5);

      // Check if current user is in the top 5
      if (currentUserEntry) {
        isCurrentUserInTop5 = top5Leaderboard.some(
          (entry) => entry.user_id === currentUserId
        );
      }

      if (currentUserEntry && !isCurrentUserInTop5) {
        // If current user is not in top 5, replace the last item with the current user
        // This ensures the current user is always visible, but not necessarily at their actual rank if outside top 5
        // To maintain actual rank, we need to insert them at their correct position if they are within the top 5, or just add them if they are outside
        // For now, let's just add them if they are not in the top 5, and ensure the list is still 5 items.
        // A more robust solution would be to find their actual rank and insert them, potentially expanding the list to 6 if they are outside top 5 and we want to show 5 + current user.
        // Given the request to show 'top 5' and 'include current user', we'll prioritize showing 5, with current user replacing the 5th if not in top 5.

        // Find the correct insertion point for the current user based on their points
        let insertionIndex = top5Leaderboard.length;
        for (let i = 0; i < top5Leaderboard.length; i++) {
          if (currentUserEntry.points >= top5Leaderboard[i].points) {
            insertionIndex = i;
            break;
          }
        }

        // Insert the current user at their correct position
        top5Leaderboard.splice(insertionIndex, 0, currentUserEntry);

        // Ensure the list is still 5 items long
        if (top5Leaderboard.length > 5) {
          top5Leaderboard.pop(); // Remove the lowest ranked if list exceeds 5
        }
      }

      // Calculate current user's actual rank from the full sorted leaderboard
      let currentUserActualRank: number | undefined;
      if (currentUserEntry) {
        const actualRankIndex = sortedLeaderboard.findIndex(
          (entry) => entry.user_id === currentUserId
        );
        if (actualRankIndex !== -1) {
          currentUserActualRank = actualRankIndex + 1;
        }
      }

      let finalLeaderboard: LeaderboardEntry[] = [];
      let addedCurrentUser = false;

      // Add top explorers (up to 4) to the final leaderboard, excluding current user for now
      for (
        let i = 0;
        i < sortedLeaderboard.length && finalLeaderboard.length < 4;
        i++
      ) {
        const entry = sortedLeaderboard[i];
        if (entry.user_id !== currentUserId) {
          finalLeaderboard.push(entry);
        }
      }

      if (currentUserEntry) {
        // If current user's actual rank is 5 or greater, place them at the 5th position
        if (currentUserActualRank && currentUserActualRank >= 5) {
          // Ensure there are 4 items before adding current user at 5th spot
          while (
            finalLeaderboard.length < 4 &&
            sortedLeaderboard.length > finalLeaderboard.length
          ) {
            const nextEntry = sortedLeaderboard[finalLeaderboard.length];
            if (nextEntry.user_id !== currentUserId) {
              finalLeaderboard.push(nextEntry);
            }
          }
          // Add current user as the 5th item
          finalLeaderboard.push({
            ...currentUserEntry,
            isCurrentUser: true,
            actualRank: currentUserActualRank,
          });
          addedCurrentUser = true;
        } else {
          // Current user's actual rank is less than 5
          // Insert current user at their actual rank position
          const insertionIndex = (currentUserActualRank || 1) - 1; // actualRank is 1-based
          finalLeaderboard.splice(insertionIndex, 0, {
            ...currentUserEntry,
            isCurrentUser: true,
            actualRank: currentUserActualRank,
          });
          addedCurrentUser = true;
        }
      }

      // Fill remaining slots up to 5, if any, with other explorers
      for (
        let i = 0;
        i < sortedLeaderboard.length && finalLeaderboard.length < 5;
        i++
      ) {
        const entry = sortedLeaderboard[i];
        if (!finalLeaderboard.some((item) => item.user_id === entry.user_id)) {
          finalLeaderboard.push(entry);
        }
      }

      // Ensure the list is exactly 5 items (if there are enough explorers)
      finalLeaderboard = finalLeaderboard.slice(0, 5);

      setLeaderboard(finalLeaderboard);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  }, [
    allCreatures,
    allCategories,
    currentUserSightings,
    allUsersSightings,
    userProfile,
    allProfiles,
    allAchievements,
    allUserAchievements,
    allUsersAchievements,
  ]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await forceSyncAll();
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const stats = [
    {
      type: 'discovered' as const,
      value: userStats?.uniqueCreatures || 0,
      onPress: () => router.push('/stats/discovered'),
    },
    {
      type: 'achievements' as const,
      value: userStats?.achievementsUnlocked || 0,
      onPress: () => router.push('/stats/achievements'),
    },
    {
      type: 'wishlist' as const,
      value: allWishlists ? Object.keys(allWishlists).length : 0,
      onPress: () => router.push('/stats/wishlist'),
    },
  ];



  // ... (existing imports)

  // ... (inside component)

  if (loading) {
    return <LoadingScreen variant="fullscreen" />;
  }

  return (
    <View style={[styles.safeAreaContainer, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        // Add this to test map gestures
        scrollEnabled={true}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        // Allow maps to handle gestures by not intercepting them
        onStartShouldSetResponderCapture={() => false}
        onMoveShouldSetResponderCapture={() => false}
        onResponderTerminationRequest={() => false}
      >
        {/* <MapTest /> Add this to test map functionality */}
        <View style={styles.header}>
          <Text style={styles.usernameText}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.welcomeText}>{APP_CONFIG.TAGLINE}</Text>
        </View>

        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[
                styles.statCardWrapper,
                index === 0 && styles.firstCard,
                index === stats.length - 1 && styles.lastCard,
              ]}
            >
              <StatCard
                type={stat.type as any}
                value={stat.value}
                onPress={stat.onPress}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Trophy size={20} color="#FF9500" />
              <Text style={styles.sectionTitle}>Top Explorers</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push(ROUTES.MODAL.LEADERBOARD)}
            >
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          {leaderboard.map((entry, index) => (
            <View
              key={entry.user_id}
              style={[
                styles.leaderboardEntry,
                entry.isCurrentUser && styles.currentUserEntry,
                index === leaderboard.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.leaderboardLeft}>
                <View style={styles.rankContainer}>
                  <Text
                    style={[styles.rankText, index < 3 && styles.rankTextTop]}
                  >
                    {entry.actualRank !== undefined
                      ? entry.actualRank
                      : index + 1}
                  </Text>
                </View>
                <View style={styles.avatar}>
                  <ImageWithFallback
                    uri={entry.avatar || undefined}
                    style={styles.avatarImage}
                    fallbackColor="#333"
                  />
                </View>
                <View>
                  <Text style={styles.leaderboardName}>
                    {entry.name}
                    {entry.isCurrentUser && (
                      <Text style={styles.youText}> </Text>
                    )}
                  </Text>
                  <Text style={styles.leaderboardSubtext}>
                    {entry.creatures} creatures discovered
                  </Text>
                </View>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{entry.points}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingTop: DIMENSIONS.PADDING_LG,
    paddingBottom: DIMENSIONS.PADDING_XL,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#666',
  },
  usernameText: {
    fontSize: TYPOGRAPHY.SIZE_HERO,
    fontWeight: 'bold',
    color: '#fff',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_HERO,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: DIMENSIONS.MARGIN_SM,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#666',
  },
  logDiveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingVertical: DIMENSIONS.PADDING_MD,
    alignSelf: 'flex-start',
  },
  logDiveText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.PADDING_MD,
    marginBottom: DIMENSIONS.PADDING_LG,
  },
  statCardWrapper: {
    flex: 1,
    marginHorizontal: DIMENSIONS.MARGIN_XS,
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: 0,
  },
  statIcon: {
    marginBottom: DIMENSIONS.MARGIN_SM,
  },
  statValue: {
    fontSize: TYPOGRAPHY.SIZE_XXXL,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: DIMENSIONS.MARGIN_XS,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.SIZE_XS,
    color: '#666',
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: DIMENSIONS.RADIUS_LG,
    marginHorizontal: DIMENSIONS.PADDING_MD,
    marginBottom: DIMENSIONS.PADDING_LG,
    padding: DIMENSIONS.PADDING_SM,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.MARGIN_LG,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.GAP_SM,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAllButton: {
    color: '#007AFF',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
  },
  leaderboardEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.PADDING_MD,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderRadius: 12,
  },
  currentUserEntry: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 12,
    paddingLeft: DIMENSIONS.PADDING_XS,
    paddingRight: DIMENSIONS.PADDING_XS,
    marginHorizontal: -4,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.GAP_MD,
    flex: 1,
  },
  rankContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: 'bold',
    color: '#666',
  },
  rankTextTop: {
    color: '#FF9500',
    fontSize: TYPOGRAPHY.SIZE_XL,
  },
  rankBadge: {
    backgroundColor: 'transparent',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  leaderboardName: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#fff',
    fontWeight: '700',
  },
  youText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  leaderboardSubtext: {
    fontSize: TYPOGRAPHY.SIZE_XS,
    color: '#888',
    marginTop: DIMENSIONS.MARGIN_XS / 2,
  },
  pointsBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 16,
    paddingHorizontal: DIMENSIONS.PADDING_MD,
    paddingVertical: DIMENSIONS.PADDING_SM,
    minWidth: 60,
    alignItems: 'center',
  },
  pointsText: {
    color: '#000',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: 'bold',
  },
});
