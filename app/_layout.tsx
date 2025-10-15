import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useSyncedData } from '@/hooks/useSyncedData';
import { ActivityIndicator, View, Text } from 'react-native';
import { supabase } from '@/services/supabase';
import * as Sentry from 'sentry-expo';
import { setCurrentUserID } from '@/stores/syncedObservables';
import { forceSyncAll } from '@/utils/syncUtils';
import { initializeApp, initializeUserSession, cleanupUserSession } from '@/utils/appInitializer'; // Import app initializer functions
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Sentry
Sentry.init({
  dsn: "https://dc149a7492f76fc80c8634923f23401f@o4510096340864000.ingest.us.sentry.io/4510114340864000",
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending an event.
});

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useSyncedData();
  const [currentUserID, setCurrentUserIDState] = useState<string | null>(null);
  
  // Get the current user's profile from the profile object
  // The profile should be the current user's profile, not all profiles

  
  useEffect(() => {
      // AsyncStorage.clear()

    const checkInitialSessionAndSync = async () => {
      try {
        console.log('[RootLayout] Checking initial session and syncing data');
        
        // Initialize the app using the app initializer
        await initializeApp();
        
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;
        
        console.log('[RootLayout] Initial session check:', { 
          hasSession: !!session, 
          userId, 
          isAuthenticated: !!userId 
        });
        
        // Initialize user session if user is logged in
        if (userId) {
          console.log('[RootLayout] Initializing user session for:', userId);
          await initializeUserSession(userId);
        }
        
        setCurrentUserID(userId);
        setCurrentUserIDState(userId);
        
        console.log('[RootLayout] Forcing initial sync');
        await forceSyncAll(); // Ensure all data is synchronized after session check
      } catch (error) {
        console.error('Error checking initial session or syncing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSessionAndSync();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user?.id || null;
      
      console.log('[RootLayout] Auth state changed:', { 
        event: _event, 
        userId, 
        isAuthenticated: !!userId,
        hasSession: !!session,
        sessionUser: session?.user ? {
          id: session.user.id,
          email: session.user.email,
        } : null,
        sessionExpiresAt: session?.expires_at,
      });
      
      if (userId) {
        console.log('[RootLayout] Initializing user session for:', userId);
        await initializeUserSession(userId);
        console.log('[RootLayout] User session initialized for:', userId);
      } else {
        console.log('[RootLayout] Cleaning up user session');
        await cleanupUserSession();
        console.log('[RootLayout] User session cleaned up');
      }
      
      console.log('[RootLayout] Forcing sync after auth state change');
      await forceSyncAll();
      console.log('[RootLayout] Sync completed after auth state change');
      setCurrentUserID(userId);
      setCurrentUserIDState(userId);
      console.log('[RootLayout] Current user ID state updated to:', userId);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading screen while auth state is being determined
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }
  
  // Determine if user is authenticated based on whether we have a current user ID
  const isAuthenticated = !!currentUserID;
  
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Disable headers by default for all screens
      }}
    >

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/change-password" />
        <Stack.Screen name="stats/discovered" />
        <Stack.Screen name="stats/points" />
        <Stack.Screen name="stats/wishlist" />
        <Stack.Screen name="stats/achievements" />
        <Stack.Screen name="creatures/[id]" />
        <Stack.Screen name="categories/[id]/index" />
        <Stack.Screen 
          name="modal/explore" 
          options={{ 
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="modal/leaderboard" 
          options={{ 
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="modal/creature-picker" 
          options={{ 
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="modal/dive-site-picker" 
          options={{ 
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="dive-sites/add" 
        />
      </Stack.Protected>
    </Stack>
  );
}