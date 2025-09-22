/**
 * AuthService - Comprehensive authentication service for Supabase in React Native Expo
 * 
 * This service handles all authentication flows including:
 * - User sign up with email confirmation
 * - User sign in with password
 * - Password reset flows
 * - Session management
 * - Auth state persistence
 * - Profile creation and management
 * 
 * Key Features:
 * - Proper error handling with user-friendly messages
 * - Session persistence using AsyncStorage
 * - Automatic profile creation via database triggers
 * - Expo-specific redirect URL handling
 * - Comprehensive type safety
 */

import { supabase } from './supabase';
import { AuthError, User, Session } from '@supabase/auth-js';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { ROUTES } from '@/constants';
import { debugLogger } from '@/utils/debugLogger';

// User session and profile types
export interface AuthUser extends User {}

export interface AuthSession extends Session {}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

// Auth service class
export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    session: null,
    isLoading: true,
    error: null,
  };

  // Singleton pattern
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Get current auth state
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  // Set auth state (internal use)
  private setAuthState(newState: Partial<AuthState>): void {
    debugLogger.logAuthEvent('Updating auth state', { 
      oldState: { 
        hasUser: !!this.authState.user, 
        hasSession: !!this.authState.session,
        isLoading: this.authState.isLoading,
        hasError: !!this.authState.error
      },
      newState: { 
        hasUser: !!newState.user, 
        hasSession: !!newState.session,
        isLoading: newState.isLoading,
        hasError: !!newState.error
      }
    });
    this.authState = { ...this.authState, ...newState };
  }

  /**
   * Initialize auth service
   * This should be called once when the app starts
   */
  async initialize(): Promise<void> {
    try {
      debugLogger.logAuthEvent('Starting initialization');
      this.setAuthState({ isLoading: true, error: null });
      
      // Get current session
      debugLogger.logAuthEvent('Attempting to get current session');
      const { data: { session }, error } = await supabase.auth.getSession();
      debugLogger.logAuthEvent('Get session result', { session: !!session, error: !!error });
      
      if (error) {
        debugLogger.logError('Auth initialization - getSession failed', error);
        throw error;
      }
      
      if (session) {
        debugLogger.logAuthEvent('Session found, setting auth state', { 
          userId: session.user.id,
          userEmail: session.user.email,
          hasSession: !!session
        });
        this.setAuthState({
          user: session.user as AuthUser,
          session: session as AuthSession,
          isLoading: false,
        });
      } else {
        debugLogger.logAuthEvent('No session found');
        this.setAuthState({
          user: null,
          session: null,
          isLoading: false,
        });
      }
    } catch (error) {
      debugLogger.logError('Auth initialization', error);
      this.setAuthState({
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  }

  /**
   * Sign up a new user
   * Handles email confirmation flow properly for Expo
   */
  async signUp(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    requiresEmailConfirmation?: boolean;
    userId?: string;
  }> {
    try {
      debugLogger.logAuthEvent('Starting sign up process', { email });
      this.setAuthState({ isLoading: true, error: null });
      
      // For Expo Go, we need to specify the redirectTo URL
      debugLogger.logAuthEvent('Calling supabase.auth.signUp');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This will redirect back to the app after email confirmation
          emailRedirectTo: Linking.createURL('/(tabs)'),
        },
      });
      
      debugLogger.logAuthEvent('Supabase signUp response', { 
        hasData: !!data, 
        hasError: !!error,
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id
      });
      
      if (error) {
        debugLogger.logError('Sign up - supabase.auth.signUp failed', error);
        throw error;
      }
      
      // Check if email confirmation is required
      if (data.user && !data.user.confirmed_at) {
        debugLogger.logAuthEvent('User created but email confirmation required', { userId: data.user.id });
        return {
          success: true,
          message: 'Please check your email to confirm your account. After confirmation, you can sign in.',
          requiresEmailConfirmation: true,
          userId: data.user.id
        };
      } else if (data.user) {
        // User is already confirmed (should be rare)
        debugLogger.logAuthEvent('User created and confirmed, setting auth state', { userId: data.user.id });
        this.setAuthState({
          user: data.user as AuthUser,
          session: data.session as AuthSession,
          isLoading: false,
        });
        
        return {
          success: true,
          message: 'Account created successfully!',
          requiresEmailConfirmation: false,
          userId: data.user.id
        };
      } else {
        // Edge case where user creation failed silently
        debugLogger.logAuthEvent('User creation failed silently');
        return {
          success: false,
          message: 'Failed to create account. Please try again.',
        };
      }
    } catch (error: any) {
      debugLogger.logError('Sign up error', error);
      this.setAuthState({ isLoading: false, error: error.message });
      
      if (error instanceof AuthError) {
        // Provide more specific error messages
        if (error.message.includes('already registered')) {
          debugLogger.logAuthEvent('Sign up failed - email already registered');
          return {
            success: false,
            message: 'An account with this email already exists. Please sign in instead.',
          };
        } else if (error.message.includes('weak password')) {
          debugLogger.logAuthEvent('Sign up failed - weak password');
          return {
            success: false,
            message: 'Password is too weak. Please use a stronger password.',
          };
        } else {
          debugLogger.logAuthEvent('Sign up failed - other AuthError', { message: error.message });
          return {
            success: false,
            message: error.message,
          };
        }
      } else {
        debugLogger.logError('Sign up - unexpected error', error);
        return {
          success: false,
          message: 'An unexpected error occurred. Please try again.',
        };
      }
    } finally {
      if (this.authState.isLoading) {
        debugLogger.logAuthEvent('Sign up process completed, clearing loading state');
        this.setAuthState({ isLoading: false });
      }
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      debugLogger.logAuthEvent('Starting sign in process', { email });
      this.setAuthState({ isLoading: true, error: null });
      
      debugLogger.logAuthEvent('Calling supabase.auth.signInWithPassword');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      debugLogger.logAuthEvent('Supabase signIn response', { 
        hasData: !!data, 
        hasError: !!error,
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id
      });
      
      if (error) {
        debugLogger.logError('Sign in - supabase.auth.signInWithPassword failed', error);
        throw error;
      }
      
      // Successfully signed in
      debugLogger.logAuthEvent('User signed in successfully, setting auth state', { userId: data.user.id });
      this.setAuthState({
        user: data.user as AuthUser,
        session: data.session as AuthSession,
        isLoading: false,
      });
      
      return {
        success: true,
        message: 'Signed in successfully!',
      };
    } catch (error: any) {
      debugLogger.logError('Sign in error', error);
      this.setAuthState({ isLoading: false, error: error.message });
      
      if (error instanceof AuthError) {
        // Provide more specific error messages
        if (error.message.includes('Invalid login credentials')) {
          debugLogger.logAuthEvent('Sign in failed - invalid credentials');
          return {
            success: false,
            message: 'Invalid email or password',
          };
        } else if (error.message.includes('Email not confirmed')) {
          debugLogger.logAuthEvent('Sign in failed - email not confirmed');
          return {
            success: false,
            message: 'Please confirm your email before signing in. Check your inbox for the confirmation email.',
          };
        } else {
          debugLogger.logAuthEvent('Sign in failed - other AuthError', { message: error.message });
          return {
            success: false,
            message: error.message,
          };
        }
      } else {
        debugLogger.logError('Sign in - unexpected error', error);
        return {
          success: false,
          message: 'An unexpected error occurred. Please try again.',
        };
      }
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      debugLogger.logAuthEvent('Starting sign out process');
      this.setAuthState({ isLoading: true, error: null });
      
      debugLogger.logAuthEvent('Calling supabase.auth.signOut');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        debugLogger.logError('Sign out - supabase.auth.signOut failed', error);
        throw error;
      }
      
      // Successfully signed out
      debugLogger.logAuthEvent('User signed out successfully, clearing auth state');
      this.setAuthState({
        user: null,
        session: null,
        isLoading: false,
      });
      
      return {
        success: true,
        message: 'Signed out successfully',
      };
    } catch (error: any) {
      debugLogger.logError('Sign out error', error);
      this.setAuthState({ isLoading: false, error: error.message });
      
      return {
        success: false,
        message: 'Failed to sign out. Please try again.',
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      debugLogger.logAuthEvent('Starting password reset process', { email });
      this.setAuthState({ isLoading: true, error: null });
      
      debugLogger.logAuthEvent('Calling supabase.auth.resetPasswordForEmail');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Linking.createURL('login'),
      });
      
      if (error) {
        debugLogger.logError('Password reset - supabase.auth.resetPasswordForEmail failed', error);
        throw error;
      }
      
      debugLogger.logAuthEvent('Password reset email sent successfully');
      return {
        success: true,
        message: 'Check your email for instructions to reset your password.',
      };
    } catch (error: any) {
      debugLogger.logError('Password reset error', error);
      this.setAuthState({ isLoading: false, error: error.message });
      
      if (error instanceof AuthError) {
        debugLogger.logAuthEvent('Password reset failed - AuthError', { message: error.message });
        return {
          success: false,
          message: error.message,
        };
      } else {
        debugLogger.logError('Password reset - unexpected error', error);
        return {
          success: false,
          message: 'An unexpected error occurred. Please try again.',
        };
      }
    } finally {
      if (this.authState.isLoading) {
        debugLogger.logAuthEvent('Password reset process completed, clearing loading state');
        this.setAuthState({ isLoading: false });
      }
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      debugLogger.logAuthEvent('Starting password update process');
      this.setAuthState({ isLoading: true, error: null });
      
      debugLogger.logAuthEvent('Calling supabase.auth.updateUser for password');
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        debugLogger.logError('Password update - supabase.auth.updateUser failed', error);
        throw error;
      }
      
      debugLogger.logAuthEvent('Password updated successfully');
      return {
        success: true,
        message: 'Password updated successfully!',
      };
    } catch (error: any) {
      debugLogger.logError('Password update error', error);
      this.setAuthState({ isLoading: false, error: error.message });
      
      if (error instanceof AuthError) {
        debugLogger.logAuthEvent('Password update failed - AuthError', { message: error.message });
        return {
          success: false,
          message: error.message,
        };
      } else {
        debugLogger.logError('Password update - unexpected error', error);
        return {
          success: false,
          message: 'An unexpected error occurred. Please try again.',
        };
      }
    } finally {
      if (this.authState.isLoading) {
        debugLogger.logAuthEvent('Password update process completed, clearing loading state');
        this.setAuthState({ isLoading: false });
      }
    }
  }

  /**
   * Update user email
   */
  async updateEmail(newEmail: string): Promise<{
    success: boolean;
    message: string;
    requiresEmailConfirmation?: boolean;
  }> {
    try {
      debugLogger.logAuthEvent('Starting email update process', { newEmail });
      this.setAuthState({ isLoading: true, error: null });
      
      debugLogger.logAuthEvent('Calling supabase.auth.updateUser for email');
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });
      
      if (error) {
        debugLogger.logError('Email update - supabase.auth.updateUser failed', error);
        throw error;
      }
      
      debugLogger.logAuthEvent('Email update request sent successfully');
      return {
        success: true,
        message: 'We have sent a confirmation email to your new address. Please check your email to confirm the change.',
        requiresEmailConfirmation: true,
      };
    } catch (error: any) {
      debugLogger.logError('Email update error', error);
      this.setAuthState({ isLoading: false, error: error.message });
      
      if (error instanceof AuthError) {
        if (error.message.includes('already registered')) {
          debugLogger.logAuthEvent('Email update failed - email already registered');
          return {
            success: false,
            message: 'An account with this email already exists.',
          };
        } else {
          debugLogger.logAuthEvent('Email update failed - other AuthError', { message: error.message });
          return {
            success: false,
            message: error.message,
          };
        }
      } else {
        debugLogger.logError('Email update - unexpected error', error);
        return {
          success: false,
          message: 'An unexpected error occurred. Please try again.',
        };
      }
    } finally {
      if (this.authState.isLoading) {
        debugLogger.logAuthEvent('Email update process completed, clearing loading state');
        this.setAuthState({ isLoading: false });
      }
    }
  }

  /**
   * Listen for auth state changes
   * This should be called once in your app's root component
   */
  setupAuthListener(): () => void {
    debugLogger.logAuthEvent('Setting up auth listener');
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      debugLogger.logAuthEvent('Auth state changed', { event, hasSession: !!session, userId: session?.user?.id });
      
      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            debugLogger.logAuthEvent('User signed in, updating auth state', { userId: session.user.id });
            this.setAuthState({
              user: session.user as AuthUser,
              session: session as AuthSession,
              error: null,
            });
            debugLogger.logAuthEvent('Navigating to home screen after sign in');
            router.replace(ROUTES.TABS.HOME);
          }
          break;
          
        case 'SIGNED_OUT':
          debugLogger.logAuthEvent('User signed out, clearing auth state');
          this.setAuthState({
            user: null,
            session: null,
            error: null,
          });
          debugLogger.logAuthEvent('Navigating to login screen after sign out');
          router.replace(ROUTES.AUTH.LOGIN);
          break;
          
        case 'TOKEN_REFRESHED':
          if (session) {
            debugLogger.logAuthEvent('Token refreshed, updating session', { userId: session.user.id });
            this.setAuthState({
              session: session as AuthSession,
              error: null,
            });
          }
          break;
          
        case 'USER_UPDATED':
          if (session) {
            debugLogger.logAuthEvent('User updated, updating auth state', { userId: session.user.id });
            this.setAuthState({
              user: session.user as AuthUser,
              session: session as AuthSession,
              error: null,
            });
          }
          break;
          
        case 'PASSWORD_RECOVERY':
          debugLogger.logAuthEvent('Password recovery event');
          // Handle password recovery flow
          debugLogger.logAuthEvent('Navigating to login screen for password recovery');
          router.replace(ROUTES.AUTH.LOGIN); // For now, redirect to login
          break;
          
        case 'INITIAL_SESSION':
          // Handle initial session - this is called when the auth listener is first set up
          debugLogger.logAuthEvent('Initial session event', { hasSession: !!session, userId: session?.user?.id });
          if (session) {
            debugLogger.logAuthEvent('Initial session found, setting auth state', { userId: session.user.id });
            this.setAuthState({
              user: session.user as AuthUser,
              session: session as AuthSession,
              error: null,
            });
          } else {
            debugLogger.logAuthEvent('No initial session found');
          }
          break;
          
        default:
          debugLogger.logAuthEvent('Unhandled auth event', { event });
          console.log('Unhandled auth event:', event);
      }
    });
    
    // Return unsubscribe function
    return () => {
      debugLogger.logAuthEvent('Unsubscribing from auth listener');
      authListener.subscription.unsubscribe();
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const isAuthenticated = !!this.authState.user;
    debugLogger.logAuthEvent('Checking authentication status', { isAuthenticated });
    return isAuthenticated;
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    debugLogger.logAuthEvent('Getting current user', { hasUser: !!this.authState.user });
    return this.authState.user;
  }

  /**
   * Get current session
   */
  getCurrentSession(): AuthSession | null {
    debugLogger.logAuthEvent('Getting current session', { hasSession: !!this.authState.session });
    return this.authState.session;
  }

  /**
   * Get current user (alternative method that fetches from Supabase)
   * This is useful when you need to ensure you have the latest user data
   */
  async fetchCurrentUser(): Promise<{
    user: AuthUser | null;
    error: AuthError | null;
  }> {
    try {
      debugLogger.logAuthEvent('Fetching current user from Supabase');
      const { data: { user }, error } = await supabase.auth.getUser();
      debugLogger.logAuthEvent('Fetch current user result', { hasUser: !!user, hasError: !!error });
      return { user: user as AuthUser, error };
    } catch (error: any) {
      debugLogger.logError('Fetch current user error', error);
      return { user: null, error };
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();