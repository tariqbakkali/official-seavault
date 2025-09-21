import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { syncService } from '@/services/syncService';
import { loadCatalogCache, loadUserDataCache } from '@/services/cache';
import CategoryCard from '@/screens/tabs/categories/components/CategoryCard';

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
        renderItem={({ item }) => (
          <CategoryCard 
            category={item} 
            onPress={() => router.push(`/categories/${item.id}`)} 
          />
        )}
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
});