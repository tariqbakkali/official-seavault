import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Star, Eye, Heart, Trophy, Fish } from 'lucide-react-native';
import { useSyncedData } from '@/hooks/useSyncedData';
import { calculateUserStats } from '@/services/statsService';
import { Category } from '@/types/database';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { COLORS } from '@/constants/colors';
import { DIMENSIONS, TYPOGRAPHY } from '@/constants';

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
  
  // Fixed the property names to match what useSyncedData actually returns
  const { 
    creatures: allCreatures, 
    categories: allCategories, 
    currentUserSightings, // Changed from 'sightings' to 'currentUserSightings'
    wishlists: allWishlists, 
    profile: userProfile,
    userAchievements: allUserAchievements,
    achievements: allAchievements // Added missing achievements
  } = useSyncedData();

  const loadData = React.useCallback(() => {
    try {
      setLoading(true);
      // Extract data from observables
      const creaturesArray = allCreatures ? Object.values(allCreatures).filter(
        (c: any) => c && typeof c === 'object' && c.id && typeof c.id === 'string'
      ) : [];
      const categoriesArray = allCategories ? Object.values(allCategories).filter(
        (c: any) => c && typeof c === 'object' && c.id && typeof c.id === 'string'
      ) : [];
      // Fixed to use currentUserSightings instead of allSightings
      const sightingsArray = currentUserSightings ? Object.values(currentUserSightings).filter(
        (s: any) => s && typeof s === 'object' && s.id && typeof s.id === 'string'
      ) : [];
      const wishlistsArray = allWishlists ? Object.values(allWishlists).filter(
        (w: any) => w && typeof w === 'object' && w.id && typeof w.id === 'string'
      ) : [];
      // Extract profile data - it's now already unwrapped
      const profileData = userProfile ? Object.values(userProfile)[0] : undefined;
      
      // Get user achievements
      const userAchievementsArray = allUserAchievements ? Object.values(allUserAchievements) : [];
      
      // Get all achievements for catalog
      const achievementsArray = allAchievements ? Object.values(allAchievements) : [];
      
      if (creaturesArray.length > 0 && categoriesArray.length > 0) {
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
          achievements: achievementsArray as any[] // Added achievements to catalog
        };
        
        // Calculate user stats using the function from the store
        const stats = calculateUserStats(userData, catalog, userAchievementsArray);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading points data:', error);
    } finally {
      setLoading(false);
    }
  }, [allCreatures, allCategories, currentUserSightings, allWishlists, userProfile, allUserAchievements, allAchievements]);

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
          <Fish size={16} color={COLORS.TEXT_TERTIARY} />
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
  const categoryStatsData: CategoryStat[] = React.useMemo(() => {
    if (!userStats?.categoryStats || !allCategories) {
      return [];
    }
    
    // Get all categories as an array and filter out invalid ones
    const categoriesArray = allCategories ? Object.values(allCategories).filter(
      (category: any): category is Category => 
        category && 
        typeof category === 'object' && 
        category.id && 
        typeof category.id === 'string' &&
        category.name && 
        typeof category.name === 'string' &&
        category.created_at && 
        typeof category.created_at === 'string'
    ) : [];
    
    // Map categories with their stats
    const mappedData: CategoryStat[] = categoriesArray.map((category) => {
      const categoryStat = userStats.categoryStats[category.id] || {
        seen: 0,
        total: 0,
        completion: 0,
        points: 0
      };
      
      // Ensure we have a valid Category object
      const validCategory: Category = {
        id: category.id,
        name: category.name,
        created_at: category.created_at,
        image_url: category.image_url || null
      };
      
      return {
        category: validCategory,
        points: categoryStat.points || 0,
        creatures: categoryStat.seen || 0,
        completion: categoryStat.completion || 0,
        totalCreatures: categoryStat.total || 0
      };
    }).filter((item): item is CategoryStat => {
      if (!item.category) return false;
      if (typeof item.category !== 'object') return false;
      if (!item.category.id) return false;
      if (typeof item.category.id !== 'string') return false;
      return true;
    }); // Type guard to ensure proper typing
    
    // Sort by points descending
    return mappedData.sort((a, b) => b.points - a.points);
  }, [userStats, allCategories]);

  // Calculate achievement points
  const achievementPoints = React.useMemo(() => {
    if (!userStats || !allUserAchievements || !allAchievements) return 0;
    
    // Create a map of achievement IDs to achievement objects for quick lookup
    const achievementMap = new Map<string, any>();
    const achievementsArray = Object.values(allAchievements);
    achievementsArray.forEach((achievement: any) => {
      achievementMap.set(achievement.id, achievement);
    });
    
    // Calculate total points from achievements
    let totalAchievementPoints = 0;
    const userAchievementsArray = Object.values(allUserAchievements);
    userAchievementsArray.forEach((userAchievement: any) => {
      const achievement = achievementMap.get(userAchievement.achievement_id);
      if (achievement && achievement.points) {
        totalAchievementPoints += achievement.points;
      }
    });
    
    return totalAchievementPoints;
  }, [userStats, allUserAchievements, allAchievements]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader 
          title="Loading..." 
          onBackPress={() => router.back()}
          showBackButton={true}
        />
      </SafeAreaView>
    );
  }

  // Header component for FlatList
  const renderHeader = () => (
    <View style={styles.statsHeader}>
      {/* Total Points Section */}
      <View style={styles.pointsSummaryContainer}>
        <View style={styles.pointsSummaryCard}>
          <Star size={36} color={COLORS.SECONDARY} />
          <View style={styles.pointsTextContainer}>
            <Text style={styles.totalPoints}>{userStats?.totalPoints || 0}</Text>
            <Text style={styles.pointsLabel}>Total Points</Text>
          </View>
        </View>
      </View>

      {/* Points Breakdown Section */}
      <View style={styles.pointsBreakdownContainer}>
        <Text style={styles.sectionTitle}>Points Breakdown</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownIconContainer}>
              <Fish size={TYPOGRAPHY.SIZE_XXXL} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.breakdownTextContainer}>
              <Text style={styles.breakdownValue}>{userStats?.uniqueCreatures || 0}</Text>
              <Text style={styles.breakdownLabel}>Species Found</Text>
            </View>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownIconContainer}>
              <Trophy size={TYPOGRAPHY.SIZE_XXXL} color={COLORS.SECONDARY} />
            </View>
            <View style={styles.breakdownTextContainer}>
              <Text style={styles.breakdownValue}>{achievementPoints}</Text>
              <Text style={styles.breakdownLabel}>Achievements</Text>
            </View>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownIconContainer}>
              <Heart size={TYPOGRAPHY.SIZE_XXXL} color={COLORS.ERROR} />
            </View>
            <View style={styles.breakdownTextContainer}>
              <Text style={styles.breakdownValue}>{allWishlists ? Object.keys(allWishlists).length : 0}</Text>
              <Text style={styles.breakdownLabel}>Wishlist</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Category Section Title */}
      {categoryStatsData.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Categories ({categoryStatsData.length})
          </Text>
          <View style={styles.sectionDivider} />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader 
        title="Points" 
        onBackPress={() => router.back()}
        showBackButton={true}
      />
      
      <FlatList
        data={categoryStatsData}
        keyExtractor={(item) => item.category.id}
        renderItem={renderCategoryStat}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Star size={TYPOGRAPHY.SIZE_DISPLAY} color={COLORS.TEXT_DISABLED} />
            <Text style={styles.emptyTitle}>No Points Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start discovering marine life to earn points and track your progress
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)/categories')}
            >
              <Text style={styles.exploreButtonText}>Explore Categories</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
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
  pointsSummaryContainer: {
    alignItems: 'center',
    marginVertical: DIMENSIONS.SPACE_XL,
  },
  pointsSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_LG,
    padding: DIMENSIONS.SPACE_XL,
    width: '100%',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  pointsTextContainer: {
    marginLeft: DIMENSIONS.SPACE_LG,
  },
  totalPoints: {
    fontSize: TYPOGRAPHY.SIZE_DISPLAY,
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  pointsLabel: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: COLORS.TEXT_SECONDARY,
    marginTop: DIMENSIONS.SPACE_XS,
  },
  pointsBreakdownContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_LG,
    padding: DIMENSIONS.SPACE_LG,
    
    marginBottom: DIMENSIONS.SPACE_LG,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionHeader: {
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.BORDER_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: DIMENSIONS.SPACE_SM,
  },
  breakdownIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.SURFACE_SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  breakdownTextContainer: {
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  breakdownLabel: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: DIMENSIONS.SPACE_XS,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 100,
  },
  categoryCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_LG,
    padding: DIMENSIONS.SPACE_LG,
    marginHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    marginBottom: DIMENSIONS.SPACE_MD,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.SECONDARY,
  },
  progressContainer: {
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  progressBarBackground: {
    height: 10,
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
    textAlign: 'center',
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
  statValue: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: DIMENSIONS.SPACE_XS,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: DIMENSIONS.SPACE_XXXL,
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SIZE_XL,
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
    marginBottom: DIMENSIONS.SPACE_XL,
  },
  exploreButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingVertical: DIMENSIONS.SPACE_MD,
    paddingHorizontal: DIMENSIONS.SPACE_LG,
  },
  exploreButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
});