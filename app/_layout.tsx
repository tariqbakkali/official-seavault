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

  useEffect(() => {
    const checkInitialSessionAndSync = async () => {
      try {
        await initializeApp();

        const onboardingCompleted = await hasCompletedOnboarding();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        if (userId) {
          await initializeUserSession(userId);
        }

        setCurrentUserID(userId);
        setCurrentUserIDState(userId);

        if (!onboardingCompleted && !userId) {
          setShowOnboarding(true);
        }

        await forceSyncAll();
      } catch (error) {
        console.error('Error checking initial session or syncing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSessionAndSync();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const userId = session?.user?.id || null;

      // Update user ID state first so navigation knows we're authenticated
      setCurrentUserID(userId);
      setCurrentUserIDState(userId);

      if (userId) {
        // Reset onboarding state - user has logged in
        setShowOnboarding(false);
        await initializeUserSession(userId);
        await forceSyncAll();
        // Re-check purchase status after login (RevenueCat is now configured with user ID)
        // This will trigger the navigation effect with the correct isPro value
        await checkPurchaseStatus();
      } else {
        await cleanupUserSession();
        // Reset paywall gate when user logs out
        setShowPaywallGate(false);
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
        <Stack.Screen name="dive-sites/add" />
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
