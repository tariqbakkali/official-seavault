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
import { getFriends } from '@/services/friendsService';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { forceSyncAll } from '@/utils/syncUtils';
import LeaderboardEntry from './components/LeaderboardEntry';
import { TYPOGRAPHY, DIMENSIONS, COLORS } from '@/constants';

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
  const [isLoading, setIsLoading] = React.useState(true);
  const [filterMode, setFilterMode] = React.useState<'global' | 'friends'>('global');
  // Removed local friendsList state as it's better to fetch and use immediately to avoid sync issues

  const insets = useSafeAreaInsets();

  const { allProfiles: allProfiles, allUsersSightings, creatures: allCreatures, profile, fetchUserData, fetchCatalog, achievements: allAchievements, allUsersAchievements } = useSyncedData();
  const userProfile = profile ? Object.values(profile)[0] : undefined;

  // Update the fetchLeaderboard function to accept friendIds
  const fetchLeaderboard = async (limit: number = 50, currentFilterMode: 'global' | 'friends', friendIds?: string[]) => {
    const allProfilesData = allProfiles || {};
    const allSightingsData = allUsersSightings || {};
    const allCreaturesData = allCreatures || {};
    const allUsersAchievementsData = allUsersAchievements || {};
    const allAchievementsData = allAchievements || {};

    const idsToFilter = currentFilterMode === 'friends' && userProfile?.id && friendIds
      ? [userProfile.id, ...friendIds]
      : undefined;

    // Use the updated getLeaderboardData function that includes achievements
    const leaderboardResult = getLeaderboardData(
      allProfilesData,
      Object.values(allSightingsData),
      Object.values(allCreaturesData),
      Object.values(allUsersAchievementsData),
      Object.values(allAchievementsData),
      idsToFilter
    );

    return leaderboardResult.slice(0, limit);
  };

  const fetchAndProcessData = async (currentFilterMode: 'global' | 'friends') => {
    // Fetch user data and catalog first
    await Promise.all([
      fetchUserData(),
      fetchCatalog()
    ]);

    // If user is logged in and mode is friends, fetch friends list locally for this request
    let currentFriends: string[] = [];
    if (userProfile?.id && currentFilterMode === 'friends') {
      currentFriends = await getFriends(userProfile.id);
    }

    // Now fetch leaderboard with current data and explicit friends list
    const leaderboardResult = await fetchLeaderboard(50, currentFilterMode, currentFriends);

    // Get current user ID
    const currentUserId = userProfile?.id;

    // Process leaderboard data to match the expected format for LeaderboardEntry component
    if (leaderboardResult) {
      const processedData: LeaderboardUser[] = leaderboardResult.map((entry, index) => ({
        id: entry.user_id,
        name: entry.name || 'Unknown User',
        avatar: entry.avatar,
        creatures: entry.creatures,
        points: entry.points,
        isCurrentUser: entry.user_id === currentUserId,
        rank: index + 1
      }));

      // Find current user's rank
      const userEntry = processedData.find(entry => entry.id === currentUserId);

      return {
        leaderboard: processedData,
        userRank: userEntry ? userEntry.rank : null
      };
    }
    return { leaderboard: [], userRank: null };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await forceSyncAll();
      const { leaderboard, userRank } = await fetchAndProcessData(filterMode);
      setLeaderboardData(leaderboard);
      setCurrentUserRank(userRank);
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      setIsLoading(true);
      setLeaderboardData([]); // Clear previous data to avoid showing wrong list

      try {
        const { leaderboard, userRank } = await fetchAndProcessData(filterMode);

        if (isActive) {
          setLeaderboardData(leaderboard);
          setCurrentUserRank(userRank);
          setIsLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isActive) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isActive = false;
    };
  }, [userProfile?.id, filterMode]); // Reload when profile ID or filter changes specifically

  const renderLeaderboardEntry = ({ item }: { item: LeaderboardUser }) => (
    <LeaderboardEntry
      entry={item}
      rank={item.rank}
    />
  );

  return (
    <View style={[styles.container, {
      // paddingTop: insets.top, 
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      <ScreenHeader
        title="Leaderboard"
        onBackPress={() => router.back()}
        showBackButton={true}
        showActionButton={true}
        actionText="Friends"
        onActionPress={() => router.push('/modal/friends')}
      />

      <View style={styles.filterContainer}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterMode('global')}
            style={[styles.toggleButton, filterMode === 'global' && styles.activeToggle]}
          >
            <Text style={[styles.toggleText, filterMode === 'global' && styles.activeToggleText]}>Global</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterMode('friends')}
            style={[styles.toggleButton, filterMode === 'friends' && styles.activeToggle]}
          >
            <Text style={[styles.toggleText, filterMode === 'friends' && styles.activeToggleText]}>Friends</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filterMode === 'friends' ? 'Add friends to see them here!' : 'No entries found.'}
              </Text>
            </View>
          }
        />
      )}
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
    fontSize: TYPOGRAPHY.SIZE_LG,
  },
  listContainer: {
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingTop: DIMENSIONS.PADDING_XS,
    paddingBottom: DIMENSIONS.PADDING_LG,
  },
  filterContainer: {
    paddingTop: DIMENSIONS.PADDING_MD,
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.PADDING_SM,
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 2,
    width: 200,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: COLORS.PRIMARY || '#007AFF', // Fallback if COLORS.PRIMARY is missing
  },
  toggleText: {
    color: '#8E8E93',
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: DIMENSIONS.PADDING_XL,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: TYPOGRAPHY.SIZE_MD,
  }
});