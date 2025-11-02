import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { ROUTES, COLORS, DIMENSIONS, APP_CONFIG } from '@/constants';
import { TYPOGRAPHY } from '@/constants';
import { getPasswordResetRedirectUrl } from '@/utils/authUtils';
import { isValidEmail } from './utils/authValidation';
import { showAlert } from '@/utils/alertUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSyncedData } from '@/hooks/useSyncedData'; // Import useSyncedData hook

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const insets = useSafeAreaInsets();
  const { createProfileForCurrentUser, fetchUserData } = useSyncedData(); // Get the createProfileForCurrentUser function

  // Function to handle password reset
  const handlePasswordReset = async () => {
    if (!email) {
      showAlert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Send password reset email with redirect URL from constants
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl()
      });

      if (error) throw error;

      showAlert(
        'Password Reset Email Sent',
        'Please check your email for instructions to reset your password.'
      );
    } catch (error: any) {
      console.error('[LoginScreen] Password reset error:', error);
      showAlert(
        'Error',
        error.message || 'Failed to send password reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {

    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error('[LoginScreen] Signup error:', error);
          throw error;
        }

        if (data) {
          // Check if email confirmation is required
          if (data.user && !data.user.email_confirmed_at) {
            showAlert(
              'Confirm Your Email',
              'Please check your email and click the confirmation link to complete your registration.',
              () => setIsSignUp(false) // Pass a callback for OK button
            );
            // Switch to sign in mode so user can sign in after confirming email
            setIsSignUp(false);
          } else {
            // Wait a bit for initial sync to complete
            await new Promise((resolve) => setTimeout(resolve, 200));
            await createProfileForCurrentUser({});
            showAlert('Success', 'Account created successfully!');
          }
        } else {
          showAlert('Error', 'Failed to create account. Please try again.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('[LoginScreen] Signin error:', error);
          throw error;
        }

        if (data) {
          console.log('[LoginScreen] Signin successful', {
            hasUser: !!data.user,
            hasSession: !!data.session,
            userId: data.user?.id,
          });

          // Wait a bit for initial sync to complete
          await new Promise((resolve) => setTimeout(resolve, 200));
          // After successful login, ensure profile exists
          await createProfileForCurrentUser({});
          // Also fetch user data to populate the profile observable
          await fetchUserData();
        } else {
          console.log('[LoginScreen] Signin failed: No data returned');
          showAlert('Error', 'Invalid email or password. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('[LoginScreen] Authentication error:', error);
      showAlert(
        'Error',
        error.message || 'An error occurred. Please try again.'
      );
    } finally {
      console.log('[LoginScreen] Authentication process completed');
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
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

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
              }}
              disabled={loading}
            >
              <Text style={styles.switchText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : 'Need an account? Sign Up'}
              </Text>
            </TouchableOpacity>

            {/* Add Forgot Password link */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handlePasswordReset}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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
    paddingHorizontal: DIMENSIONS.PADDING_XXL,
    paddingVertical: DIMENSIONS.PADDING_XXL,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_DISPLAY,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    color: '#666',
    textAlign: 'center',
    marginBottom: DIMENSIONS.SPACE_48,
  },
  form: {
    gap: DIMENSIONS.SPACE_LG,
  },
  input: {
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingVertical: DIMENSIONS.PADDING_MD,
    backgroundColor: '#1a1a1a',
    borderRadius: DIMENSIONS.RADIUS_MD,
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.PADDING_LG,
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACE_SM,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACE_LG,
  },
  switchText: {
    color: '#007AFF',
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
  // Add styles for Forgot Password link
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACE_SM,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: TYPOGRAPHY.SIZE_MD,
    textDecorationLine: 'underline',
  },
});
