import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { syncService } from '@/services/syncService';
import { CachedUserData } from '@/types/database';
import { loadUserDataCache } from '@/services/cache';
import { achievementService } from '@/services/achievementService';
import ImageWithFallback from '@/components/ImageWithFallback';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<CachedUserData | null>(null);
  const [loading, setLoading] = useState(true);

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
            router.replace('/(auth)/login');
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  const profile = userData?.profile;
  const stats = userData?.stats;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <ImageWithFallback
              uri={profile?.avatar_url}
              style={styles.avatar}
              fallbackColor="#333"
            />
          </View>
          <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.uniqueCreatures || 0}</Text>
            <Text style={styles.statLabel}>Species Found</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(stats?.overallCompletion || 0)}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Progress</Text>
          {Object.entries(stats?.categoryStats || {}).map(([categoryId, stat]) => (
            <View key={categoryId} style={styles.categoryProgress}>
              <View style={styles.categoryProgressHeader}>
                <Text style={styles.categoryName}>{stats?.categoryNames?.[categoryId] || 'Category'}</Text>
                <Text style={styles.categoryCompletion}>{stat.seen}/{stat.total}</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${stat.completion}%` }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleDownloadCatalog}>
            <Text style={styles.settingText}>Download Latest Catalog</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleForceSync}>
            <Text style={styles.settingText}>Force Sync</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
   editProfileButton: {
     backgroundColor: '#007AFF',
     paddingHorizontal: 20,
     paddingVertical: 10,
     borderRadius: 20,
     marginTop: 16,
   },
   editProfileText: {
     color: '#fff',
     fontSize: 14,
     fontWeight: '600',
   },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  categoryProgress: {
    marginBottom: 16,
  },
  categoryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#fff',
  },
  categoryCompletion: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  settingItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  signOutText: {
    color: '#FF3B30',
  },
});