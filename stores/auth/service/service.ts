import { useAuthStore } from '../store/store';

// Export functional service functions for backward compatibility
export const initializeAuth = (): Promise<void> => {
  return useAuthStore.getState().initializeAuth();
};

export const signUp = (
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: any; session: any } | null> => {
  return useAuthStore.getState().signUp(email, password, fullName);
};

export const signIn = (
  email: string,
  password: string
): Promise<{ user: any; session: any } | null> => {
  return useAuthStore.getState().signIn(email, password);
};

export const signOut = (): Promise<void> => {
  return useAuthStore.getState().signOut();
};

export const updateEmail = (newEmail: string): Promise<void> => {
  return useAuthStore.getState().updateEmail(newEmail);
};

export const setupAuthListener = (): void => {
  useAuthStore.getState().setupAuthListener();
};

export const isAuthenticated = (): boolean => {
  return useAuthStore.getState().checkIsAuthenticated();
};

export const getCurrentUser = (): any | null => {
  return useAuthStore.getState().getCurrentUser();
};

export const getCurrentSession = (): any | null => {
  return useAuthStore.getState().getCurrentSession();
};

export const fetchCurrentUser = (): Promise<any | null> => {
  return useAuthStore.getState().fetchCurrentUser();
};

export const getAuthState = (): { user: any | null; session: any | null; isAuthenticated: boolean } => {
  return useAuthStore.getState().getAuthState();
};