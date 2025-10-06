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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, Heart, Trophy } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSyncedData } from '@/hooks/useSyncedData';
import { calculateUserStats } from '@/services/statsService';
import { ImageWithFallback } from '@/components';
import { ROUTES, COLORS, DIMENSIONS, TYPOGRAPHY, APP_CONFIG } from '@/constants';
import { getLeaderboardData } from '@/services/leaderboardService';
import { forceSyncAll } from '@/utils/syncUtils';
import { Profile, Creature, Category, Sighting, Wishlist } from '@/types/database';
// ScreenHeader import removed

interface StatCard {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  onPress?: () => void;
}

interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar: string | null;
  creatures: number;
  points: number;
  isCurrentUser?: boolean;
}

interface LeaderboardEntryType {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  creatures_discovered: number;
  total_points: number;
}

export default function HomeScreen() {
  const [userData, setUserData] = React.useState<any | null>(null);
  const [userStats, setUserStats] = React.useState<any | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  
  // Use the new specialized stores
  const { creatures: allCreatures, categories: allCategories, sightings: allSightings, wishlists: allWishlists, profile: userProfile, allProfiles, achievements: allAchievements } = useSyncedData();

  const loadData = () => {
    try {
      // Extract data from observables with proper typing
      const creaturesObj = allCreatures || {};
      const categoriesObj = allCategories || {};
      const sightingsObj = allSightings || {};
      const wishlistsObj = allWishlists || {};
       
      const creaturesArray = Object.values(creaturesObj) as Creature[];
      const categoriesArray = Object.values(categoriesObj) as Category[];
      const sightingsArray = Object.values(sightingsObj) as Sighting[];
      const wishlistsArray = Object.values(wishlistsObj) as Wishlist[];
    
      const profileData = userProfile;
      const allProfilesData = allProfiles || {};

      
      // Create mock userData object to match the expected format
      const userData = {
        sightings: sightingsArray,
        wishlists: wishlistsArray,
        profile: profileData
      };
      
      setUserData(userData);
      
      // Create mock catalog object to match the expected format
      const catalog = {
        creatures: creaturesArray,
        categories: categoriesArray,
        achievements: allAchievements ? Object.values(allAchievements) : [],
      };
      
      // Calculate user stats
      if (userData && catalog) {
        const stats = calculateUserStats(userData, catalog);
        setUserStats(stats);
      }
      
      // Populate leaderboard data
      const generatedLeaderboard = getLeaderboardData(allProfilesData, sightingsArray, creaturesArray);
      setLeaderboard(generatedLeaderboard);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  }

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

  React.useEffect(()=> {loadData()},[]);


  const stats: StatCard[] = [
    {
      icon: <Eye size={24} color="#007AFF" />,
      value: userStats?.uniqueCreatures || 0,
      label: 'Discovered',
      color: '#007AFF',
      onPress: () => router.push(ROUTES.STATS.DISCOVERED),
    },
    {
      icon: <Heart size={24} color="#FF3B30" />,
      value: allWishlists ? Object.keys(allWishlists).length : 0,
      label: 'Wishlist',
      color: '#FF3B30',
      onPress: () => router.push(ROUTES.STATS.WISHLIST),
    },
    {
      icon: <Trophy size={24} color="#FF9500" />,
      value: userStats?.totalPoints || 0,
      label: 'Points',
      color: '#FF9500',
      onPress: () => router.push(ROUTES.STATS.POINTS),
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* ScreenHeader removed */}
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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* ScreenHeader removed */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
                <Text style={styles.subtitle}>{APP_CONFIG.TAGLINE}</Text>
              </View>
              <TouchableOpacity 
                style={styles.logDiveButton}
                onPress={() => router.push(ROUTES.TABS.LOG_DIVE)}
              >
                <Text style={styles.logDiveText}>+ Log a Dive</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <TouchableOpacity key={index} style={styles.statCard} onPress={stat.onPress}>
                <View style={styles.statIcon}>
                  {stat.icon}
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Trophy size={20} color="#FF9500" />
                <Text style={styles.sectionTitle}>Top Explorers</Text>
              </View>
              <TouchableOpacity onPress={() => router.push(ROUTES.MODAL.LEADERBOARD)}>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </View>

            {leaderboard.map((entry, index) => (
              <View 
                key={entry.user_id} 
                style={[
                  styles.leaderboardEntry,
                  entry.isCurrentUser && styles.currentUserEntry,
                  index === leaderboard.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={styles.leaderboardLeft}>
                  <View style={styles.rankContainer}>
                    <Text style={[
                      styles.rankText,
                      index < 3 && styles.rankTextTop
                    ]}>
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
                      {entry.isCurrentUser && <Text style={styles.youText}> (You)</Text>}
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
        </View>
      </ScrollView>
    </View>
  );
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: (WINDOW_WIDTH - 60) / 3,
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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