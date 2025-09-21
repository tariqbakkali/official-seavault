import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, Heart, Trophy } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { syncService } from '@/services/syncService';
import { CachedUserData } from '@/types/database';
import { loadUserDataCache } from '@/services/cache';
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
  const [userData, setUserData] = React.useState<CachedUserData | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    try {
      await syncService.checkConnectivity();
      const data = await syncService.pullUserData();
      setUserData(data);
    } catch (error) {
      console.error('Error loading home data:', error);
      const cachedData = await loadUserDataCache();
      setUserData(cachedData);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Force a full sync on refresh
      await syncService.fullSync();
      await loadData();
    } catch (error) {
      console.error('Error during refresh:', error);
      await loadData(); // Fallback to cached data
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
      value: userData?.stats.uniqueCreatures || 0,
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
      value: userData?.stats.totalPoints || 0,
      label: 'Points',
      color: '#FF9500',
      onPress: () => router.push(ROUTES.STATS.POINTS),
    },
  ];

  // Mock leaderboard data - in real app this would come from server
  const leaderboard: LeaderboardEntry[] = [
    { name: 'John Smith', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg', creatures: 7, points: 2650 },
    { name: userData?.profile?.full_name || 'You', avatar: userData?.profile?.avatar_url || '', creatures: userData?.stats.uniqueCreatures || 0, points: userData?.stats.totalPoints || 0, isCurrentUser: true },
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
            <TouchableOpacity>
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
                <Text style={styles.ptsText}>PTS</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

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
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  logDiveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logDiveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
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
    fontWeight: '600',
  },
  leaderboardEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  currentUserEntry: {
    backgroundColor: '#003366',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  youText: {
    color: '#007AFF',
    fontStyle: 'italic',
  },
  leaderboardSubtext: {
    fontSize: 12,
    color: '#666',
  },
  pointsBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 64,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  ptsText: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
  },
});