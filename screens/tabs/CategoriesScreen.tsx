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
import { router, useFocusEffect } from 'expo-router';
import { useDataStore } from '@/stores/data';
import { calculateUserStats } from '@/stores/data';
import ImageWithFallback from '@/components/ImageWithFallback';
import { LinearGradient } from 'expo-linear-gradient';
import { Category } from '@/types/database';

interface CategoryWithStats extends Category {
  seen: number;
  total: number;
  completion: number;
}

export default function CategoriesScreen() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  
  // Use the new data store instead of dataService
  const { fetchCatalog } = useDataStore();

  const loadData = async () => {
    try {
      // Fetch catalog directly from the new store
      const catalog = await fetchCatalog();
      setCategories(catalog?.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
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

  const renderCategory = ({ item }: { item: CategoryWithStats }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => router.push(`/categories/${item.id}`)}
    >
      <ImageWithFallback
        uri={item.image_url}
        style={styles.categoryImage}
        containerStyle={styles.imageContainer}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.categoryOverlay}
      >
        <View style={styles.categoryContent}>
          <Text style={styles.categoryName}>{item.name}</Text>
        </View>
      </LinearGradient>
      <View style={styles.completionBadge}>
        <Text style={styles.completionText}>
          {item.seen}/{item.total}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Categories</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryCard: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  categoryContent: {
    padding: 16,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  completionBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});