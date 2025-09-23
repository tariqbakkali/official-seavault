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
import { ArrowLeft } from 'lucide-react-native';
import { useDataStore } from '@/stores/data';
import { calculateUserStats } from '@/stores/data';
import LeaderboardEntry from '@/screens/modal/leaderboard/components/LeaderboardEntry';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string | null;
  creatures: number;
  points: number;
  isCurrentUser: boolean;
  rank: number;
}

export default function LeaderboardModal() {
  const [leaderboardData, setLeaderboardData] = React.useState<any[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  
  // Use the new data store instead of dataService
  const { fetchUserData, fetchCatalog } = useDataStore();

  const loadData = async () => {
    try {
      // Fetch data directly from the new store
      const userData = await fetchUserData();
      const catalog = await fetchCatalog();
      
      // Calculate stats using the function from the store
      if (userData && catalog) {
        const stats = calculateUserStats(userData, catalog);
        // Mock leaderboard data - in real app this would come from server
        const mockData = [
          { id: '1', name: 'John Smith', avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg', creatures: 7, points: 2650 },
          { id: '2', name: userData.profile?.full_name || 'You', avatar: userData.profile?.avatar_url || '', creatures: stats.uniqueCreatures, points: stats.totalPoints, isCurrentUser: true },
          { id: '3', name: 'Batman', avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg', creatures: 2, points: 400 },
        ].sort((a, b) => b.points - a.points).map((item, index) => ({
          ...item,
          rank: index + 1
        }));
        
        setLeaderboardData(mockData);
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Leaderboard</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
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
    paddingBottom: 20,
  },
});