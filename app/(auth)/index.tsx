import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AuthIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login screen
    router.replace('/login');
  }, []);

  return null;
}
