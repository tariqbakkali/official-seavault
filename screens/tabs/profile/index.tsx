import React, { useEffect, useState } from 'react';
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
import { User, Settings, LogOut, Star, Eye, Trophy } from 'lucide-react-native';
import { ImageWithFallback } from '@/components';
import { useSyncedData } from '@/hooks/useSyncedData';
import { calculateUserStats } from '@/services/statsService';
import { ROUTES, COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { supabase } from '@/services/supabase';
import StatsSection from './components/StatsSection';
import CategoryProgressSection from './components/CategoryProgressSection';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { forceSyncAll } from '@/utils/syncUtils';

interface MenuItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  chevron?: boolean;
}

export default function ProfileScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [userData, setUserData] = React.useState<any>(null);
  const [userStats, setUserStats] = React.useState<any>(null);
  const [user, setUser] = React.useState<any>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { creatures: allCreatures, categories: allCategories, sightings: allSightings, wishlists: allWishlists, profile: userProfile } = useSyncedData();

  const loadData = React.useCallback(() => {
    try {
      // Extract data from observables
      const creaturesArray = allCreatures ? Object.values(allCreatures.get()) : [];
      const categoriesArray = allCategories ? Object.values(allCategories.get()) : [];
      const sightingsArray = allSightings ? Object.values(allSightings.get()) : [];
      const wishlistsArray = allWishlists ? Object.values(allWishlists.get()) : [];
      const profileData = userProfile && typeof userProfile === 'object' && 'get' in userProfile 
        ? userProfile.get() 
        : userProfile;
      
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
      
      if (userData && catalog) {
        const stats = calculateUserStats(userData, catalog);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  }, [allCreatures, allCategories, allSightings, allWishlists, userProfile]);

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
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getCurrentUser();
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
  const profileData = userProfile && typeof userProfile === 'object' && 'get' in userProfile 
    ? userProfile.get() 
    : userProfile;

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats Section */}
        <StatsSection 
          uniqueCreatures={userStats?.uniqueCreatures || 0}
          wishlistCount={allWishlists ? Object.keys(allWishlists).length : 0}
          totalPoints={userStats?.totalPoints || 0}
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