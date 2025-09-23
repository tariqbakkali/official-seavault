import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Camera, User, Lock, Trash2, AlertCircle, Mail, AtSign } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { supabase, uploadImage } from '@/services/supabase';
import { Profile } from '@/types/database';
import ImageWithFallback from '@/components/ImageWithFallback';
import { AuthError } from '@supabase/auth-js';
import { useAuthStore } from '@/stores/auth'; // Updated import
import { useDataStore } from '@/stores/data'; // Updated import

export default function EditProfileScreen() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const [avatarUploadError, setAvatarUploadError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const insets = useSafeAreaInsets();
  
  // Use the new stores instead of services
  const { updateEmail } = useAuthStore();
  const { fetchUserData, updateUserProfile } = useDataStore();

  React.useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Fetch user data directly from Supabase
      const userData = await fetchUserData(); // Updated usage
      if (userData?.profile) {
        setProfile(userData.profile);
        setFullName(userData.profile.full_name || '');
        setEmail(userData.profile.email || '');
        setAvatarUri(userData.profile.avatar_url);
        setAvatarUploadError(false); // Reset error state when loading
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatarUri(result.assets[0].uri);
        setAvatarUploadError(false); // Reset error state when selecting new image
        console.log('Image selected, URI:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    // Validate email if it has been changed
    if (email !== profile.email && !isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to update profile');
        return;
      }

      let avatarUrl = profile.avatar_url;

      // Upload new avatar if changed
      if (avatarUri && avatarUri !== profile.avatar_url && avatarUri.startsWith('file://')) {
        console.log('Uploading new avatar:', avatarUri);
        const imagePath = `avatars/${user.id}/${Date.now()}.jpg`;
        const uploadedUrl = await uploadImage(avatarUri, 'avatars', imagePath);
        console.log('Upload result:', uploadedUrl);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
          setAvatarUploadError(false); // Clear error if upload succeeds
        } else {
          console.error('Failed to upload image');
          setAvatarUploadError(true); // Set error state
          // Ask user if they want to continue without avatar
          return new Promise<void>((resolve) => {
            Alert.alert(
              'Avatar Upload Failed',
              'Failed to upload profile picture. Do you want to save your other changes without updating your avatar?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve()
                },
                {
                  text: 'Save Without Avatar',
                  style: 'default',
                  onPress: async () => {
                    try {
                      // Continue with profile update without avatar
                      const updatedProfile = {
                        full_name: fullName.trim(),
                        email: email.trim(),
                        avatar_url: profile.avatar_url, // Keep existing avatar
                      };

                      const result = await updateUserProfile(updatedProfile); // Updated usage

                      if (!result) throw new Error('Failed to update profile');

                      // If email has changed, update auth email as well
                      if (email !== profile.email) {
                        const { success, message, requiresEmailConfirmation } = await updateEmail(email.trim()); // Updated usage

                        if (!success) {
                          console.error('Failed to update auth email:', message);
                          Alert.alert(
                            'Warning', 
                            'Profile updated but email update failed. You may need to verify your new email address.'
                          );
                        } else if (requiresEmailConfirmation) {
                          Alert.alert(
                            'Email Update Required', 
                            'We have sent a confirmation email to your new address. Please check your email to confirm the change.'
                          );
                        }
                      }

                      Alert.alert('Success', 'Profile updated successfully (without avatar)', [
                        { text: 'OK', onPress: () => router.back() }
                      ]);
                    } catch (error: any) {
                      if (error instanceof AuthError) {
                        Alert.alert('Error', error.message || 'Failed to update profile');
                      } else {
                        Alert.alert('Error', 'An unexpected error occurred');
                      }
                    } finally {
                      setSaving(false);
                      resolve();
                    }
                  }
                }
              ]
            );
          });
        }
      }

      // Update profile with new avatar or existing avatar
      const updatedProfile = {
        full_name: fullName.trim(),
        email: email.trim(),
        avatar_url: avatarUrl,
      };

      const result = await updateUserProfile(updatedProfile); // Updated usage

      if (!result) throw new Error('Failed to update profile');

      // If email has changed, update auth email as well
      if (email !== profile.email) {
        const { success, message, requiresEmailConfirmation } = await updateEmail(email.trim()); // Updated usage

        if (!success) {
          console.error('Failed to update auth email:', message);
          Alert.alert(
            'Warning', 
            'Profile updated but email update failed. You may need to verify your new email address.'
          );
        } else if (requiresEmailConfirmation) {
          Alert.alert(
            'Email Update Required', 
            'We have sent a confirmation email to your new address. Please check your email to confirm the change.'
          );
        }
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      if (error instanceof AuthError) {
        Alert.alert('Error', error.message || 'Failed to update profile');
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Alert.alert('Success', 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // First sign out the user
              await authService.signOut();
              
              // Then delete the account
              const { error } = await supabase.auth.admin.deleteUser(profile?.id || '');
              
              if (error) throw error;
              
              Alert.alert('Success', 'Account deleted successfully');
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            }
          }
        }
      ]
    );
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://seavault.app/privacy');
  };

  const handleOpenTermsOfService = () => {
    Linking.openURL('https://seavault.app/terms');
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handlePickImage}>
              <ImageWithFallback
                uri={avatarUri}
                style={styles.avatar}
                containerStyle={styles.avatarWrapper}
                fallbackColor="#333"
              />
              <View style={styles.cameraIcon}>
                <Camera size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            {avatarUploadError && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#FF3B30" />
                <Text style={styles.errorText}>Failed to upload image</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <User size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#666"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
            <View style={styles.inputContainer}>
              <AtSign size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                placeholderTextColor="#666"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
            </View>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#666"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={handleChangePassword}
            disabled={saving}
          >
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.button, styles.dangerButton]}
            onPress={handleDeleteAccount}
          >
            <Trash2 size={20} color="#FF3B30" style={styles.buttonIcon} />
            <Text style={[styles.buttonText, styles.dangerButtonText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity onPress={handleOpenPrivacyPolicy}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenTermsOfService}>
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  inputGroup: {
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#1a1a1a',
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dangerButtonText: {
    color: '#FF3B30',
  },
  buttonIcon: {
    // For icon positioning
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginVertical: 8,
  },
});