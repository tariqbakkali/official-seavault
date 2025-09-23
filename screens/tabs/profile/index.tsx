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
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { useCatalogStore } from '@/stores/catalog';
import { calculateUserStats } from '@/stores/user/utils/utils';
import { ROUTES, COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import StatsSection from './components/StatsSection';
import CategoryProgressSection from './components/CategoryProgressSection';

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { signOut, user } = useAuthStore();
  const { fetchUserData } = useUserStore();
  const { fetchCatalog } = useCatalogStore();

  const loadData = async () => {
    try {
      const data = await fetchUserData();
      const catalog = await fetchCatalog();
      
      setUserData(data);
      
      if (data && catalog) {
        const stats = calculateUserStats(data, catalog);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
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

  useEffect(() => {
    loadData();
  }, []);

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
              await signOut();
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
              uri={userData?.profile?.avatar_url}
              style={styles.avatar}
              fallbackColor="#333"
            />
          </View>
          <Text style={styles.name}>
            {userData?.profile?.full_name || 'User'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats Section */}
        <StatsSection 
          uniqueCreatures={userStats?.uniqueCreatures || 0}
          wishlistCount={userData?.wishlists?.length || 0}
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