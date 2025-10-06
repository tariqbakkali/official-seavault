import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSyncedData } from '@/hooks/useSyncedData';
import { supabase } from '@/services/supabase';
import LeaderboardEntry from '@/screens/modal/leaderboard/components/LeaderboardEntry';
import ScreenHeader from '@/components/ui/ScreenHeader';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string | null;
  creatures: number;
  points: number;
  isCurrentUser: boolean;
  rank: number;
}

interface LeaderboardEntryType {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  creatures_discovered: number;
  total_points: number;
}

export default function LeaderboardModal() {
  const [leaderboardData, setLeaderboardData] = React.useState<LeaderboardUser[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  
  // Use the new useSyncedData hook instead of useDataStore
  const { fetchUserData, fetchCatalog } = useSyncedData();

  // Fetch leaderboard data directly from Supabase
  const fetchLeaderboard = async (limit: number = 10): Promise<LeaderboardEntryType[]> => {
    const allProfiles = profiles.get() || {};
    const allSightings = sightings.get() || {};

    const users = Object.values(allProfiles).filter(p => p.full_name && p.full_name !== '');

    // Calculate stats for each user
    const leaderboardData = users.map((user: any) => {
      // Get all sightings for this user
      const userSightings = Object.values(allSightings).filter((s: any) => s.user_id === user.id);

      // Calculate unique creatures and total points
      const uniqueCreatures = new Set(userSightings.map((s: any) => s.creature_id));
      const totalPoints = userSightings.reduce((sum: number, sighting: any) => {
        // Assuming creature points are available in the creatures observable
        const creature = creatures.get()?.[sighting.creature_id];
        return sum + (creature?.points || 0);
      }, 0);

      return {
        user_id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        creatures_discovered: uniqueCreatures.size,
        total_points: totalPoints
      };
    });

    // Sort by points (descending), then by creatures discovered (descending)
    return leaderboardData.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      return b.creatures_discovered - a.creatures_discovered;
    }).slice(0, limit);
  };

  const loadData = async () => {
    try {
      // Fetch data directly from the new hook
      const [userData, catalog, leaderboardResult] = await Promise.all([
        fetchUserData(),
        fetchCatalog(),
        fetchLeaderboard(50) // Fetch top 50 for full leaderboard
      ]);
      
      // Get current user ID
      const currentUserId = profile.get()?.id;
      
      // Process leaderboard data
      if (leaderboardResult && currentUserId) {
        const processedData = (leaderboardResult as LeaderboardEntryType[]).map((entry, index) => ({
          id: entry.user_id,
          name: entry.full_name || 'Unknown User',
          avatar: entry.avatar_url,
          creatures: Number(entry.creatures_discovered),
          points: Number(entry.total_points),
          isCurrentUser: entry.user_id === currentUserId,
          rank: index + 1
        }));
        
        setLeaderboardData(processedData);
      }
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    }
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const renderLeaderboardEntry = ({ item }: { item: LeaderboardUser }) => (
    <LeaderboardEntry
      entry={item}
      rank={item.rank}
    />
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScreenHeader 
          title="Leaderboard" 
          onBackPress={() => router.back()}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader 
        title="Leaderboard" 
        onBackPress={() => router.back()}
        showBackButton={true}
      />

      <FlatList
        data={leaderboardData}
        keyExtractor={(item) => item.id}
        renderItem={renderLeaderboardEntry}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    // Reduce the top padding since we have safe area insets and ScreenHeader padding
    paddingTop: 5,
    paddingBottom: 20,
  },
});