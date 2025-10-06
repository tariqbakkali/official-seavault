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
import { useSyncedData } from '@/hooks/useSyncedData';
import { calculateUserStats } from '@/services/statsService';
import ImageWithFallback from '@/components/ImageWithFallback';
import { LinearGradient } from 'expo-linear-gradient';
import { Category } from '@/types/database';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { forceSyncAll } from '@/utils/syncUtils';

interface CategoryWithStats extends Category {
  seen: number;
  total: number;
  completion: number;
}

export default function CategoriesTab() {
  const [categories, setCategories] = React.useState<CategoryWithStats[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isOffline, setIsOffline] = React.useState(false);
  const insets = useSafeAreaInsets();
  
  const { categories: allCategories, creatures: allCreatures, sightings: allSightings, wishlists: allWishlists, profile: userProfile } = useSyncedData();

  const loadData = React.useCallback(() => {
    try {
      // Check if we're offline
      const online = navigator.onLine;
      setIsOffline(!online);
      
      // Extract data from observables properly
      const categoriesArray = allCategories ? Object.values(allCategories) : [];
      const creaturesArray = allCreatures ? Object.values(allCreatures) : [];
      const sightingsArray = allSightings ? Object.values(allSightings) : [];
      const wishlistsArray = allWishlists ? Object.values(allWishlists) : [];
      const profileData = userProfile;
      
      if (categoriesArray.length > 0) {
        // Create mock userData object to match the expected format
        const userData = {
          sightings: sightingsArray,
          wishlists: wishlistsArray,
          profile: profileData
        };
        
        // Create mock catalog object to match the expected format
        const catalog = {
          creatures: creaturesArray as any[],
          categories: categoriesArray as any[],
          achievements: [] // We don't have achievements in observables
        };
        
        let categoriesWithStats: CategoryWithStats[] = categoriesArray.map((category: any) => ({
          ...category,
          seen: 0,
          total: 0,
          completion: 0
        }));
        
        // If we have user data, calculate stats
        if (userData && catalog) {
          const stats = calculateUserStats(userData, catalog);
          
          // Map categories with their stats
          categoriesWithStats = categoriesArray.map((category: any) => {
            const categoryStat = stats.categoryStats[category.id] || {
              seen: 0,
              total: 0,
              completion: 0
            };
            
            return {
              ...category,
              seen: categoryStat.seen,
              total: categoryStat.total,
              completion: categoryStat.completion
            };
          });
        }
        
        setCategories(categoriesWithStats);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Try to load from cache if online fetch fails
      try {
        const categoriesArray = allCategories ? Object.values(allCategories) : [];
        if (categoriesArray.length > 0) {
          const categoriesWithStats: CategoryWithStats[] = categoriesArray.map((category: any) => ({
            ...category,
            seen: 0,
            total: 0,
            completion: 0
          }));
          setCategories(categoriesWithStats);
        }
      } catch (cacheError) {
        console.error('Error loading categories from cache:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, [allCategories, allCreatures, allSightings, allWishlists, userProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await forceSyncAll();
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
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
        <ScreenHeader title="Categories" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader title="Categories" />
      <View style={styles.content}>
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
            tintColor={COLORS.PRIMARY}
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
  content: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingVertical: DIMENSIONS.SPACE_MD,
  },
  offlineBanner: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_MD,
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  offlineText: {
    color: COLORS.TEXT_TERTIARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
  listContainer: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: DIMENSIONS.SPACE_XXL,
  },
  categoryCard: {
    height: 180,
    borderRadius: DIMENSIONS.RADIUS_LG,
    overflow: 'hidden',
    marginBottom: DIMENSIONS.SPACE_LG,
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
    padding: DIMENSIONS.SPACE_LG,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  completionBadge: {
    position: 'absolute',
    top: DIMENSIONS.SPACE_LG,
    right: DIMENSIONS.SPACE_LG,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingHorizontal: DIMENSIONS.SPACE_MD,
    paddingVertical: DIMENSIONS.SPACE_XS,
  },
  completionText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
  },
  header: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingTop: DIMENSIONS.SPACE_LG,
    paddingBottom: DIMENSIONS.SPACE_LG,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_HERO,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
});