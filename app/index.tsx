import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { authService } from '@/services/authService';
import { debugLogger } from '@/utils/debugLogger';

export default function IndexScreen() {
  useEffect(() => {
    debugLogger.logAuthEvent('IndexScreen mounted, checking auth state');
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      debugLogger.logAuthEvent('Initializing auth service in IndexScreen');
      // Initialize auth service
      await authService.initialize();
      
      // Check if user is authenticated
      const isAuthenticated = authService.isAuthenticated();
      debugLogger.logAuthEvent('Auth state check result', { isAuthenticated });
      
      if (isAuthenticated) {
        debugLogger.logAuthEvent('User is authenticated, navigating to tabs');
        router.replace('/(tabs)');
      } else {
        debugLogger.logAuthEvent('User is not authenticated, navigating to login');
        router.replace('/(auth)/login');
      }
    } catch (error) {
      debugLogger.logError('IndexScreen - Auth check error', error);
      console.error('Auth check error:', error);
      debugLogger.logAuthEvent('Error during auth check, navigating to login');
      router.replace('/(auth)/login');
    }
  };

  debugLogger.logAuthEvent('Rendering IndexScreen placeholder');
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});