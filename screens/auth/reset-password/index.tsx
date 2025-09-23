import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { showAlert } from '@/utils/alertUtils';
import { APP_CONFIG } from '@/constants';
import { supabase } from '@/services/supabase';

export default function ResetPasswordScreen() {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [passwordStrength, setPasswordStrength] = React.useState(0);
  const [canResetPassword, setCanResetPassword] = React.useState(false);
  const [checkingReset, setCheckingReset] = React.useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updatePassword } = useAuthStore();

  // Function to parse URL and set up session
  const parseUrlAndSetupSession = async (url: string) => {
    try {
      console.log('Parsing URL:', url);
      
      // Check if URL contains fragment parameters
      if (url && url.includes('#')) {
        // Parse fragment parameters
        const fragment = url.split('#')[1];
        if (fragment) {
          const fragmentParams = new URLSearchParams(fragment);
          const accessToken = fragmentParams.get('access_token');
          const refreshToken = fragmentParams.get('refresh_token');
          const type = fragmentParams.get('type');
          
          console.log('Parsed fragment parameters:', {
            accessToken: accessToken ? 'PRESENT' : 'MISSING',
            refreshToken: refreshToken ? 'PRESENT' : 'MISSING',
            type
          });
          
          // Check if we have the necessary parameters for a recovery session
          if (type === 'recovery' && accessToken) {
            console.log('Setting up recovery session with access token');
            
            // Set the session manually
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '', // refresh_token might be optional
            });
            
            console.log('setSession response:', { data, error });
            
            if (error) {
              console.error('Session setup error:', error);
              return false;
            } else {
              console.log('Session set successfully:', data);
              
              // Manually update the auth store state since the listener might not trigger
              if (data?.session) {
                useAuthStore.setState({
                  session: data.session,
                  user: data.session.user,
                  isAuthenticated: true
                });
                console.log('Manually updated auth store state');
              }
              
              // Verify the session was actually set
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              console.log('Verified session:', { session, sessionError });
              
              return true;
            }
          } else {
            console.log('Missing required parameters for recovery session');
            console.log('Type:', type, 'Access Token:', !!accessToken);
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return false;
    }
  };

  // Check if we can reset the password
  React.useEffect(() => {
    const checkResetCapability = async () => {
      try {
        console.log('All URL parameters:', params);
        
        // Try to get the current URL
        let urlSetupSuccess = false;
        
        try {
          const url = await Linking.getInitialURL();
          console.log('Current URL from getInitialURL:', url);
          
          if (url) {
            urlSetupSuccess = await parseUrlAndSetupSession(url);
            console.log('URL setup success:', urlSetupSuccess);
          } else {
            console.log('No URL returned from getInitialURL');
          }
        } catch (urlError) {
          console.log('Error getting current URL:', urlError);
        }
        
        // If URL parsing didn't work, check if we have a valid session
        if (!urlSetupSuccess) {
          console.log('Checking for existing session...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error);
          } else {
            console.log('Current session:', session);
            
            // If we have a session with a user, we can reset the password
            if (session && session.user) {
              console.log('Can reset password - valid session found');
              setCanResetPassword(true);
            } else {
              console.log('No valid session found');
            }
          }
        } else {
          // URL parsing was successful, so we can reset the password
          console.log('URL parsing successful, enabling password reset');
          setCanResetPassword(true);
        }
      } catch (error) {
        console.error('Error checking reset capability:', error);
      } finally {
        console.log('Finished checking reset capability');
        setCheckingReset(false);
      }
    };
    
    checkResetCapability();
    
    // Also listen for URL events while this component is mounted
    const urlSubscription = Linking.addEventListener('url', async (event) => {
      console.log('URL event in reset password screen:', event.url);
      const success = await parseUrlAndSetupSession(event.url);
      console.log('URL event parsing success:', success);
      if (success) {
        setCanResetPassword(true);
        setCheckingReset(false);
      }
    });
    
    return () => {
      urlSubscription.remove();
    };
  }, [params]);

  // Calculate password strength
  React.useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    setPasswordStrength(strength);
  }, [password]);

  const handleResetPassword = async () => {
    if (!canResetPassword) {
      showAlert('Error', 'Unable to reset password. Please use a valid reset link.');
      return;
    }

    if (!password || !confirmPassword) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // Since the session is already set by setSession, we can directly update the password
      await updatePassword(password);
      
      showAlert(
        'Success',
        'Password updated successfully!',
        () => router.replace('/(auth)/login')
      );
    } catch (error: any) {
      console.error('Reset password error:', error);
      showAlert(
        'Error',
        error.message || 'Failed to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  // Show loading state while checking
  if (checkingReset) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.centeredContent}>
          <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.subtitle}>Preparing Password Reset</Text>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.message}>
            Please wait while we prepare your password reset...
          </Text>
        </View>
      </View>
    );
  }

  // Show a message if we can't reset the password and don't have a token
  if (!canResetPassword) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.centeredContent}>
          <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.subtitle}>Unable to Reset Password</Text>
          <Text style={styles.message}>
            We couldn't verify your password reset request. Please request a new reset link.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.subtitle}>Reset Your Password</Text>

          <View style={styles.form}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            
            <View style={styles.passwordStrengthContainer}>
              <View style={styles.passwordStrengthBars}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.passwordStrengthBar,
                      {
                        backgroundColor: index < passwordStrength 
                          ? strengthColors[Math.min(passwordStrength - 1, 3)]
                          : '#333'
                      }
                    ]}
                  />
                ))}
              </View>
              {password ? (
                <Text style={[styles.passwordStrengthText, { color: strengthColors[Math.min(passwordStrength - 1, 3)] }]}>
                  {passwordStrength > 0 ? strengthLabels[Math.min(passwordStrength - 1, 3)] : 'Too short'}
                </Text>
              ) : null}
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
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
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
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
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
  passwordStrengthContainer: {
    gap: 8,
  },
  passwordStrengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});