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
import { Trophy, ArrowLeft } from 'lucide-react-native';
import { useSyncedData } from '@/hooks/useSyncedData';
import { getLeaderboardData } from '@/services/leaderboardService';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { forceSyncAll } from '@/utils/syncUtils';
import LeaderboardEntry from './components/LeaderboardEntry';

interface LeaderboardEntryType {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  creatures_discovered: number;
  total_points: number;
}

// Define the interface that matches what the LeaderboardEntry component expects
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
  const [leaderboardData, setLeaderboardData] = React.useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = React.useState<number | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();
  
  const { allProfiles: allProfiles, allUsersSightings, creatures: allCreatures, profile, fetchUserData, fetchCatalog, achievements: allAchievements, allUsersAchievements } = useSyncedData();
  const userProfile = profile ? Object.values(profile)[0] : undefined;

  // Update the fetchLeaderboard function to return the correct type
  const fetchLeaderboard = async (limit: number = 10) => {
    const allProfilesData = allProfiles || {};
    const allSightingsData = allUsersSightings || {};
    const allCreaturesData = allCreatures || {};
    const allUsersAchievementsData = allUsersAchievements || {};
    const allAchievementsData = allAchievements || {};

    // Use the updated getLeaderboardData function that includes achievements
    const leaderboardResult = getLeaderboardData(
      allProfilesData,
      Object.values(allSightingsData),
      Object.values(allCreaturesData),
      Object.values(allUsersAchievementsData),
      Object.values(allAchievementsData)
    );

    return leaderboardResult.slice(0, limit);
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
      const currentUserId = userProfile?.id;
      
      // Process leaderboard data to match the expected format for LeaderboardEntry component
      if (leaderboardResult && currentUserId) {
        const processedData: LeaderboardUser[] = leaderboardResult.map((entry, index) => ({
          id: entry.user_id,
          name: entry.name || 'Unknown User',
          avatar: entry.avatar,
          creatures: entry.creatures,
          points: entry.points,
          isCurrentUser: entry.user_id === currentUserId,
          rank: index + 1
        }));
        
        setLeaderboardData(processedData);
        
        // Find current user's rank
        const userEntry = processedData.find(entry => entry.id === currentUserId);
        setCurrentUserRank(userEntry ? userEntry.rank : null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await forceSyncAll();
      await loadData();
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [userProfile]);

  const renderLeaderboardEntry = ({ item }: { item: LeaderboardUser }) => (
    <LeaderboardEntry
      entry={item}
      rank={item.rank}
    />
  );

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top, 
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      <ScreenHeader 
        title="Leaderboard" 
        onBackPress={() => router.back()}
        showBackButton={true}
      />

      <FlatList
        data={leaderboardData}
        keyExtractor={(item: LeaderboardUser) => item.id}
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