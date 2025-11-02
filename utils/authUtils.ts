import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ROUTES } from '@/constants';

/**
 * Generates the appropriate redirect URL for authentication flows
 * based on the current environment (development/production)
 * 
 * @returns The redirect URL as a string
 */
export const getAuthRedirectUrl = (): string => {
  // Check if we're in development mode
  // Using the standard React Native approach with __DEV__
  const isDevelopment = __DEV__;
  
  // For production, use the standard deep link scheme with two slashes
  if (!isDevelopment) {
    return `SeaVault://${ROUTES.AUTH.RESET_PASSWORD.substring(1)}`;
  }
  
  // For development, we need to construct the URL with the local IP and port
  // Get the development server URL if available
  const developmentUrl = Constants.expoConfig?.hostUri || 'localhost:8081';
  
  // Extract the IP address and port from the development URL
  const [ipAddress, port] = developmentUrl.split(':');
  
  // Use default port 8081 if not specified
  const portNumber = port || '8081';
  
  // Construct the redirect URL for development
  // This follows the Expo deep linking pattern for development
  return `exp://${ipAddress}:${portNumber}/--/${ROUTES.AUTH.RESET_PASSWORD.substring(1)}`;
};

/**
 * Generates the redirect URL specifically for password reset
 * 
 * @returns The password reset redirect URL as a string
 */
export const getPasswordResetRedirectUrl = (): string => {
  return getAuthRedirectUrl();
};