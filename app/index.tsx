import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth'; // Updated import

export default function Index() {
  const { initializeAuth, checkIsAuthenticated } = useAuthStore(); // Updated usage

  useEffect(() => {
    initializeAuth(); // Updated usage
  }, []);

  const authenticated = checkIsAuthenticated(); // Updated usage

  if (authenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}