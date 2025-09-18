import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { syncService } from '@/services/syncService';
import { CachedUserData } from '@/types/database';
import { loadUserDataCache } from '@/services/cache';
import { ROUTES, APP_CONFIG } from '@/constants';
import StatCard from '@/screens/tabs/home/components/StatCard';
import LeaderboardEntry from '@/screens/tabs/home/components/LeaderboardEntry';

export default function HomeScreen() {
  const [userData, setUserData] = useState<CachedUserData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Mock leaderboard data - in real app this would come from server
  const leaderboard = [
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
          <StatCard
            type="discovered"
            value={userData?.stats.uniqueCreatures || 0}
            onPress={() => router.push(ROUTES.STATS.DISCOVERED)}
          />
          <StatCard
            type="wishlist"
            value={userData?.wishlists.length || 0}
            onPress={() => router.push(ROUTES.STATS.WISHLIST)}
          />
          <StatCard
            type="points"
            value={userData?.stats.totalPoints || 0}
            onPress={() => router.push(ROUTES.STATS.POINTS)}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Top Explorers</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          {leaderboard.map((entry, index) => (
            <LeaderboardEntry
              key={index}
              entry={entry}
              rank={index + 1}
            />
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
});