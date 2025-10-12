import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Settings, LogOut } from 'lucide-react-native';
import { ImageWithFallback } from '@/components';
import { useSyncedData } from '@/hooks/useSyncedData';
import { calculateUserStats } from '@/services/statsService';
import { ROUTES} from '@/constants';
import { supabase } from '@/services/supabase';
import StatsSection from './components/StatsSection';
import CategoryProgressSection from './components/CategoryProgressSection';
import AchievementsPreview from './components/AchievementsPreview';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { forceSyncAll } from '@/utils/syncUtils';
import LoadingState from '@/components/LoadingState';

interface MenuItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  chevron?: boolean;
}

export default function ProfileScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [userStats, setUserStats] = React.useState<any>(null);
  const [achievementsWithStatus, setAchievementsWithStatus] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { creatures: allCreatures, categories: allCategories, currentUserSightings: allSightings, wishlists: allWishlists, profile: userProfile, achievements: allAchievements, userAchievements: allUserAchievements } = useSyncedData();

  const loadData = React.useCallback(() => {
    try {
      setLoading(true);
      // Extract data from observables
      const creaturesArray = allCreatures ? Object.values(allCreatures) : [];
      const categoriesArray = allCategories ? Object.values(allCategories) : [];
      const sightingsArray = allSightings ? Object.values(allSightings) : [];
      const wishlistsArray = allWishlists ? Object.values(allWishlists) : [];
      const profileData = userProfile ? Object.values(userProfile)[0] : undefined;

      
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
        achievements: allAchievements ? Object.values(allAchievements) : []
      };
      
      // Get user achievements
      const userAchievementsArray = allUserAchievements ? Object.values(allUserAchievements) : [];
      
      // Only calculate stats when we have the necessary data
      if (creaturesArray.length > 0 && categoriesArray.length > 0) {
        if (userData && catalog) {
          const stats = calculateUserStats(userData, catalog, userAchievementsArray);
          setUserStats(stats);
        }
      }
      
      // Calculate achievements with status
      const unlockedAchievementIds = new Set(userAchievementsArray.map((ua: any) => ua.achievement_id));
      const uniqueCreatures = new Set(sightingsArray.map((s: any) => s.creature_id)).size;
      
      const achievementsWithStatus = (allAchievements ? Object.values(allAchievements) : [])
        .map((achievement: any) => {
          let progress = 0;
          let total = 0;
          
          if (achievement.category === 'collection') {
            progress = uniqueCreatures;
            const match = achievement.description?.match(/Log (\d+) different species/);
            total = match ? parseInt(match[1], 10) : 0;
          }
          
          return {
            ...achievement,
            unlocked: unlockedAchievementIds.has(achievement.id),
            progress,
            total
          };
        })
        .sort((a: any, b: any) => {
          if (a.unlocked && !b.unlocked) return -1;
          if (!a.unlocked && b.unlocked) return 1;
          return (b.points || 0) - (a.points || 0);
        });
        
      setAchievementsWithStatus(achievementsWithStatus);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [allCreatures, allCategories, allSightings, allWishlists, userProfile, allAchievements, allUserAchievements]);

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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace(ROUTES.AUTH.LOGIN);
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };

  // Extract profile data safely
  const profileData = userProfile ? Object.values(userProfile)[0] : undefined;
  
  // Get unlocked achievements
  const userAchievementsArray = allUserAchievements ? Object.values(allUserAchievements) : [];
  const unlockedCount = userAchievementsArray.length;
  const totalCount = allAchievements ? Object.values(allAchievements).length : 0;
  
  const menuItems: MenuItem[] = [
    {
      icon: <Settings size={24} color="#fff" />,
      title: 'Account Settings',
      subtitle: 'Manage your account preferences',
      onPress: () => router.push(ROUTES.PROFILE.EDIT),
      chevron: true,
    },
    {
      icon: <LogOut size={24} color="#FF3B30" />,
      title: 'Sign Out',
      subtitle: 'Sign out of your account',
      onPress: handleSignOut,
    },
  ];

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <View style={[styles.container, { 
        paddingTop: insets.top, 
        paddingLeft: insets.left,
        paddingRight: insets.right
      }]}>
        <ScreenHeader title="Profile" />
        <LoadingState message="Loading profile data..." />
      </View>
    );
  }

    return (
    <View style={[styles.container, { 
      paddingTop: insets.top, 
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      <ScreenHeader title="Profile" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        // Allow maps to handle gestures by not intercepting them
        onStartShouldSetResponderCapture={() => false}
        onMoveShouldSetResponderCapture={() => false}
        onResponderTerminationRequest={() => false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <ImageWithFallback
              uri={profileData?.avatar_url}
              style={styles.avatar}
              fallbackColor="#333"
            />
          </View>
          <Text style={styles.name}>
            {profileData?.full_name || 'User'}
          </Text>
          <Text style={styles.email}>{profileData?.email}</Text>
        </View>

        {/* Stats Section */}
        <StatsSection 
          uniqueCreatures={userStats?.uniqueCreatures || 0}
          totalPoints={userStats?.totalPoints || 0}
          achievementsUnlocked={unlockedCount}
          totalAchievements={totalCount}
        />

        {/* Achievements Preview */}
        <AchievementsPreview
          achievements={achievementsWithStatus}
          unlockedCount={unlockedCount}
          totalCount={totalCount}
        />

        {/* Category Progress Section */}
        <CategoryProgressSection 
          categoryStats={userStats?.categoryStats || {}}
          categoryNames={userStats?.categoryNames || {}}
        />

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                {item.icon}
                <View>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              {item.chevron && (
                <Text style={styles.chevron}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#333',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  menuSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    margin: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#666',
  },
});