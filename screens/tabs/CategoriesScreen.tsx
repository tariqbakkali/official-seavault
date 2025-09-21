import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { syncService } from '@/services/syncService';
import { CachedCatalog, CachedUserData } from '@/types/database';
import { loadCatalogCache, loadUserDataCache, getStorageItem } from '@/services/cache';
import ImageWithFallback from '@/components/ImageWithFallback';

interface CategoryWithStats {
  id: string;
  name: string;
  image_url: string | null;
  seen: number;
  total: number;
  completion: number;
}

const { width } = Dimensions.get('window');
const cardWidth = width - 40;

export default function CategoriesScreen() {
  const [categories, setCategories] = React.useState<CategoryWithStats[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isOffline, setIsOffline] = React.useState(false);
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    try {
      await syncService.checkConnectivity();
      const isOnline = syncService.getIsOnline();
      setIsOffline(!isOnline);

      const [catalog, userData] = await Promise.all([
        syncService.pullCatalog(),
        syncService.pullUserData()
      ]);

      console.log('Categories screen - catalog loaded:', catalog?.categories?.length, 'categories', catalog?.creatures?.length, 'creatures');
      if (catalog && userData) {
        const categoriesWithStats = catalog.categories.map(category => {
          const categoryStats = userData.stats.categoryStats[category.id] || {
            seen: 0,
            total: 0,
            completion: 0
          };

          return {
            ...category,
            ...categoryStats
          };
        });

        console.log('Categories with stats:', categoriesWithStats);
        setCategories(categoriesWithStats);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Load from cache
      const [cachedCatalog, cachedUserData] = await Promise.all([
        loadCatalogCache(),
        loadUserDataCache()
      ]);

      if (cachedCatalog && cachedUserData) {
        const categoriesWithStats = cachedCatalog.categories.map(category => {
          const categoryStats = cachedUserData.stats.categoryStats[category.id] || {
            seen: 0,
            total: 0,
            completion: 0
          };

          return {
            ...category,
            ...categoryStats
          };
        });

        setCategories(categoriesWithStats);
      }
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
          <Text style={styles.categorySubtext}>Available Offline</Text>
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
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>You're offline. All content available.</Text>
          </View>
        )}
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
    textAlign: 'center',
  },
  offlineBanner: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#666',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  categoryCard: {
    width: cardWidth,
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  categoryContent: {
    // Content wrapper for the gradient overlay
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  categorySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  completionBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});