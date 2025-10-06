import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useSyncedData } from '@/hooks/useSyncedData';
import { ActivityIndicator, View, Text } from 'react-native';
import { supabase } from '@/services/supabase';
import * as Sentry from 'sentry-expo';
import { setCurrentUserID } from '@/stores/syncedObservables';
import { forceSyncAll } from '@/utils/syncUtils';

// Initialize Sentry
Sentry.init({
  dsn: "https://dc149a7492f76fc80c8634923f23401f@o4510096340864000.ingest.us.sentry.io/4510114340864000",
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending an event.
});

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useSyncedData();
  const currentUserID = profile?.id; // Derive currentUserID from the profile observable

  useEffect(() => {
    const checkInitialSessionAndSync = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUserID(session?.user?.id || null);
        await forceSyncAll(); // Ensure all data is synchronized after session check
      } catch (error) {
        console.error('Error checking initial session or syncing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSessionAndSync();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id || null;
      setCurrentUserID(userId);
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
  
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Disable headers by default for all screens
      }}
    >

      <Stack.Protected guard={!currentUserID}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={!!currentUserID}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/change-password" />
        <Stack.Screen name="stats/discovered" />
        <Stack.Screen name="stats/points" />
        <Stack.Screen name="stats/wishlist" />
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
          name="dive-sites/add" 
        />
      </Stack.Protected>
    </Stack>
  );
}