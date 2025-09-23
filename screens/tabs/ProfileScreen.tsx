import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { User, Settings, Star, Eye, Heart, HelpCircle, Mail, Lock, Shield, LogOut } from 'lucide-react-native';
import { useDataStore } from '@/stores/data'; // Updated import
import { calculateUserStats } from '@/stores/data';
import { useAuthStore } from '@/stores/auth'; // Updated import
import ImageWithFallback from '@/components/ImageWithFallback';
import { ROUTES, APP_CONFIG } from '@/constants';

export default function ProfileScreen() {
  const [userData, setUserData] = React.useState<any | null>(null);
  const [userStats, setUserStats] = React.useState<any | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  
  // Use the new auth store instead of authService
  const { signOut: signOutAuth } = useAuthStore();
  // Use the new data store instead of dataService
  const { fetchUserData, fetchCatalog } = useDataStore();

  const loadData = async () => {
    try {
      // Fetch user data and catalog directly from Supabase
      const data = await fetchUserData(); // Updated usage
      const catalog = await fetchCatalog(); // Updated usage
      
      setUserData(data);
      
      if (data && catalog) {
        // Calculate user stats
        const stats = calculateUserStats(data, catalog);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
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

  const handleSignOut = async () => {
    try {
      // Use the new auth store function instead of authService
      await signOutAuth();
      router.replace(ROUTES.AUTH.LOGIN);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    {
      icon: <User size={20} color="#fff" />,
      title: 'Edit Profile',
      onPress: () => router.push(ROUTES.PROFILE.EDIT),
    },
    {
      icon: <Settings size={20} color="#fff" />,
      title: 'App Settings',
      onPress: () => router.push('/(tabs)/profile/settings' as any), // Fix route
    },
    {
      icon: <Star size={20} color="#FF9500" />,
      title: 'Points',
      value: userStats?.totalPoints.toString() || '0',
      onPress: () => router.push(ROUTES.STATS.POINTS),
    },
    {
      icon: <Eye size={20} color="#007AFF" />,
      title: 'Discovered',
      value: userStats?.uniqueCreatures.toString() || '0',
      onPress: () => router.push(ROUTES.STATS.DISCOVERED),
    },
    {
      icon: <Heart size={20} color="#FF3B30" />,
      title: 'Wishlist',
      value: userData?.wishlists.length.toString() || '0',
      onPress: () => router.push(ROUTES.STATS.WISHLIST),
    },
    {
      icon: <HelpCircle size={20} color="#fff" />,
      title: 'Help & Support',
      onPress: () => router.push('/(tabs)/profile/help' as any), // Fix route
    },
    {
      icon: <Mail size={20} color="#fff" />,
      title: 'Contact Us',
      onPress: () => router.push('/(tabs)/profile/contact' as any), // Fix route
    },
    {
      icon: <Lock size={20} color="#fff" />,
      title: 'Privacy Policy',
      onPress: () => router.push('/(tabs)/profile/privacy' as any), // Fix route
    },
    {
      icon: <Shield size={20} color="#fff" />,
      title: 'Terms of Service',
      onPress: () => router.push('/(tabs)/profile/terms' as any), // Fix route
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <ImageWithFallback
              uri={userData?.profile?.avatar_url}
              style={styles.avatar}
              containerStyle={styles.avatarWrapper}
              fallbackColor="#333"
            />
          </View>
          <Text style={styles.profileName}>
            {userData?.profile?.full_name || 'User'}
          </Text>
          <Text style={styles.profileEmail}>
            {userData?.profile?.email || ''}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userStats?.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userStats?.uniqueCreatures || 0}</Text>
              <Text style={styles.statLabel}>Discovered</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userData?.wishlists.length || 0}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                {item.icon}
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              {item.value ? (
                <Text style={styles.menuItemValue}>{item.value}</Text>
              ) : (
                <View style={styles.arrow} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{APP_CONFIG.NAME} v{APP_CONFIG.VERSION}</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#fff',
  },
  menuItemValue: {
    fontSize: 16,
    color: '#666',
  },
  arrow: {
    width: 24,
    height: 24,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: '#666',
    transform: [{ rotate: '45deg' }],
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
  },
});