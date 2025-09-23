import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Star, Eye, Heart } from 'lucide-react-native';
import { useDataStore } from '@/stores/data';
import { calculateUserStats } from '@/stores/data';
import { Category } from '@/types/database';

interface CategoryStat {
  category: Category;
  points: number;
  creatures: number;
}

export default function PointsScreen() {
  const [userStats, setUserStats] = React.useState<any | null>(null);
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
      
      if (userData && catalog) {
        // Calculate user stats using the function from the store
        const stats = calculateUserStats(userData, catalog);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading points data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const renderCategoryStat = ({ item }: { item: CategoryStat }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{item.category.name}</Text>
        <Text style={styles.categoryPoints}>{item.points} pts</Text>
      </View>
      <Text style={styles.categoryCreatures}>
        {item.creatures} creature{item.creatures !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
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
        <Text style={styles.title}>Points</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsHeader}>
        <View style={styles.pointsContainer}>
          <Star size={32} color="#FF9500" />
          <Text style={styles.totalPoints}>{totalPoints}</Text>
          <Text style={styles.pointsLabel}>Total Points</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Eye size={24} color="#007AFF" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Unique</Text>
          </View>
          <View style={styles.statBox}>
            <Heart size={24} color="#FF3B30" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={categoryStats}
        keyExtractor={(item) => item.category.id}
        renderItem={renderCategoryStat}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
  statsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  totalPoints: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  pointsLabel: {
    fontSize: 16,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
  },
  statBox: {
    alignItems: 'center',
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  categoryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  categoryPoints: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9500',
  },
  categoryCreatures: {
    fontSize: 14,
    color: '#666',
  },
});