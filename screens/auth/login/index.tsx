import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import SharkAnimation from '@/components/ui/SharkAnimation';
import * as WebBrowser from 'expo-web-browser';
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
// import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { ROUTES, COLORS, DIMENSIONS, APP_CONFIG } from '@/constants';
import { TYPOGRAPHY } from '@/constants';
import { getPasswordResetRedirectUrl } from '@/utils/authUtils';
import { isValidEmail } from './utils/authValidation';
import { showAlert } from '@/utils/alertUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSyncedData } from '@/hooks/useSyncedData';

// Warm up the browser for faster OAuth
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { createProfileForCurrentUser, fetchUserData } = useSyncedData();

  // Fade in animation on mount
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Configure Google Sign-In
  React.useEffect(() => {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        offlineAccess: true,
        scopes: ['profile', 'email'],
      });
    } catch (e) {
      console.log('[GoogleSignin] Not available (likely in Expo Go)');
    }
  }, []);

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

  const handleGoogleSignIn = async () => {
    console.log('[OAuth] 🔵 Google Sign-In: Starting native flow...');
    setLoading(true);
    try {
      let GoogleSignin, statusCodes;
      try {
        const googleSigninModule = require('@react-native-google-signin/google-signin');
        GoogleSignin = googleSigninModule.GoogleSignin;
        statusCodes = googleSigninModule.statusCodes;
      } catch (e) {
        throw new Error('Native Google Sign-In is not available. You must use a development build.');
      }

      // Check if device supports Google Play Services (Android only)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Show native account picker
      const response = await GoogleSignin.signIn();

      if (response.data) {
        console.log('[OAuth] 🔵 User selected:', response.data.user.email);

        // Get ID token for Supabase
        const tokens = await GoogleSignin.getTokens();

        if (!tokens.idToken) {
          throw new Error('No ID token received from Google');
        }

        console.log('[OAuth] 🔵 Exchanging ID token with Supabase...');

        // Sign in to Supabase with Google ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: tokens.idToken,
        });

        if (error) throw error;

        console.log('[OAuth] ✅ Authentication successful!');

        // Profile will be created automatically by handle_new_user trigger
        await new Promise((resolve) => setTimeout(resolve, 200));
        await createProfileForCurrentUser({});
        await fetchUserData();
      } else {
        console.log('[OAuth] ⚠️ User cancelled flow');
      }

    } catch (error: any) {
      console.error('[OAuth] ❌ Failed:', error);

      // Need to safely access statusCodes since it might be undefined if require failed
      const googleSigninModule = tryRequireGoogleSignin();
      const statusCodes = googleSigninModule?.statusCodes;

      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[OAuth] ⚠️ User cancelled');
      } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
        showAlert('Error', 'Sign in already in progress');
      } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showAlert('Error', 'Google Play Services not available.');
      } else {
        showAlert('Error', error.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const tryRequireGoogleSignin = () => {
    try {
      return require('@react-native-google-signin/google-signin');
    } catch (e) {
      return null;
    }
  };

  const handleAppleSignIn = async () => {
    console.log('[OAuth] 🍎 Apple Sign-In: Starting...');
    setLoading(true);
    try {
      let AppleAuthentication;
      try {
        AppleAuthentication = require('expo-apple-authentication');
      } catch (e) {
        console.log('[AppleAuth] Native module not found, falling back to web');
      }

      const isAvailable = AppleAuthentication ? await AppleAuthentication.isAvailableAsync() : false;

      if (isAvailable && Platform.OS === 'ios') {
        console.log('[OAuth] 🍎 Using Native Apple Sign-In');

        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        console.log('[OAuth] 🍎 Credential received');

        if (credential.identityToken) {
          const { error, data } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: credential.identityToken,
          });

          if (error) throw error;

          console.log('[OAuth] ✅ Authentication successful!');

          // Profile will be created automatically by handle_new_user trigger
          await new Promise((resolve) => setTimeout(resolve, 200));
          await createProfileForCurrentUser({});
          await fetchUserData();
        } else {
          throw new Error('No identity token provided');
        }
      } else {
        console.log('[OAuth] 🍎 Using Web OAuth (Android/Fallback)');
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: `${APP_CONFIG.DEEP_LINK_SCHEME}://auth/callback`,
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;

        if (data?.url) {
          console.log('[OAuth] 🍎 Opening in-app browser modal...');
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            `${APP_CONFIG.DEEP_LINK_SCHEME}://auth/callback`
          );

          console.log('[OAuth] Result:', result.type);

          if (result.type === 'success') {
            console.log('[OAuth] ✅ Authentication successful!');
            // Loading state will be cleared by auth state change
          } else {
            console.log('[OAuth] ⚠️ User cancelled or dismissed');
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error('[OAuth] ❌ Failed:', error);
      if (error.code === 'ERR_CANCELED') {
        console.log('[OAuth] ⚠️ User cancelled');
      } else {
        showAlert('Error', error.message || 'Failed to sign in with Apple');
      }
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      showAlert('Error', 'Please enter your full name');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters long');
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
          options: {
            data: {
              full_name: fullName.trim()
            }
          }
        });

        if (error) {
          console.error('[LoginScreen] Signup error:', error);
          throw error;
        }

        if (data) {
          if (data.user && !data.user.email_confirmed_at) {
            showAlert(
              'Confirm Your Email',
              'Please check your email and click the confirmation link to complete your registration.',
              () => setIsSignUp(false)
            );
            setIsSignUp(false);
          } else {
            await new Promise((resolve) => setTimeout(resolve, 200));
            await createProfileForCurrentUser({ full_name: fullName.trim() });
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
          console.log('[LoginScreen] Signin successful');
          await new Promise((resolve) => setTimeout(resolve, 200));
          await createProfileForCurrentUser({});
          await fetchUserData();
        } else {
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
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* App Logo/Title */}
            <View style={styles.header}>
              <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
              <Text style={styles.subtitle}>{APP_CONFIG.TAGLINE}</Text>
            </View>

            {/* Main Form Card */}
            <View style={styles.formCard}>
              <View style={styles.form}>
                {/* Name Field (Sign Up Only) */}
                {isSignUp && (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#666"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                )}

                {/* Email Field */}
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
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
                </View>

                {/* Password Field */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Field (Sign Up Only) */}
                {isSignUp && (
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#666"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCorrect={false}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Main Action Button */}
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  {loading ? (
                    <SharkAnimation size={24} color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {isSignUp ? 'Sign Up' : 'Sign In'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialButtonsContainer}>
                  {/* Google Sign-In Button - Official Branding */}
                  <TouchableOpacity
                    style={[styles.googleButton, loading && styles.buttonDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    activeOpacity={1}
                  >
                    <Image
                      source={{
                        uri: 'https://developers.google.com/identity/images/g-logo.png',
                      }}
                      style={styles.googleLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>

                  {/* Apple Sign-In Button - Official Branding */}
                  <TouchableOpacity
                    style={[styles.appleButton, loading && styles.buttonDisabled]}
                    onPress={handleAppleSignIn}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-apple" size={20} color="#fff" />
                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                  </TouchableOpacity>
                </View>

                {/* Switch Mode Button */}
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setIsSignUp(!isSignUp)}
                  disabled={loading}
                >
                  <Text style={styles.switchText}>
                    {isSignUp
                      ? 'Already have an account? Sign In'
                      : 'Need an account? Sign Up'}
                  </Text>
                </TouchableOpacity>

                {/* Forgot Password Link */}
                {!isSignUp && (
                  <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={handlePasswordReset}
                    disabled={loading}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
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
    paddingVertical: DIMENSIONS.PADDING_XXL,
  },
  header: {
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_XL,
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
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: DIMENSIONS.RADIUS_XL,
    padding: DIMENSIONS.PADDING_XL,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  form: {
    gap: DIMENSIONS.SPACE_LG,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: DIMENSIONS.RADIUS_MD,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: DIMENSIONS.PADDING_MD,
  },
  inputIcon: {
    marginRight: DIMENSIONS.SPACE_SM,
  },
  input: {
    flex: 1,
    paddingVertical: DIMENSIONS.PADDING_MD,
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#fff',
  },
  eyeIcon: {
    padding: DIMENSIONS.PADDING_XS,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: DIMENSIONS.SPACE_SM,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: DIMENSIONS.PADDING_MD,
    fontSize: TYPOGRAPHY.SIZE_SM,
  },
  socialButtonsContainer: {
    gap: DIMENSIONS.SPACE_MD,
  },
  // Google Sign-In Button - Official Style
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingVertical: DIMENSIONS.PADDING_MD,
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: DIMENSIONS.SPACE_MD,
    backgroundColor: 'transparent',
  },
  googleButtonText: {
    color: '#3c4043',
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  // Apple Sign-In Button - Official Style
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingVertical: DIMENSIONS.PADDING_MD,
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    borderWidth: 1,
    borderColor: '#000',
  },
  appleButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: '600',
    marginLeft: DIMENSIONS.SPACE_SM,
    letterSpacing: 0.25,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACE_MD,
  },
  switchText: {
    color: '#007AFF',
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: DIMENSIONS.SPACE_XS,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: TYPOGRAPHY.SIZE_MD,
    textDecorationLine: 'underline',
  },
});
