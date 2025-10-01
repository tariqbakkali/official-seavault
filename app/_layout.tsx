import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { ActivityIndicator, View, Text } from 'react-native';
import * as Sentry from 'sentry-expo';

// Initialize Sentry
Sentry.init({
  dsn: "https://dc149a7492f76fc80c8634923f23401f@o4510096394158080.ingest.us.sentry.io/4510114340864000",
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending an event.
});

export default function RootLayout() {
  const { initializeAuth, setupAuthListener } = useAuthStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { ensureUserProfile } = useUserStore();

  useEffect(() => {
    initializeAuth();
    setupAuthListener();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      ensureUserProfile();
    }
  }, [isAuthenticated]);
  
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