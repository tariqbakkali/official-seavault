import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { useSyncedData } from '@/hooks/useSyncedData';
import {
  ActivityIndicator,
  View,
  Text,
  Platform,
  StatusBar,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { COLORS, DIMENSIONS } from '@/constants';
import * as Sentry from '@sentry/react-native';
import { setCurrentUserID } from '@/stores/syncedObservables';
import { forceSyncAll } from '@/utils/syncUtils';
import {
  initializeApp,
  initializeUserSession,
  cleanupUserSession,
} from '@/utils/appInitializer';
import { subscribeToFriendsRealtime, unsubscribeFriendsRealtime, syncFriends } from '@/services/friendsService';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hasCompletedOnboarding } from '@/utils/onboardingStorage';
import * as Linking from 'expo-linking';

import Mapbox from '@rnmapbox/maps';
import Constants from 'expo-constants';
import { ShopProvider } from '@/contexts/ShopContext';
import { PurchaseProvider, usePurchase } from '@/contexts/PurchaseContext';
import Paywall from '@/components/Paywall';
import { Modal } from 'react-native';

// Initialize Mapbox
Mapbox.setAccessToken(Constants.expoConfig?.extra?.MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

// Initialize Sentry
Sentry.init({
  dsn: 'https://dc149a7492f76fc80c8634923f23401f@o4510096340864000.ingest.us.sentry.io/4510114340864000',
  debug: true,
});

function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useSyncedData();
  const [currentUserID, setCurrentUserIDState] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const insets = useSafeAreaInsets();
  const { isPro, isLoading: isPurchaseLoading, checkPurchaseStatus } = usePurchase();
  const [showPaywallGate, setShowPaywallGate] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Track which userId has already been fully initialized to skip duplicate work
    let initializedUserId: string | null = null;

    const checkInitialSessionAndSync = async () => {
      try {
        // Create a promise for the initialization logic
        const initPromise = (async () => {
          await initializeApp();

          const onboardingCompleted = await hasCompletedOnboarding();
          // Add a timeout to the session check
          const sessionPromise = supabase.auth.getSession();
          // Don't reject, just resolve with null to indicate timeout
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve('timeout'), 5000)
          );

          let sessionData;
          try {
            const result = await Promise.race([sessionPromise, timeoutPromise]) as any;

            if (result === 'timeout') {
              console.warn('Session check timed out - checking local storage manually');
              // Manual fallback for offline logic
              // Find Supabase token in AsyncStorage
              const keys = await AsyncStorage.getAllKeys();
              const sbKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));

              if (sbKey) {
                const json = await AsyncStorage.getItem(sbKey);
                if (json) {
                  const parsed = JSON.parse(json);
                  // Construct a minimal session object
                  if (parsed.user) {
                    sessionData = { session: { user: parsed.user, access_token: parsed.access_token } };
                    console.log('Recovered session from local storage');
                  } else {
                    sessionData = { session: null };
                  }
                } else {
                  sessionData = { session: null };
                }
              } else {
                sessionData = { session: null };
              }
            } else {
              sessionData = result.data;
            }
          } catch (e) {
            console.warn('Session check failed', e);
            sessionData = { session: null };
          }

          const { session } = sessionData;
          const userId = session?.user?.id || null;


          if (userId) {
            await initializeUserSession(userId);
            // Re-check purchase status immediately after session restore to avoid stale "false" state
            await checkPurchaseStatus();
            initializedUserId = userId;
          }

          setCurrentUserID(userId);
          setCurrentUserIDState(userId);

          if (userId) {
            syncFriends(userId);
            subscribeToFriendsRealtime(userId);
          }

          if (!onboardingCompleted && !userId) {
            setShowOnboarding(true);
          }


          // Don't let sync block the UI indefinitely
          try {
            const isOnline = require('@/stores/networkStore').getIsOnline();
            if (isOnline) {
              await forceSyncAll();
            } else {
              console.log('AppLayout: Offline, skipping initial sync');
            }
          } catch (e) {
            console.warn('Initial sync failed', e);
          }
        })();

        // Race against a total initialization timeout (e.g. 7 seconds)
        // If the network is bad, we want to let the user in (viewing cached data)
        // rather than staring at a spinner forever.
        // If offline, don't wait for timeout at all
        const isOnline = require('@/stores/networkStore').getIsOnline();
        if (isOnline) {
          await Promise.race([
            initPromise,
            new Promise((resolve) => setTimeout(resolve, 7000))
          ]);
        } else {
          await initPromise;
        }

      } catch (error) {
        console.error('Error checking initial session or syncing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for network changes to retry init if we started offline
    const unsubscribeNetInfo = require('@/stores/networkStore').isOnline$.onChange((isOnline: boolean) => {
      if (isOnline) {
        console.log('AppLayout: Network became available, re-checking session');
        checkInitialSessionAndSync();
      }
    });

    checkInitialSessionAndSync();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const userId = session?.user?.id || null;

      // Update global store logic (keep this immediate for non-UI logic if needed, or move it down too)
      setCurrentUserID(userId);

      if (userId) {
        // Skip if we already initialized this user in checkInitialSessionAndSync
        if (initializedUserId === userId) {
          console.log('[RootLayout] User already initialized in initial session check, skipping duplicate init');
          setCurrentUserIDState(userId);
          initializedUserId = null; // Reset so future auth changes are handled
          return;
        }

        // Reset onboarding state - user has logged in
        setShowOnboarding(false);
        setIsLoggingIn(true); // Show loading overlay

        // Safety timeout — never show "Verifying Membership" for more than 8 seconds
        const loginTimeout = setTimeout(() => {
          console.warn('[RootLayout] Login verification timed out after 8s, proceeding');
          setIsLoggingIn(false);
        }, 8000);

        // CRITICAL FIX: Wait for session init (and "Paranoid Check") BEFORE updating UI state
        // This prevents the UI from seeing "Authenticated=true" + "isPro=false" (default)
        // and flashing the paywall before the check finishes.
        try {
          await Promise.race([initializeUserSession(userId), new Promise(r => setTimeout(r, 5000))]);
          await Promise.race([forceSyncAll(), new Promise(r => setTimeout(r, 3000))]);
          // The "Proper Way": Manual sync followed by robust realtime
          await Promise.race([syncFriends(userId), new Promise(r => setTimeout(r, 3000))]);
          subscribeToFriendsRealtime(userId);
          // Re-check purchase status after login/sync
          await checkPurchaseStatus();
        } catch (e) {
          console.error('[RootLayout] Error initializing user session:', e);
        } finally {
          clearTimeout(loginTimeout);
          setIsLoggingIn(false); // Hide loading overlay
        }

        // NOW update the UI state to trigger navigation/rendering
        // By this point, checkPurchaseStatus() has run, so isPro should be correct.
        setCurrentUserIDState(userId);
      } else {
        // Reset paywall gate IMMEDIATELY when user logs out to prevent flash
        setShowPaywallGate(false);
        setCurrentUserIDState(null); // Clear state immediately on logout to trigger navigation

        // Delay cleanup to next tick to allow UI to unmount/navigate away
        // preventing the "Authenticated=true, IsPro=false" race condition
        setTimeout(async () => {
          unsubscribeFriendsRealtime();
          await cleanupUserSession();
        }, 100);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = !!currentUserID;

  useEffect(() => {
    // Navigate after loading completes
    if (!isLoading) {
      // Check if we should show onboarding first (for first-time users)
      if (showOnboarding) {
        router.replace('/onboarding' as any);
        return;
      }

      if (isAuthenticated) {
        // Wait for purchase status to load before making decisions
        if (isPurchaseLoading) return;

        // Check purchase status after authentication
        if (!isPro) {
          setShowPaywallGate(true);
        }
        // Navigate to tabs when user is authenticated
        router.replace('/(tabs)' as any);
      } else {
        // Navigate to auth when user is not authenticated
        router.replace('/(auth)' as any);
      }
    }
  }, [isAuthenticated, isLoading, isPro, isPurchaseLoading, showOnboarding]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={{ color: '#fff', marginTop: DIMENSIONS.MARGIN_MD }}>Loading...</Text>
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
      </Stack>
    );
  }

  // Clear AsyncStorage once to remove old data with dive_id field
  // TODO: Comment this out after first run
  // useEffect(() => {
  //   AsyncStorage.clear();
  // }, [])

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/change-password" />
        <Stack.Screen name="stats/discovered" />
        <Stack.Screen name="stats/points" />
        <Stack.Screen name="stats/wishlist" />
        <Stack.Screen name="stats/achievements" />
        <Stack.Screen name="creatures/[id]" />
        <Stack.Screen name="categories/[id]/index" />
        <Stack.Screen name="modal/explore" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="modal/leaderboard"
          options={{
            presentation: 'modal',
            contentStyle: { backgroundColor: '#000', paddingTop: Platform.OS === 'android' ? insets.top : 0 },
          }}
        />
        <Stack.Screen
          name="modal/dive-site-picker"
          options={{
            presentation: 'modal',
            contentStyle: { backgroundColor: '#000', paddingTop: Platform.OS === 'android' ? insets.top : 0 },
          }}
        />
        <Stack.Screen
          name="modal/time-of-day-picker"
          options={{
            presentation: 'modal',
            contentStyle: { backgroundColor: '#000', paddingTop: Platform.OS === 'android' ? insets.top : 0 },
          }}
        />
        <Stack.Screen
          name="modal/instructor-picker"
          options={{
            presentation: 'fullScreenModal',
            contentStyle: { backgroundColor: '#000', paddingTop: Platform.OS === 'android' ? insets.top : 0 },
          }}
        />
        <Stack.Screen name="dive/template/[id]" />
        <Stack.Screen name="modal/paywall" options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
      </Stack>
      {/* Purchase Gate Modal - Blocks app access for non-subscribers */}
      <Modal
        visible={showPaywallGate && isAuthenticated && !isPro}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={async () => {
          // Prevent dismissal - user must subscribe
          const hasPro = await checkPurchaseStatus();
          // Only close if user is now pro
          if (hasPro) {
            setShowPaywallGate(false);
          }
        }}
      >
        <Paywall
          onClose={async () => {
            // Wait for purchase status to update and get fresh status
            const hasPro = await checkPurchaseStatus();
            // Only close if user has subscribed
            if (hasPro) {
              setShowPaywallGate(false);
            }
          }}
        />
      </Modal>

      {/* Login Loading Overlay - Shown while verifying premium status */}
      <Modal
        visible={isLoggingIn}
        transparent={false}
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={{ color: '#fff', marginTop: DIMENSIONS.MARGIN_MD, fontWeight: '600', fontSize: 16 }}>
            Verifying Membership...
          </Text>
        </View>
      </Modal>
    </>
  );
}

function RootLayoutWithProviders() {
  return (
    <PurchaseProvider>
      <ShopProvider>
        <RootLayout />
      </ShopProvider>
    </PurchaseProvider>
  );
}

export default RootLayoutWithProviders;
