import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { syncService } from '@/services/syncService';
import { CachedUserData, Profile } from '@/types/database';
import { loadUserDataCache } from '@/services/cache';
import { achievementService } from '@/services/achievementService';
import { ROUTES } from '@/constants';
import ProfileHeader from '@/screens/tabs/profile/components/ProfileHeader';
import StatsSection from '@/screens/tabs/profile/components/StatsSection';
import CategoryProgressSection from '@/screens/tabs/profile/components/CategoryProgressSection';
import SettingsSection from '@/screens/tabs/profile/components/SettingsSection';
import { authService } from '@/services/authService';

export default function ProfileScreen() {
  const [userData, setUserData] = React.useState<CachedUserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [syncLoading, setSyncLoading] = React.useState(false);
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    try {
      const data = await syncService.pullUserData();
      setUserData(data);
      
      // Load achievements
      await achievementService.loadUnlockedAchievements();
    } catch (error) {
      console.error('Error loading profile data:', error);
      const cachedData = await loadUserDataCache();
      setUserData(cachedData);
    } finally {
      setLoading(false);
    }
  };

  // Simplified function to check if profile exists
  const checkProfileExists = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        Alert.alert('Error', 'Failed to get user information. Please try signing out and back in.');
        return false;
      }
      
      if (!user) {
        console.log('No user found');
        return false;
      }

      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // If profile doesn't exist, show error (should be created by trigger)
      if (profileError || !profileData) {
        console.log('Profile does not exist for user:', user.id);
        Alert.alert(
          'Profile Error', 
          'Your profile could not be found. This may be due to a system issue. Please try signing out and back in, or contact support if the problem persists.'
        );
        return false;
      }
      
      console.log('Profile exists for user:', user.id);
      return true;
    } catch (error: any) {
      console.error('Error checking profile:', error);
      Alert.alert('Error', `Failed to check profile: ${error.message}. Please try again.`);
      return false;
    }
  };

  React.useEffect(() => {
    // Just check if profile exists, don't try to create it
    checkProfileExists().then((exists) => {
      if (exists) {
        loadData();
      } else {
        setLoading(false);
      }
    });
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await authService.signOut();
            if (result.success) {
              router.replace(ROUTES.AUTH.LOGIN);
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    setSyncLoading(true);
    try {
      await syncService.fullSync();
      await loadData();
      Alert.alert('Success', 'Data synced successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDownloadCatalog = async () => {
    setSyncLoading(true);
    try {
      await syncService.pullCatalog();
      await syncService.pullDiveSites();
      Alert.alert('Success', 'Catalog downloaded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to download catalog');
    } finally {
      setSyncLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  // Add a check for profile data
  if (!userData?.profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No profile data available</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              checkProfileExists().then((exists) => {
                if (exists) {
                  loadData();
                } else {
                  setLoading(false);
                }
              });
            }}
          >
            <Text style={styles.retryButtonText}>Retry Profile Check</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView}>
        <ProfileHeader 
          profile={userData.profile}
          onEditProfile={() => router.push(ROUTES.PROFILE.EDIT)}
        />
        <StatsSection stats={userData?.stats} />
        <CategoryProgressSection stats={userData?.stats} />
        <SettingsSection 
          onDownloadCatalog={handleDownloadCatalog}
          onForceSync={handleForceSync}
          onSignOut={handleSignOut}
          loading={syncLoading}
        />
      </ScrollView>
      {syncLoading && (
        <View style={styles.overlay}>
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Syncing...</Text>
          </View>
        </View>
      )}
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
});