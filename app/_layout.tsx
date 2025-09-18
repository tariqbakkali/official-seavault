import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '@/services/supabase';
import { syncService } from '@/services/syncService';
import { ensureCacheDirectories } from '@/services/cache';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { STACK_CONFIG } from '@/constants';

export default function RootLayout() {
  useFrameworkReady();
  const [isReady, setIsReady] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    initialize();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const initialize = async () => {
    try {
      // Initialize cache directories
      await ensureCacheDirectories();
      
      // Check auth state
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Initialize sync service
        await syncService.checkConnectivity();
        
        // Initial data sync if online
        if (syncService.getIsOnline()) {
          await syncService.fullSync();
        }
      }
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsReady(true);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsReady(true); // Still allow app to start
      }
    }
  };

  // Show loading screen while initializing
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>SeaVault</Text>
        <Text style={styles.loadingSubtext}>Initializing...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={STACK_CONFIG.DEFAULT_SCREEN_OPTIONS}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="categories/[id]" />
        <Stack.Screen name="creatures/[id]" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="stats/discovered" />
        <Stack.Screen name="stats/wishlist" />
        <Stack.Screen name="stats/points" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B1426',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#64748B',
  },
});