import * as React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/auth/login/index';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

// Mock alert utilities
jest.mock('@/utils/alertUtils', () => ({
  showAlert: jest.fn(),
}));

// Mock useSyncedData hook
jest.mock('@/hooks/useSyncedData', () => ({
  useSyncedData: () => ({
    createProfileForCurrentUser: jest.fn(),
    fetchUserData: jest.fn(),
  }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const component = render(React.createElement(LoginScreen, null));
    
    expect(component.getByText('SeaVault')).toBeTruthy();
    expect(component.getByText('Discover them all')).toBeTruthy();
    expect(component.getByPlaceholderText('Email')).toBeTruthy();
    expect(component.getByPlaceholderText('Password')).toBeTruthy();
  });

  it('shows forgot password link', () => {
    const component = render(React.createElement(LoginScreen, null));
    
    expect(component.getByText('Forgot Password?')).toBeTruthy();
  });

  it('calls resetPasswordForEmail when forgot password is pressed', async () => {
    const component = render(React.createElement(LoginScreen, null));
    
    const emailInput = component.getByPlaceholderText('Email');
    const forgotPasswordButton = component.getByText('Forgot Password?');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(forgotPasswordButton);
    
    const { supabase } = require('@/services/supabase');
    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'SeaVault:///(auth)/reset-password'
        }
      );
    });
  });
});