import { useEffect, useState, useRef, useCallback } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { authService } from '@/services/authService';
import { syncService } from '@/services/syncService';
import { ensureCacheDirectories } from '@/services/cache';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { STACK_CONFIG, ROUTES } from '@/constants';
import { debugLogger } from '@/utils/debugLogger';

export default function RootLayout() {
  useFrameworkReady();
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const initialize = useCallback(async () => {
    try {
      debugLogger.logAuthEvent('Starting app initialization');
      
      // Initialize cache directories
      debugLogger.logAuthEvent('Initializing cache directories');
      await ensureCacheDirectories();
      
      // Initialize auth service
      debugLogger.logAuthEvent('Initializing auth service');
      await authService.initialize();
      
      // Initialize sync service regardless of auth state
      debugLogger.logSyncEvent('Initializing sync service');
      await syncService.checkConnectivity();
      
      // Initial data sync if online
      if (syncService.getIsOnline()) {
        debugLogger.logSyncEvent('Device is online, performing initial sync');
        await syncService.fullSync();
      } else {
        debugLogger.logSyncEvent('Device is offline, skipping initial sync');
      }
      
      // Always update state to ready, regardless of component mount status
      if (isMountedRef.current) {
        debugLogger.logAuthEvent('App initialization completed, setting ready state');
        setIsReady(true);
      }

      // Only navigate if we're still mounted and haven't already navigated
      if (isMountedRef.current) {
        // Navigation logic will be handled by the tab layout components
        // The router.replace calls were causing infinite re-renders
        debugLogger.logAuthEvent('App initialized and ready');
        console.log('App initialized');
      }
    } catch (error) {
      debugLogger.logError('App initialization error', error);
      console.error('Initialization error:', error);
      if (isMountedRef.current) {
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred during initialization');
        // Still allow app to start but show error
        setIsReady(true);
      }
    }
  }, []);

  useEffect(() => {
    debugLogger.logAuthEvent('RootLayout mounted, setting up auth listener and initializing app');
    isMountedRef.current = true;
    
    // Set up auth listener
    unsubscribeRef.current = authService.setupAuthListener();
    
    // Initialize app
    initialize();
    
    return () => {
      debugLogger.logAuthEvent('RootLayout unmounting, cleaning up auth listener');
      isMountedRef.current = false;
      // Clean up auth listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [initialize]); // Add initialize to dependency array

  const handleRetry = useCallback(async () => {
    debugLogger.logAuthEvent('Retry initialization requested');
    setHasError(false);
    setErrorMessage('');
    await initialize();
  }, [initialize]);

  // Show loading screen while initializing
  if (!isReady) {
    debugLogger.logAuthEvent('Rendering loading screen');
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
    debugLogger.logAuthEvent('Rendering error screen', { errorMessage });
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

  debugLogger.logAuthEvent('Rendering main app layout');
  console.log('RootLayout rendering. isReady:', isReady, 'hasError:', hasError);
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