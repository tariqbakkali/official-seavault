import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';
import { useEffect } from 'react';
import { usePathname } from 'expo-router';

export default function UnmatchedRoute() {
  const pathname = usePathname();

  useEffect(() => {
    console.log('[UnmatchedRoute] Caught path:', pathname);
  }, [pathname]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.PRIMARY} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
