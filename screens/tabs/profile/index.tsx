import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { hasCompletedOnboarding, resetOnboarding } from '@/utils/onboardingStorage';
import { Settings, LogOut, Crown, RefreshCcw, HelpCircle, Globe } from 'lucide-react-native';

import Purchases from 'react-native-purchases';
import { ImageWithFallback } from '@/components';
import { useSyncedData } from '@/hooks/useSyncedData';
import { calculateUserStats } from '@/services/statsService';
import { ROUTES, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { supabase } from '@/services/supabase';
import StatsSection from './components/StatsSection';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { forceSyncAll, clearUserSync } from '@/utils/syncUtils';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { usePurchase } from '@/contexts/PurchaseContext';

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
  const [signingOut, setSigningOut] = React.useState(false);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPro, isLoading: isPurchaseLoading } = usePurchase();

  const {
    creatures: allCreatures,
    categories: allCategories,
    currentUserSightings: allSightings,
    wishlists: allWishlists,
    profile: userProfile,
    achievements: allAchievements,
    userAchievements: allUserAchievements,
    creatures: allCreaturesData
  } = useSyncedData();

  const loadData = React.useCallback(() => {
    try {
      setLoading(true);

      const creaturesArray = allCreatures ? Object.values(allCreatures) : [];
      const categoriesArray = allCategories ? Object.values(allCategories) : [];
      const sightingsArray = allSightings ? Object.values(allSightings) : [];
      const wishlistsArray = allWishlists ? Object.values(allWishlists) : [];
      const profileData = userProfile ? Object.values(userProfile)[0] : undefined;

      const userData = {
        sightings: sightingsArray,
        wishlists: wishlistsArray,
        profile: profileData
      };

      const catalog = {
        creatures: creaturesArray,
        categories: categoriesArray,
        achievements: allAchievements ? Object.values(allAchievements) : []
      };

      const userAchievementsArray = allUserAchievements ? Object.values(allUserAchievements) : [];

      if (creaturesArray.length > 0 && categoriesArray.length > 0) {
        const stats = calculateUserStats(
          userData,
          catalog,
          userAchievementsArray,
          allCreaturesData ? Object.values(allCreaturesData) : []
        );
        setUserStats(stats);
      }

      const unlockedIds = new Set(userAchievementsArray.map((i: any) => i.achievement_id));
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
            unlocked: unlockedIds.has(achievement.id),
            progress,
            total
          };
        });

      setAchievementsWithStatus(achievementsWithStatus);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [
    allCreatures,
    allCategories,
    allSightings,
    allWishlists,
    userProfile,
    allAchievements,
    allUserAchievements
  ]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

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

  // RESYNC ACCOUNT
  const handleResync = async () => {
    setLoading(true);
    try {
      // Don't clear first - just fetch fresh data
      console.log('[ProfileScreen] Starting resync...');
      await forceSyncAll();
      
      // Wait a moment for observables to propagate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Reload data to refresh UI
      console.log('[ProfileScreen] Reloading data after sync...');
      await loadData();
      
      Alert.alert('Success', 'Account synchronized successfully.');
    } catch (error) {
      console.error('Error syncing:', error);
      Alert.alert('Error', 'Failed to synchronize account.');
    } finally {
      setLoading(false);
    }
  };

  // REPLAY ONBOARDING
  const handleReplayOnboarding = async () => {
    Alert.alert(
      'Replay Onboarding',
      'This will show the welcome screens again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show Onboarding',
          onPress: async () => {
            try {
              await resetOnboarding();
              router.replace('/onboarding');
            } catch (error) {
              console.error('Error resetting onboarding:', error);
            }
          }
        }
      ]
    );
  };


  // ⛔ SIGNOUT WITH LOADING & SYNC CHECK
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
            handleSafeLogout();
          },
        },
      ]
    );
  };

  const handleSafeLogout = async (force: boolean = false) => {
    try {
      setSigningOut(true);
      
      if (!force) {
        // Attempt to sync before logging out
        try {
          console.log('[ProfileScreen] Attempting sync before logout...');
          await forceSyncAll();
          // Small delay to ensure any pushed changes are acknowledged
          await new Promise(resolve => setTimeout(resolve, 500)); 
          console.log('[ProfileScreen] Sync successful, proceeding to logout');
        } catch (syncError) {
          console.error('[ProfileScreen] Sync failed during logout:', syncError);
          setSigningOut(false);
          
          Alert.alert(
            'Sync Warning',
            'We couldn\'t sync your latest data to the cloud. Logging out now may result in losing recent changes (like sightings or achievements).\n\nPlease check your internet connection.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Logout Anyway', 
                style: 'destructive', 
                onPress: () => handleSafeLogout(true) 
              },
              { 
                text: 'Try Again', 
                onPress: () => handleSafeLogout(false) 
              }
            ]
          );
          return;
        }
      }

      // Clear local data
      clearUserSync();

      // Sign out - this will trigger onAuthStateChange which handles navigation
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      setSigningOut(false);
    }
  };

  // Open Explore website
  const handleExplore = async () => {
    try {
      const url = 'https://explore.seavault.co.uk';
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open the website');
      }
    } catch (error) {
      console.error('Error opening explore website:', error);
      Alert.alert('Error', 'Failed to open the website');
    }
  };

  const handleManageSubscription = async () => {
    try {
      await Purchases.showManageSubscriptions();
    } catch (error) {
      console.error('Error opening subscription management:', error);
      Alert.alert('Error', 'Unable to open subscription management. Please try again.');
    }
  };

  const profileData = userProfile ? Object.values(userProfile)[0] : undefined;
  const totalCount = allAchievements ? Object.values(allAchievements).length : 0;

  // Conditionally build menu items
  const menuItems: MenuItem[] = [
    // ... existing items
    {
      icon: <Settings size={24} color="#fff" />,
      title: 'Account Settings',
      subtitle: 'Manage your account preferences',
      onPress: () => router.push(ROUTES.PROFILE.EDIT),
      chevron: true,
    },
    // NEW: Resync
    {
      icon: <RefreshCcw size={24} color="#fff" />,
      title: 'Resync Account',
      subtitle: 'Fix display issues or missing data',
      onPress: handleResync,
    },
    // // NEW: Replay Onboarding
    // {
    //   icon: <HelpCircle size={24} color="#fff" />,
    //   title: 'Replay Onboarding',
    //   subtitle: 'View the welcome tutorial again',
    //   onPress: handleReplayOnboarding,
    //   chevron: true,
    // },
    // NEW: Explore
    {
      icon: <Globe size={24} color="#fff" />,
      title: 'Explore',
      subtitle: 'Discover new creatures and locations',
      onPress: handleExplore,
      chevron: true,
    },
    {
      icon: <LogOut size={24} color="#FF3B30" />,
      title: 'Sign Out',
      subtitle: 'Sign out of your account',
      onPress: handleSignOut,
    },
  ];

  // SCREEN LOADING (initial data load)
  if (loading) {
    return (
      <View style={[styles.container, {
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }]}>
        <ScreenHeader title="Profile" />
        <LoadingScreen message="Loading profile data..." />
      </View>
    );
  }

  // LOGOUT LOADING SCREEN
  if (signingOut) {
    return (
      <View style={[styles.container, {
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }]}>

        <LoadingScreen message="Signing out..." />
      </View>
    );
  }

  // MAIN SCREEN
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
      >
        {/* HEADER */}
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

        {/* STATS */}
        <StatsSection
          uniqueCreatures={userStats?.uniqueCreatures || 0}
          totalPoints={userStats?.totalPoints || 0}
          achievementsUnlocked={userStats?.achievementsUnlocked || 0}
          totalAchievements={totalCount}
        />

        {/* MENU */}
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
  container: { flex: 1, backgroundColor: '#000' },
  scrollView: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.PADDING_XL,
    paddingHorizontal: DIMENSIONS.PADDING_LG,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: DIMENSIONS.MARGIN_LG,
    borderWidth: 3,
    borderColor: '#333',
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  name: {
    fontSize: TYPOGRAPHY.SIZE_XXXL,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: DIMENSIONS.MARGIN_XS,
  },
  email: { fontSize: TYPOGRAPHY.SIZE_LG, color: '#666' },
  menuSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    margin: DIMENSIONS.MARGIN_LG,
    overflow: 'hidden',
    marginBottom: DIMENSIONS.MARGIN_XL,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DIMENSIONS.PADDING_LG,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: DIMENSIONS.GAP_LG },
  menuItemTitle: { fontSize: TYPOGRAPHY.SIZE_XL, color: '#fff', fontWeight: '600' },
  menuItemSubtitle: { fontSize: TYPOGRAPHY.SIZE_MD, color: '#666' },
  chevron: { fontSize: TYPOGRAPHY.SIZE_XXXL, color: '#666' },
});
