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
import { ROUTES, APP_CONFIG } from '@/constants';
import { getLeaderboardData } from '@/services/leaderboardService';
import { forceSyncAll } from '@/utils/syncUtils';
import { Creature, Category, Sighting, Wishlist } from '@/types/database';
import StatCard from './components/StatCard';
import { allUsersProfiles$ } from '@/stores/syncedObservables';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar: string | null;
  creatures: number;
  points: number;
  isCurrentUser?: boolean;
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

  console.log('allProfiles: ', allUsersProfiles$.get());
  console.log("useSyncedData allProfiles: ", allProfiles)

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
          userAchievementsArray
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
      setLeaderboard(generatedLeaderboard);
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

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
            <Text style={styles.subtitle}>{APP_CONFIG.TAGLINE}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
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
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.usernameText}>
            {userProfile && Object.values(userProfile).length > 0
              ? Object.values(userProfile)[0]?.full_name || 'Diver'
              : 'Diver'}
          </Text>
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
                    {index + 1}
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
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  logDiveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  logDiveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCardWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: 0,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
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
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAllButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboardEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    borderRadius: 12,
  },
  currentUserEntry: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 12,
    paddingLeft: 4,
    paddingRight: 4,
    marginHorizontal: -4,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  rankTextTop: {
    color: '#FF9500',
    fontSize: 18,
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
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  youText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  leaderboardSubtext: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  pointsText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
