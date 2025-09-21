import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, TrendingUp } from 'lucide-react-native';
import { CachedUserData } from '@/types/database';
import { loadUserDataCache, loadCatalogCache } from '@/services/cache';
import { calculateUserStats } from '@/services/statsService';

const { width } = Dimensions.get('window');
const cardWidth = width - 40;

interface PointsEntry {
  id: string;
  date: string;
  points: number;
  description: string;
  type: 'sighting' | 'achievement' | 'bonus';
}

export default function PointsScreen() {
  const [pointsHistory, setPointsHistory] = React.useState<PointsEntry[]>([]);
  const [totalPoints, setTotalPoints] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, catalog] = await Promise.all([
        loadUserDataCache(),
        loadCatalogCache()
      ]);
      
      if (userData && catalog) {
        const stats = await calculateUserStats(userData);
        setTotalPoints(stats.totalPoints);
        
        // Create a map of creature ID to creature for quick lookup
        const creatureMap = new Map<string, typeof catalog.creatures[0]>();
        catalog.creatures.forEach(creature => {
          creatureMap.set(creature.id, creature);
        });
        
        // Create points history from sightings
        const history: PointsEntry[] = userData.sightings.map(sighting => {
          const creature = creatureMap.get(sighting.creature_id);
          return {
            id: sighting.id,
            date: sighting.date,
            points: creature?.points || 0,
            description: creature ? `Discovered ${creature.name}` : 'Creature sighting',
            type: 'sighting'
          };
        });
        
        // Sort by date (most recent first)
        history.sort((a, b) => b.date.localeCompare(a.date));
        setPointsHistory(history);
      }
    } catch (error) {
      console.error('Error loading points data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sighting':
        return '🔍';
      case 'achievement':
        return '🏆';
      case 'bonus':
        return '⭐';
      default:
        return '🔹';
    }
  };

  const renderPointsEntry = ({ item }: { item: PointsEntry }) => (
    <View style={styles.pointsCard}>
      <View style={styles.pointsIcon}>
        <Text style={styles.iconText}>{getTypeIcon(item.type)}</Text>
      </View>
      <View style={styles.pointsInfo}>
        <Text style={styles.pointsDescription}>{item.description}</Text>
        <Text style={styles.pointsDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.pointsValueContainer}>
        <Text style={styles.pointsValue}>+{item.points}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Points History</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsHeader}>
        <View style={styles.totalPointsContainer}>
          <Text style={styles.totalPointsLabel}>Total Points</Text>
          <Text style={styles.totalPointsValue}>{totalPoints.toLocaleString()}</Text>
        </View>
        <View style={styles.trendingIcon}>
          <TrendingUp size={24} color="#007AFF" />
        </View>
      </View>

      {pointsHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <TrendingUp size={48} color="#666" />
          <Text style={styles.emptyTitle}>No points yet</Text>
          <Text style={styles.emptySubtitle}>
            Start logging dives to earn points for your discoveries
          </Text>
        </View>
      ) : (
        <FlatList
          data={pointsHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderPointsEntry}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
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
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  totalPointsContainer: {
    flex: 1,
  },
  totalPointsLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  totalPointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  trendingIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  pointsCard: {
    width: cardWidth,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  pointsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsDescription: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  pointsDate: {
    fontSize: 12,
    color: '#666',
  },
  pointsValueContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});