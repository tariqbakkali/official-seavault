import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Star, Eye, Heart, Trophy } from 'lucide-react-native';
import { useSyncedData } from '@/hooks/useSyncedData';
import { calculateUserStats } from '@/services/statsService';
import { Category } from '@/types/database';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { COLORS } from '@/constants/colors';
import { DIMENSIONS } from '@/constants/dimensions';
import { TYPOGRAPHY } from '@/constants';

interface CategoryStat {
  category: Category;
  points: number;
  creatures: number;
  completion: number;
  totalCreatures: number;
}

export default function PointsScreen() {
  const [userData, setUserData] = React.useState<any | null>(null);
  const [userStats, setUserStats] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  
  const { creatures: allCreatures, categories: allCategories, sightings: allSightings, wishlists: allWishlists, profile: userProfile } = useSyncedData();

  const loadData = React.useCallback(() => {
    try {
      // Extract data from observables
      const creaturesArray = allCreatures ? Object.values(allCreatures) : [];
      const categoriesArray = allCategories ? Object.values(allCategories) : [];
      const sightingsArray = allSightings ? Object.values(allSightings) : [];
      const wishlistsArray = allWishlists ? Object.values(allWishlists) : [];
      // Extract profile data - it's now already unwrapped
      const profileData = userProfile ? Object.values(userProfile)[0] : undefined;
      
      if (creaturesArray.length > 0 && categoriesArray.length > 0) {
        // Create mock userData object to match the expected format
        const userData = {
          sightings: sightingsArray,
          wishlists: wishlistsArray,
          profile: profileData
        };
        
        setUserData(userData);
        
        // Create mock catalog object to match the expected format
        const catalog = {
          creatures: creaturesArray as any[],
          categories: categoriesArray as any[],
          achievements: [] // We don't have achievements in observables
        };
        
        // Calculate user stats using the function from the store
        const stats = calculateUserStats(userData, catalog);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading points data:', error);
    } finally {
      setLoading(false);
    }
  }, [allCreatures, allCategories, allSightings, allWishlists, userProfile]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const renderCategoryStat = ({ item }: { item: CategoryStat }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{item.category.name}</Text>
        <Text style={styles.categoryPoints}>{item.points} pts</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${item.completion}%`,
                backgroundColor: item.completion === 100 ? COLORS.SUCCESS : COLORS.PRIMARY
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {item.creatures}/{item.totalCreatures} ({item.completion}%)
        </Text>
      </View>
      
      <View style={styles.categoryStats}>
        <View style={styles.statItem}>
          <Eye size={16} color={COLORS.TEXT_TERTIARY} />
          <Text style={styles.statValue}>{item.creatures}</Text>
        </View>
        <View style={styles.statItem}>
          <Trophy size={16} color={COLORS.TEXT_TERTIARY} />
          <Text style={styles.statValue}>{item.points}</Text>
        </View>
      </View>
    </View>
  );

  // Prepare category stats data for FlatList
  const categoryStatsData = userStats?.categoryStats 
    ? Object.entries(userStats.categoryStats).map(([categoryId, stat]: [string, any]) => {
        // Get the full category object from the catalog
        const category = userStats.categories?.find((cat: any) => cat.id === categoryId) || {
          id: categoryId,
          name: userStats.categoryNames?.[categoryId] || 'Unknown Category',
          created_at: new Date().toISOString(),
          image_url: null
        };
        
        return {
          category,
          points: stat.points || 0,
          creatures: stat.seen || 0,
          completion: stat.completion || 0,
          totalCreatures: stat.total || 0
        };
      })
    : [];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScreenHeader 
          title="Loading..." 
          onBackPress={() => router.back()}
          showBackButton={true}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader 
        title="Points" 
        onBackPress={() => router.back()}
        showBackButton={true}
      />

      <View style={styles.statsHeader}>
        <View style={styles.pointsContainer}>
          <Star size={32} color={COLORS.SECONDARY} />
          <Text style={styles.totalPoints}>{userStats?.totalPoints || 0}</Text>
          <Text style={styles.pointsLabel}>Total Points</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Eye size={24} color={COLORS.PRIMARY} />
            <Text style={styles.statValue}>{userStats?.uniqueCreatures || 0}</Text>
            <Text style={styles.statLabel}>Unique</Text>
          </View>
          <View style={styles.statBox}>
            <Heart size={24} color={COLORS.ERROR} />
            <Text style={styles.statValue}>{allWishlists ? Object.keys(allWishlists).length : 0}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={categoryStatsData}
        keyExtractor={(item) => item.category.id}
        renderItem={renderCategoryStat}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Star size={48} color={COLORS.TEXT_DISABLED} />
            <Text style={styles.emptyTitle}>No points yet</Text>
            <Text style={styles.emptySubtitle}>
              Start discovering marine life to earn points
            </Text>
          </View>
        }
        ListHeaderComponent={
          categoryStatsData.length > 0 ? (
            <Text style={styles.sectionTitle}>
              Categories ({categoryStatsData.length})
            </Text>
          ) : null
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
  statsHeader: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: DIMENSIONS.SPACE_LG,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_XXL,
    marginTop: DIMENSIONS.SPACE_LG,
  },
  totalPoints: {
    fontSize: TYPOGRAPHY.SIZE_HERO,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginVertical: DIMENSIONS.SPACE_SM,
  },
  pointsLabel: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: COLORS.TEXT_SECONDARY,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_LG,
    padding: DIMENSIONS.SPACE_LG,
    marginHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginVertical: DIMENSIONS.SPACE_XS,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_SECONDARY,
  },
  listContainer: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: DIMENSIONS.SPACE_MD,
    marginTop: DIMENSIONS.SPACE_SM,
  },
  categoryCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  categoryPoints: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: COLORS.SECONDARY,
  },
  progressContainer: {
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.SURFACE_SECONDARY,
    borderRadius: DIMENSIONS.RADIUS_FULL,
    overflow: 'hidden',
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_FULL,
  },
  progressText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_SECONDARY,
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_PRIMARY,
    paddingTop: DIMENSIONS.SPACE_MD,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACE_XS,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: DIMENSIONS.SPACE_XXXL,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginTop: DIMENSIONS.SPACE_LG,
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.LINE_HEIGHT_MD,
    paddingHorizontal: DIMENSIONS.SPACE_LG,
  },
});