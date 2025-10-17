import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useSyncedData } from '@/hooks/useSyncedData';
import { ActivityIndicator, View, Text } from 'react-native';
import { supabase } from '@/services/supabase';
import * as Sentry from '@sentry/react-native';
import { setCurrentUserID } from '@/stores/syncedObservables';
import { forceSyncAll } from '@/utils/syncUtils';
import { initializeApp, initializeUserSession, cleanupUserSession } from '@/utils/appInitializer'; // Import app initializer functions
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Sentry
Sentry.init({
  dsn: "https://dc149a7492f76fc80c8634923f23401f@o4510096340864000.ingest.us.sentry.io/4510114340864000",
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
        // Initialize the app using the app initializer
        await initializeApp();
        
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;
        
        // Initialize user session if user is logged in
        if (userId) {
          await initializeUserSession(userId);
        }
        
        setCurrentUserID(userId);
        setCurrentUserIDState(userId);
        
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
      
      if (userId) {
        await initializeUserSession(userId);
      } else {
        await cleanupUserSession();
      }
      
      await forceSyncAll();
      setCurrentUserID(userId);
      setCurrentUserIDState(userId);
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