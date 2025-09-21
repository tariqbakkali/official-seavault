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
import { syncService } from '@/services/syncService';
import { loadUserDataCache } from '@/services/cache';
import { CachedUserData } from '@/types/database';
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

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardUser[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    try {
      await syncService.checkConnectivity();
      const userData = await syncService.pullUserData();
      
      if (userData) {
        // In a real production app, this data would come from a server API endpoint
        // For demonstration purposes, we're using mock data with the current user's actual stats
        const mockLeaderboard: LeaderboardUser[] = [
          {
            id: '1',
            name: 'John Smith',
            avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
            creatures: 7,
            points: 2650,
            isCurrentUser: false,
            rank: 1
          },
          {
            id: userData.profile?.id || 'current',
            name: userData.profile?.full_name || 'You',
            avatar: userData.profile?.avatar_url || '',
            creatures: userData.stats.uniqueCreatures,
            points: userData.stats.totalPoints,
            isCurrentUser: true,
            rank: 2
          },
          {
            id: '3',
            name: 'Batman',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
            creatures: 2,
            points: 400,
            isCurrentUser: false,
            rank: 3
          },
          {
            id: '4',
            name: 'Jane Doe',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
            creatures: 5,
            points: 1800,
            isCurrentUser: false,
            rank: 4
          },
          {
            id: '5',
            name: 'Alex Johnson',
            avatar: 'https://images.pexels.com/photos/1138904/pexels-photo-1138904.jpeg',
            creatures: 3,
            points: 950,
            isCurrentUser: false,
            rank: 5
          },
          {
            id: '6',
            name: 'Sarah Wilson',
            avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg',
            creatures: 8,
            points: 3200,
            isCurrentUser: false,
            rank: 6
          },
          {
            id: '7',
            name: 'Michael Brown',
            avatar: 'https://images.pexels.com/photos/1138904/pexels-photo-1138904.jpeg',
            creatures: 4,
            points: 1200,
            isCurrentUser: false,
            rank: 7
          },
          {
            id: '8',
            name: 'Emma Davis',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
            creatures: 6,
            points: 2100,
            isCurrentUser: false,
            rank: 8
          }
        ].sort((a, b) => b.points - a.points)
          .map((user, index) => ({ ...user, rank: index + 1 }));

        setLeaderboard(mockLeaderboard);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      // Load from cache as fallback
      const cachedData = await loadUserDataCache();
      if (cachedData) {
        const mockLeaderboard: LeaderboardUser[] = [
          {
            id: '1',
            name: 'John Smith',
            avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
            creatures: 7,
            points: 2650,
            isCurrentUser: false,
            rank: 1
          },
          {
            id: cachedData.profile?.id || 'current',
            name: cachedData.profile?.full_name || 'You',
            avatar: cachedData.profile?.avatar_url || '',
            creatures: cachedData.stats.uniqueCreatures,
            points: cachedData.stats.totalPoints,
            isCurrentUser: true,
            rank: 2
          },
          {
            id: '3',
            name: 'Batman',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
            creatures: 2,
            points: 400,
            isCurrentUser: false,
            rank: 3
          },
          {
            id: '4',
            name: 'Jane Doe',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
            creatures: 5,
            points: 1800,
            isCurrentUser: false,
            rank: 4
          },
          {
            id: '5',
            name: 'Alex Johnson',
            avatar: 'https://images.pexels.com/photos/1138904/pexels-photo-1138904.jpeg',
            creatures: 3,
            points: 950,
            isCurrentUser: false,
            rank: 5
          }
        ].sort((a, b) => b.points - a.points)
          .map((user, index) => ({ ...user, rank: index + 1 }));

        setLeaderboard(mockLeaderboard);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.fullSync();
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

      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          Points are earned by discovering new creatures. Each creature has a point value based on rarity.
        </Text>
      </View>

      <View style={styles.statsHeader}>
        <Text style={styles.statsText}>
          {leaderboard.length} explorers competing
        </Text>
      </View>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id}
        renderItem={renderLeaderboardEntry}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.PRIMARY}
            colors={[COLORS.PRIMARY]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_TITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD as any,
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 40,
  },
  infoBanner: {
    backgroundColor: COLORS.SURFACE_SECONDARY,
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingVertical: DIMENSIONS.SPACE_MD,
    marginHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    borderRadius: DIMENSIONS.RADIUS_MD,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  infoText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  statsHeader: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    marginBottom: 16,
  },
  statsText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_TERTIARY,
  },
  listContainer: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: 100,
  },
});