import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import SharkAnimation from '@/components/ui/SharkAnimation';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import { showAlert } from '@/utils/alertUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DIMENSIONS, APP_CONFIG } from '@/constants';
import { TYPOGRAPHY } from '@/constants';
import { PasswordStrengthIndicator } from '@/screens/auth/reset-password/components/PasswordStrengthIndicator';

export default function ResetPasswordScreen() {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordStrength, setPasswordStrength] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [canResetPassword, setCanResetPassword] = React.useState(false);
  const [checkingReset, setCheckingReset] = React.useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Function to parse URL and set up session
  const parseUrlAndSetupSession = async (url: string) => {
    try {

      // Check if URL contains fragment parameters
      if (url && url.includes('#')) {
        // Parse fragment parameters
        const fragment = url.split('#')[1];
        if (fragment) {
          const fragmentParams = new URLSearchParams(fragment);
          const accessToken = fragmentParams.get('access_token');
          const refreshToken = fragmentParams.get('refresh_token');
          const type = fragmentParams.get('type');



          // Check if we have the necessary parameters for a recovery session
          if (type === 'recovery' && accessToken) {

            // Set the session manually
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '', // refresh_token might be optional
            });


            if (error) {
              console.error('Session setup error:', error);
              return false;
            } else {
              return true;
            }
          } else {
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

        // Try to get the current URL
        let urlSetupSuccess = false;

        try {
          const url = await Linking.getInitialURL();

          if (url) {
            urlSetupSuccess = await parseUrlAndSetupSession(url);
          } else {
          }
        } catch (urlError) {
        }

        // If URL parsing didn't work, check if we have a valid session
        if (!urlSetupSuccess) {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Session check error:', error);
          } else {

            // If we have a session with a user, we can reset the password
            if (session && session.user) {
              setCanResetPassword(true);
            } else {
            }
          }
        } else {
          // URL parsing was successful, so we can reset the password
          setCanResetPassword(true);
        }
      } catch (error) {
        console.error('Error checking reset capability:', error);
      } finally {
        setCheckingReset(false);
      }
    };

    checkResetCapability();

    // Also listen for URL events while this component is mounted
    const urlSubscription = Linking.addEventListener('url', async (event) => {
      const success = await parseUrlAndSetupSession(event.url);
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
      // Update the user's password directly using Supabase
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

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

  // Show loading state while checking
  if (checkingReset) {
    return (
      <View style={[styles.container, {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }]}>
        <View style={styles.centeredContent}>
          <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.subtitle}>Preparing Password Reset</Text>
          <SharkAnimation size={100} color={COLORS.PRIMARY} />
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
      <View style={[styles.container, {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }]}>
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
    <View style={[styles.container, {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
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

            <PasswordStrengthIndicator password={password} passwordStrength={passwordStrength} />

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
                <SharkAnimation size={24} color="#fff" />
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
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingVertical: DIMENSIONS.PADDING_LG,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingVertical: DIMENSIONS.PADDING_LG,
    gap: DIMENSIONS.SPACE_LG,
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
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  message: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#fff',
    textAlign: 'center',
    marginBottom: DIMENSIONS.SPACE_XL,
  },
  form: {
    gap: DIMENSIONS.SPACE_LG,
  },
  label: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.PADDING_LG,
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
    marginTop: DIMENSIONS.SPACE_XL,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
  },

});
