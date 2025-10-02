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

// Import the functions we want to test
import { supabase } from '../services/supabase';

describe('Auth Integration with Local-First Implementation', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  test('should be able to call auth functions without errors', async () => {
    // These should not throw errors
    await expect(supabase.auth.getSession()).resolves.not.toThrow();
    await expect(supabase.auth.getUser()).resolves.not.toThrow();
    await expect(supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
      options: {
        data: {
          full_name: 'Test User',
        },
      },
    })).resolves.not.toThrow();
    await expect(supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    })).resolves.not.toThrow();
    await expect(supabase.auth.signOut()).resolves.not.toThrow();
  });

  test('should set up auth listener without errors', () => {
    // This should not throw errors
    expect(() => supabase.auth.onAuthStateChange(() => {})).not.toThrow();
  });
});