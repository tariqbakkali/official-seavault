import { useAuthStore } from '@/stores/auth';
import { useDataStore } from '@/stores/data';
import { useAchievementStore } from '@/stores/achievement';

// Mock Supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('Stores', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Auth Store', () => {
    it('should initialize with default state', () => {
      const { user, session, isAuthenticated, isLoading, error } = useAuthStore.getState();
      
      expect(user).toBeNull();
      expect(session).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });
  });

  describe('Data Store', () => {
    it('should initialize with default state', () => {
      const { catalog, userData, diveSites, isLoading, error } = useDataStore.getState();
      
      expect(catalog).toBeNull();
      expect(userData).toBeNull();
      expect(diveSites).toBeNull();
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });
  });

  describe('Achievement Store', () => {
    it('should initialize with default state', () => {
      const { unlockedAchievements, isLoading, error } = useAchievementStore.getState();
      
      expect(unlockedAchievements).toBeNull();
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });
  });
});