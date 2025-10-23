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
import { isValidEmail } from './utils/authValidation';
import { showAlert } from '@/utils/alertUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSyncedData } from '@/hooks/useSyncedData'; // Import useSyncedData hook

export default function LoginScreen() {
  const [email, setEmail] = React.useState('testing12@gmail.com');
  const [password, setPassword] = React.useState('111111');
  const [loading, setLoading] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const insets = useSafeAreaInsets();
  const { createProfileForCurrentUser, fetchUserData } = useSyncedData(); // Get the createProfileForCurrentUser function

  const handleAuth = async () => {
    console.log('[LoginScreen] Starting authentication process', {
      isSignUp,
      email,
    });

    if (!email || !password) {
      console.log('[LoginScreen] Validation failed: Missing email or password');
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      console.log('[LoginScreen] Validation failed: Invalid email format');
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        console.log('[LoginScreen] Processing signup');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error('[LoginScreen] Signup error:', error);
          throw error;
        }

        if (data) {
          console.log('[LoginScreen] Signup successful', {
            hasUser: !!data.user,
            hasSession: !!data.session,
            userId: data.user?.id,
          });

          // Check if email confirmation is required
          if (data.user && !data.user.email_confirmed_at) {
            console.log('[LoginScreen] Email confirmation required');
            showAlert(
              'Confirm Your Email',
              'Please check your email and click the confirmation link to complete your registration.',
              () => setIsSignUp(false) // Pass a callback for OK button
            );
            // Switch to sign in mode so user can sign in after confirming email
            setIsSignUp(false);
          } else {
            // User is already signed in, ensure profile is created
            console.log(
              '[LoginScreen] Creating profile for new user after signup'
            );
            // Wait a bit for initial sync to complete
            await new Promise((resolve) => setTimeout(resolve, 200));
            await createProfileForCurrentUser({});
            console.log('[LoginScreen] Profile created for new user');
            showAlert('Success', 'Account created successfully!');
          }
        } else {
          console.log('[LoginScreen] Signup failed: No data returned');
          showAlert('Error', 'Failed to create account. Please try again.');
        }
      } else {
        console.log('[LoginScreen] Processing signin');
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

          console.log('[LoginScreen] User signed in, waiting for initial sync');
          // Wait a bit for initial sync to complete
          await new Promise((resolve) => setTimeout(resolve, 200));
          console.log('[LoginScreen] Creating profile if needed');
          // After successful login, ensure profile exists
          await createProfileForCurrentUser({});
          console.log('[LoginScreen] Profile creation/check completed');
          // Also fetch user data to populate the profile observable
          await fetchUserData();
          console.log('[LoginScreen] User data fetched');
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
    fontSize: TYPOGRAPHY.SIZE_DISPLAY,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    fontSize: TYPOGRAPHY.SIZE_LG,
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
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchText: {
    color: '#007AFF',
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
});
