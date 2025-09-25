import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { ActivityIndicator, View, Text } from 'react-native';

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
    <Stack>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile/edit" options={{headerShown: false}} />
        <Stack.Screen name="profile/change-password" options={{headerShown: false}} />
        <Stack.Screen name="stats/discovered" options={{ title: 'Discovered Creatures' }} />
        <Stack.Screen name="stats/points" options={{ title: 'Points' }} />
        <Stack.Screen name="stats/wishlist" options={{ title: 'Wishlist' }} />
        <Stack.Screen name="creatures/[id]" options={{ title: 'Creature Details' }} />
        <Stack.Screen name="categories/[id]/index" options={{ title: 'Category' }} />
        <Stack.Screen 
          name="modal/explore" 
          options={{ 
            presentation: 'modal',
            title: 'Explore'
          }} 
        />
        <Stack.Screen 
          name="modal/leaderboard" 
          options={{ 
            presentation: 'modal',
            title: 'Leaderboard'
          }} 
        />
        <Stack.Screen 
          name="modal/creature-picker" 
          options={{ 
            presentation: 'modal',
            title: 'Select Creature'
          }} 
        />
      </Stack.Protected>
    </Stack>
  );
}