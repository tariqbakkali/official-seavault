import { useEffect, useState, useRef } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '@/services/supabase';
import { syncService } from '@/services/syncService';
import { ensureCacheDirectories } from '@/services/cache';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { STACK_CONFIG, ROUTES } from '@/constants';

export default function RootLayout() {
  useFrameworkReady();
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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
        // Explicitly navigate to tabs if authenticated
        if (isMountedRef.current) {
          router.replace(ROUTES.TABS.HOME);
        }
      } else {
        // Explicitly navigate to auth if not authenticated
        if (isMountedRef.current) {
          router.replace(ROUTES.AUTH.LOGIN);
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
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred during initialization');
        // Still allow app to start but show error
        setIsReady(true);
      }
    }
  };

  const handleRetry = async () => {
    setHasError(false);
    setErrorMessage('');
    await initialize();
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

  // Show error screen if initialization failed
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={STACK_CONFIG.DEFAULT_SCREEN_OPTIONS}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="categories/[id]/index" />
        <Stack.Screen name="creatures/[id]" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="stats/discovered" />
        <Stack.Screen name="stats/wishlist" />
        <Stack.Screen name="stats/points" />
        <Stack.Screen 
          name="modal/leaderboard" 
          options={STACK_CONFIG.MODAL_SCREEN_OPTIONS}
        />
        <Stack.Screen 
          name="modal/explore" 
          options={STACK_CONFIG.MODAL_SCREEN_OPTIONS}
        />
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#0B1426',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});