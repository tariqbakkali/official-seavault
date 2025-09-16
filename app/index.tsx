import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { supabase } from '@/services/supabase';

export default function IndexScreen() {
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/(auth)/login');
    }
  };

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});