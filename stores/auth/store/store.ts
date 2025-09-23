import { create } from 'zustand';
import { supabase } from '../../../services/supabase';
import { AuthState, AuthActions } from '../types/types';
import { Database } from '../../../types/database';

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  initializeAuth: async (): Promise<void> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Get user profile
        const { data: { user } } = await supabase.auth.getUser();
        set((state) => ({ 
          ...state, 
          user: user || null, 
          session, 
          isAuthenticated: true, 
          isLoading: false 
        }));
      } else {
        set((state) => ({ 
          ...state, 
          user: null, 
          session: null, 
          isAuthenticated: false, 
          isLoading: false 
        }));
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set((state) => ({ 
        ...state, 
        error: 'Failed to initialize auth', 
        isLoading: false 
      }));
    }
  },

  signUp: async (email, password, fullName): Promise<{ user: any; session: any } | null> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        set((state) => ({ 
          ...state, 
          user: data.user, 
          session: data.session, 
          isAuthenticated: true, 
          isLoading: false 
        }));
      }

      return data;
    } catch (error: any) {
      console.error('Sign up error:', error);
      set((state) => ({ 
        ...state, 
        error: error.message || 'Failed to sign up', 
        isLoading: false 
      }));
      return null;
    }
  },

  signIn: async (email, password): Promise<{ user: any; session: any } | null> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        set((state) => ({ 
          ...state, 
          user: data.user, 
          session: data.session, 
          isAuthenticated: true, 
          isLoading: false 
        }));
      }

      return data;
    } catch (error: any) {
      console.error('Sign in error:', error);
      set((state) => ({ 
        ...state, 
        error: error.message || 'Failed to sign in', 
        isLoading: false 
      }));
      return null;
    }
  },

  signOut: async (): Promise<void> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      set((state) => ({ 
        ...state, 
        user: null, 
        session: null, 
        isAuthenticated: false, 
        isLoading: false 
      }));
    } catch (error: any) {
      console.error('Sign out error:', error);
      set((state) => ({ 
        ...state, 
        error: error.message || 'Failed to sign out', 
        isLoading: false 
      }));
    }
  },

  updateEmail: async (newEmail): Promise<void> => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });
      
      if (error) throw error;
      
      // Refresh user data
      const { data: { user } } = await supabase.auth.getUser();
      set((state) => ({ 
        ...state, 
        user: user || state.user, 
        isLoading: false 
      }));
    } catch (error: any) {
      console.error('Update email error:', error);
      set((state) => ({ 
        ...state, 
        error: error.message || 'Failed to update email', 
        isLoading: false 
      }));
    }
  },

  setupAuthListener: (): void => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Get user profile
        supabase.auth.getUser().then(({ data: { user } }) => {
          set((state) => ({ 
            ...state, 
            user: user || null, 
            session, 
            isAuthenticated: true 
          }));
        });
      } else {
        set((state) => ({ 
          ...state, 
          user: null, 
          session: null, 
          isAuthenticated: false 
        }));
      }
    });
  },

  checkIsAuthenticated: () => {
    return get().isAuthenticated;
  },

  getCurrentUser: (): any | null => {
    return get().user;
  },

  getCurrentSession: (): any | null => {
    return get().session;
  },

  fetchCurrentUser: async (): Promise<any | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (user) {
        set((state) => ({ ...state, user }));
      }
      
      return user || null;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },

  getAuthState: (): { user: any | null; session: any | null; isAuthenticated: boolean } => {
    const { user, session, isAuthenticated } = get();
    return { user, session, isAuthenticated };
  },

  reset: () => set({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),
}));