import { getAuthRedirectUrl, getPasswordResetRedirectUrl } from '../utils/authUtils';

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://test.supabase.co',
      },
      hostUri: '192.168.1.100:8081',
    },
  },
}));

describe('authUtils', () => {
  describe('getAuthRedirectUrl', () => {
    it('should return production URL when not in development', () => {
      const url = getAuthRedirectUrl();
      expect(url).toBe('SeaVault:///reset-password');
    });
  });

  describe('getPasswordResetRedirectUrl', () => {
    it('should return the same URL as getAuthRedirectUrl', () => {
      const authUrl = getAuthRedirectUrl();
      const passwordUrl = getPasswordResetRedirectUrl();
      expect(authUrl).toBe(passwordUrl);
    });
  });
});