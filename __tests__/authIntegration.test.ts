import { useAuthStore } from '../stores/auth/store/store';

// Mock the uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// Mock the Supabase client
jest.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      updateUser: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn().mockImplementation((callback) => {
        // Immediately call the callback with a mock session
        callback('SIGNED_IN', { user: { id: 'test-user-id' } });
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
    },
  },
}));

describe('Auth Integration with Local-First Implementation', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should have auth store functions', () => {
    const { 
      initializeAuth, 
      signUp, 
      signIn, 
      signOut, 
      setupAuthListener 
    } = useAuthStore.getState();
    
    // Check that all auth functions exist
    expect(typeof initializeAuth).toBe('function');
    expect(typeof signUp).toBe('function');
    expect(typeof signIn).toBe('function');
    expect(typeof signOut).toBe('function');
    expect(typeof setupAuthListener).toBe('function');
  });

  test('should be able to call auth functions without errors', async () => {
    const { initializeAuth, signUp, signIn, signOut } = useAuthStore.getState();
    
    // These should not throw errors
    await expect(initializeAuth()).resolves.not.toThrow();
    await expect(signUp('test@example.com', 'password123', 'Test User')).resolves.not.toThrow();
    await expect(signIn('test@example.com', 'password123')).resolves.not.toThrow();
    await expect(signOut()).resolves.not.toThrow();
  });

  test('should set up auth listener without errors', () => {
    const { setupAuthListener } = useAuthStore.getState();
    
    // This should not throw errors
    expect(() => setupAuthListener()).not.toThrow();
  });
});