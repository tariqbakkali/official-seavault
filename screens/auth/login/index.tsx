import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService } from '@/services/authService';
import { supabase } from '@/services/supabase';
import { ROUTES, COLORS, DIMENSIONS, APP_CONFIG } from '@/constants';
import { debugLogger } from '@/utils/debugLogger';

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const insets = useSafeAreaInsets();

  // Add email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuth = async () => {
    debugLogger.logAuthEvent('Handle auth called', { isSignUp, email });
    
    if (!email || !password) {
      debugLogger.logAuthEvent('Validation failed - missing fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      debugLogger.logAuthEvent('Validation failed - invalid email format');
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        debugLogger.logAuthEvent('Processing sign up request');
        const result = await authService.signUp(email, password);
        
        if (result.success) {
          if (result.requiresEmailConfirmation) {
            debugLogger.logAuthEvent('Sign up successful but requires email confirmation');
            Alert.alert(
              'Confirm Your Email',
              result.message,
              [{ text: 'OK' }]
            );
            // Switch to sign in mode so user can sign in after confirming email
            setIsSignUp(false);
          } else {
            // User is already signed in
            debugLogger.logAuthEvent('Sign up successful and user signed in');
            Alert.alert('Success', result.message);
            router.replace(ROUTES.TABS.HOME);
          }
        } else {
          debugLogger.logAuthEvent('Sign up failed', { message: result.message });
          Alert.alert('Error', result.message);
        }
      } else {
        debugLogger.logAuthEvent('Processing sign in request');
        const result = await authService.signIn(email, password);
        
        if (result.success) {
          // Navigation will be handled by the auth state change listener
          debugLogger.logAuthEvent('Sign in successful');
          console.log('Sign in successful');
        } else {
          debugLogger.logAuthEvent('Sign in failed', { message: result.message });
          Alert.alert('Error', result.message);
        }
      }
    } finally {
      debugLogger.logAuthEvent('Auth process completed, clearing loading state');
      setLoading(false);
    }
  };

  // Add password reset function
  const handlePasswordReset = async () => {
    debugLogger.logAuthEvent('Handle password reset called', { email });
    
    if (!email) {
      debugLogger.logAuthEvent('Password reset failed - missing email');
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      debugLogger.logAuthEvent('Password reset failed - invalid email format');
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      debugLogger.logAuthEvent('Processing password reset request');
      const result = await authService.resetPassword(email);
      debugLogger.logAuthEvent('Password reset result', { success: result.success, message: result.message });
      Alert.alert(
        result.success ? 'Success' : 'Error',
        result.message
      );
    } finally {
      debugLogger.logAuthEvent('Password reset process completed, clearing loading state');
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.subtitle}>{APP_CONFIG.TAGLINE}</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCorrect={false}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handlePasswordReset}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                debugLogger.logAuthEvent('Switching auth mode', { isSignUp: !isSignUp });
                setIsSignUp(!isSignUp);
              }}
              disabled={loading}
            >
              <Text style={styles.switchText}>
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
});