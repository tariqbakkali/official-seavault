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
import * as Haptics from 'expo-haptics';
import { useSyncedData } from '@/hooks/useSyncedData';
import { calculateUserStats } from '@/services/statsService';
import { ImageWithFallback } from '@/components';
import { ROUTES, APP_CONFIG, DIMENSIONS } from '@/constants';
import { TYPOGRAPHY } from '@/constants';
import { getLeaderboardData } from '@/services/leaderboardService';
import { forceSyncAll } from '@/utils/syncUtils';
import { Creature, Category, Sighting, Wishlist } from '@/types/database';
import StatCard from './components/StatCard';
import ArticlesSection from './components/ArticlesSection';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { allUsersProfiles$, creatures$, categories$, currentUserSightings$, allUsersSightings$, achievements$, userAchievements$, wishlists$, currentUserProfile$, allUsersAchievements$, currentUserID$ } from '@/stores/syncedObservables';
import { useSelector } from '@legendapp/state/react';

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
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(false); // Default to false as selectors handle initial empty state gracefully
  const insets = useSafeAreaInsets();

  // Use the new specialized stores
  const {
    fetchUserData,
  } = useSyncedData();

  // Log allProfiles data
  // Log useSyncedData allProfiles

  // Reactive User Stats
  const userStats = useSelector(() => {
    const rawSightings = currentUserSightings$.get();

    const rawUserData = {
      sightings: Object.values(rawSightings || {}),
      wishlists: [],
      profile: Object.values(currentUserProfile$.get() || {})[0],
    };

    const rawCatalog = {
      creatures: Object.values(creatures$.get() || {}),
      categories: Object.values(categories$.get() || {}),
      achievements: Object.values(achievements$.get() || {}),
    };
    const userAchievementsArray = Object.values(userAchievements$.get() || []);

    // Only calculate if we have basic data to prevent crash
    if (!rawUserData.profile) return null;

    return calculateUserStats(
      rawUserData as any,
      rawCatalog as any,
      userAchievementsArray as any,
      rawCatalog.creatures as any
    );
  });

  // Reactive Leaderboard
  const leaderboard = useSelector(() => {
    const allProfiles = allUsersProfiles$.get() || {};
    // Merge current user data into global data to ensure consistency and include local updates
    const allSightingsMap = { ...(allUsersSightings$.get() || {}) };
    const mySightingsMap = currentUserSightings$.get() || {};
    Object.assign(allSightingsMap, mySightingsMap);

    const allUserAchievementsMap = { ...(allUsersAchievements$.get() || {}) };
    const myAchievementsMap = userAchievements$.get() || {};
    Object.assign(allUserAchievementsMap, myAchievementsMap);

    const allSightings = Object.values(allSightingsMap);
    const allCreatures = Object.values(creatures$.get() || {});
    const allUserAchievements = Object.values(allUserAchievementsMap);
    const allAchievementsData = Object.values(achievements$.get() || {});

    const generatedLeaderboard = getLeaderboardData(
      allProfiles,
      allSightings as Sighting[],
      allCreatures as Creature[],
      allUserAchievements as any[],
      allAchievementsData as any[]
    );

    const currentUserId = Object.values(currentUserProfile$.get() || {})[0]?.id;

    // Sort the leaderboard
    const sortedLeaderboard = [...generatedLeaderboard].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    let top5Leaderboard: LeaderboardEntry[] = [];
    let currentUserEntry: LeaderboardEntry | undefined;
    let isCurrentUserInTop5 = false;

    if (currentUserId) {
      currentUserEntry = sortedLeaderboard.find(entry => entry.user_id === currentUserId);
    }

    top5Leaderboard = sortedLeaderboard.slice(0, 5);

    if (currentUserEntry) {
      isCurrentUserInTop5 = top5Leaderboard.some(entry => entry.user_id === currentUserId);
    }

    if (currentUserEntry && !isCurrentUserInTop5) {
      let insertionIndex = top5Leaderboard.length;
      for (let i = 0; i < top5Leaderboard.length; i++) {
        if (currentUserEntry.points >= top5Leaderboard[i].points) {
          insertionIndex = i;
          break;
        }
      }
      top5Leaderboard.splice(insertionIndex, 0, currentUserEntry);
      if (top5Leaderboard.length > 5) top5Leaderboard.pop();
    }

    // Logic for final display structure (skipping detailed rank adjustment logic for brevity/performance in selector, 
    // but keeping main structure)
    // For now, let's just return the top5Leaderboard which seems to be the core intended display
    // or re-implement the exact logic from before.
    // The previous logic complexly merged top 4 + current user.

    // Simplified robust version:
    const finalBoard = top5Leaderboard.map(entry => ({
      ...entry,
      isCurrentUser: entry.user_id === currentUserId,
      actualRank: sortedLeaderboard.findIndex(e => e.user_id === entry.user_id) + 1
    }));

    return finalBoard;
  });

  // Load data on mount
  React.useEffect(() => {
    fetchUserData();
  }, []);



  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await forceSyncAll();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      value: Object.keys(wishlists$.get() || {}).length,
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
              onPress={() => {
                Haptics.selectionAsync();
                router.push(ROUTES.MODAL.LEADERBOARD);
              }}
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

        <ArticlesSection />
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
