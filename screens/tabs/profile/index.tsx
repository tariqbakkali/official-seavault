import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { syncService } from '@/services/syncService';
import { CachedUserData } from '@/types/database';
import { loadUserDataCache } from '@/services/cache';
import { achievementService } from '@/services/achievementService';
import { ROUTES } from '@/constants';
import ProfileHeader from '@/screens/tabs/profile/components/ProfileHeader';
import StatsSection from '@/screens/tabs/profile/components/StatsSection';
import CategoryProgressSection from '@/screens/tabs/profile/components/CategoryProgressSection';
import SettingsSection from '@/screens/tabs/profile/components/SettingsSection';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<CachedUserData | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
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
            await supabase.auth.signOut();
            router.replace(ROUTES.AUTH.LOGIN);
          },
        },
      ]
    );
  };

  const handleForceSync = async () => {
    Alert.alert(
      'Force Sync',
      'This will sync all pending changes and download the latest data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            try {
              await syncService.fullSync();
              await loadData();
              Alert.alert('Success', 'Data synced successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to sync data');
            }
          },
        },
      ]
    );
  };

  const handleDownloadCatalog = async () => {
    Alert.alert(
      'Download Catalog',
      'This will download the latest creature catalog.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              await syncService.pullCatalog();
              await syncService.pullDiveSites();
              Alert.alert('Success', 'Catalog downloaded successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to download catalog');
            }
          },
        },
      ]
    );
  };

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
      <ScrollView style={styles.scrollView}>
        <ProfileHeader 
          profile={userData?.profile}
          onEditProfile={() => router.push(ROUTES.PROFILE.EDIT)}
        />
        <StatsSection stats={userData?.stats} />
        <CategoryProgressSection stats={userData?.stats} />
        <SettingsSection 
          onDownloadCatalog={handleDownloadCatalog}
          onForceSync={handleForceSync}
          onSignOut={handleSignOut}
        />
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});