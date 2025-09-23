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
import { useCallback } from 'react';
import { useDataStore } from '@/stores/data'; // Use the new data store
import { calculateUserStats } from '@/stores/data';
import { ImageWithFallback } from '@/components';
import { ROUTES, COLORS, DIMENSIONS, TYPOGRAPHY, APP_CONFIG } from '@/constants';

interface StatCard {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  onPress?: () => void;
}

interface LeaderboardEntry {
  name: string;
  avatar: string;
  creatures: number;
  points: number;
  isCurrentUser?: boolean;
}

export default function HomeScreen() {
  const [userData, setUserData] = React.useState<any | null>(null);
  const [userStats, setUserStats] = React.useState<any | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  
  // Use the new data store instead of dataService
  const { fetchUserData, fetchCatalog } = useDataStore();

  const loadData = async () => {
    try {
      // Fetch user data and catalog directly from Supabase using the new store
      const data = await fetchUserData();
      const catalog = await fetchCatalog();
      
      setUserData(data);
      
      if (data && catalog) {
        // Calculate user stats
        const stats = calculateUserStats(data, catalog);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error during refresh:', error);
    }
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

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
      value: userData?.wishlists.length || 0,
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

  // Mock leaderboard data - in real app this would come from server
  const leaderboard: LeaderboardEntry[] = [
    { name: 'John Smith', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg', creatures: 7, points: 2650 },
    { name: userData?.profile?.full_name || 'You', avatar: userData?.profile?.avatar_url || '', creatures: userStats?.uniqueCreatures || 0, points: userStats?.totalPoints || 0, isCurrentUser: true },
    { name: 'Batman', avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg', creatures: 2, points: 400 },
  ].sort((a, b) => b.points - a.points);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.subtitle}>{APP_CONFIG.TAGLINE}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
              {stat.icon}
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
              key={index} 
              style={[
                styles.leaderboardEntry,
                entry.isCurrentUser && styles.currentUserEntry
              ]}
            >
              <View style={styles.leaderboardLeft}>
                <View style={styles.rankBadge}>
                  <Trophy size={16} color="#FF9500" />
                </View>
                <View style={styles.avatar}>
                  <ImageWithFallback
                    uri={entry.avatar}
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
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
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
  },
  currentUserEntry: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  leaderboardName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  youText: {
    color: '#007AFF',
    fontWeight: 'normal',
  },
  leaderboardSubtext: {
    fontSize: 14,
    color: '#666',
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsText: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: '600',
  },
});