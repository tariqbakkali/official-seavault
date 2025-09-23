import { Database } from '../../../types/database';

export interface AuthState {
  user: any | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  initializeAuth: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ user: any; session: any } | null>;
  signIn: (email: string, password: string) => Promise<{ user: any; session: any } | null>;
  signOut: () => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  setupAuthListener: () => void;
  checkIsAuthenticated: () => boolean;
  getCurrentUser: () => any | null;
  getCurrentSession: () => any | null;
  fetchCurrentUser: () => Promise<any | null>;
  getAuthState: () => { user: any | null; session: any | null; isAuthenticated: boolean };
  reset: () => void;
}